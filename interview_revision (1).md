# Interview Revision — C#/.NET + SQL
**For a junior developer who knows JS and C++**

---

## 1. DEPENDENCY INJECTION (DI)

### The Core Problem DI Solves

Imagine you're writing `EmployeeService` and it needs a database repository. The naive approach:

```csharp
public class EmployeeService
{
    private readonly EmployeeRepository _repo;

    public EmployeeService()
    {
        _repo = new EmployeeRepository(); // hardcoded dependency
    }
}
```

This looks fine until you realize:
- You can't test `EmployeeService` without a real database — `EmployeeRepository` always needs one
- If you want to swap `EmployeeRepository` for a different implementation (e.g., a mock, or a different DB provider), you have to modify `EmployeeService` itself
- `EmployeeService` now knows *how* to construct its dependency — that's not its job

### The DI Solution

Don't construct dependencies — declare what you need and let something else provide them:

```csharp
public class EmployeeService
{
    private readonly IEmployeeRepository _repo;

    // "I need something that implements IEmployeeRepository — I don't care which"
    public EmployeeService(IEmployeeRepository repo)
    {
        _repo = repo;
    }
}
```

Now `EmployeeService` doesn't know or care whether it's talking to SQLite, SQL Server, or a fake in-memory mock. It just calls interface methods.

The **DI container** (built into .NET) is responsible for:
1. Reading your registrations in `Program.cs`
2. Knowing which concrete class implements which interface
3. Creating instances and injecting them automatically when needed

### Registering Services

```csharp
// Program.cs
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
// "When someone asks for IEmployeeRepository, give them an EmployeeRepository"

builder.Services.AddScoped<IEmployeeService, EmployeeService>();
// "When someone asks for IEmployeeService, give them an EmployeeService"
// EmployeeService itself needs IEmployeeRepository — the container handles that too (chain)
```

### DI Lifetimes — The Most Important Part

This is almost always asked. The three lifetimes control *when* the container creates a new instance.

**Transient** — new instance every single time something requests it
```csharp
builder.Services.AddTransient<IEmailService, EmailService>();
```
Use for: Stateless services that do one job and are done. An email sender, a formatter, a validator. Cheap to create, no shared state.

**Scoped** — one instance per HTTP request, shared within that request
```csharp
builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddDbContext<AppDbContext>(); // DbContext is always Scoped
```
Use for: DbContext — because one request should share one database connection and one change tracker. If DbContext were Transient, every repository call in one request would use a different DbContext — changes wouldn't be tracked together. If it were Singleton, one DbContext would be shared across all requests simultaneously — entity tracking would corrupt across users.

**Singleton** — one instance for the entire application lifetime
```csharp
builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
```
Use for: Config, caches, anything that is expensive to create and safe to share across all requests. Must be thread-safe since many requests access it simultaneously.

### The DbContext Rule
> DbContext must always be **Scoped**. It's the most common DI mistake.

### Why Interfaces?
You register `IEmployeeRepository → EmployeeRepository`. Why not just register `EmployeeRepository` directly?

Because when writing unit tests, you want to inject a fake `MockEmployeeRepository` that returns hardcoded data without a real database. Your code only depends on `IEmployeeRepository`, so the test can inject the mock and the service never knows the difference. This is the entire value proposition of DI.

### Interview Answer
> "DI means a class declares what it needs in its constructor instead of creating it with `new`. The .NET DI container reads your registrations and automatically provides the right implementation. The three lifetimes are Transient (new instance every time), Scoped (once per HTTP request — used for DbContext), and Singleton (once for the app — used for caches). The biggest benefit is testability — you inject a mock instead of a real database when testing."

---

## 2. MIDDLEWARE

### What Problem Does It Solve?

In a real app, every request needs the same set of operations done to it before your controller runs: log it, redirect to HTTPS, check who the user is, check if they're allowed. You don't want to copy-paste that logic into every controller. Instead, you wrap every request in a **pipeline** of reusable components.

### How It Works

The pipeline is a chain. Each middleware receives the request, does its work, calls `next()` to pass it forward, and when the chain returns, can do more work on the way back. Think of it like a series of `try { next() } finally { cleanup }` blocks nested around your controller.

```
Request →  [MW1]  →  [MW2]  →  [MW3]  →  Controller
           ↑                              |
Response ← [MW1] ←  [MW2]  ←  [MW3]  ← /
```

Each middleware runs *before* passing forward and can optionally run code *after* the rest of the chain completes. This is why response headers, logging of response codes, and timing measurements are done in middleware — they need both the request and the response.

### Registration Order in Program.cs

```csharp
app.UseHttpsRedirection();  // 1. Redirect HTTP to HTTPS — should be first
app.UseRouting();           // 2. Figure out which endpoint matches this URL
app.UseAuthentication();    // 3. Decode the JWT/cookie — WHO is this user?
app.UseAuthorization();     // 4. Check if this user has permission — must come AFTER auth
app.MapControllers();       // 5. Call the matched controller action
app.Run();
```

Order is critical because each middleware assumes the previous ones have already run. Authorization assumes authentication already set the user identity. Routing assumes HTTPS redirection has already happened.

### Custom Middleware — What It Looks Like

```csharp
public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;
    // RequestDelegate = a function representing the rest of the pipeline

    public RequestTimingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var start = DateTime.UtcNow;

        // Everything before this line runs BEFORE the controller
        await _next(context); // pass to next middleware / controller
        // Everything after this line runs AFTER the controller responds

        var elapsed = DateTime.UtcNow - start;
        Console.WriteLine($"{context.Request.Path} took {elapsed.TotalMilliseconds}ms");
    }
}

// Register in Program.cs
app.UseMiddleware<RequestTimingMiddleware>();
```

### Middleware vs Filters — Key Distinction
Middleware sits at the HTTP pipeline level — it sees raw `HttpContext`. It runs for *every* request, including static files, health checks, etc.

Filters sit at the MVC level — they only run for requests that reach a controller action, and they have access to richer context (action name, arguments, model state). Use filters when you need controller-specific behavior.

### What You Use Middleware For
Logging, HTTPS enforcement, authentication, authorization, CORS headers, rate limiting, global error handling, request/response compression. Basically anything that must apply uniformly to all requests.

### Interview Answer
> "Middleware is a component in the ASP.NET Core pipeline. Every HTTP request passes through the pipeline in order, and responses pass back through in reverse. Each middleware can inspect and modify both. Order matters — authentication must come before authorization because you need to know who the user is before checking their permissions. You use it for cross-cutting concerns: logging, error handling, CORS, auth."

---

## 3. FILTERS

### How Filters Differ from Middleware

Middleware runs at the HTTP pipeline level — it only has access to `HttpContext` (the raw request/response). Filters run inside the MVC framework, after a controller and action have been matched, so they have access to:
- The controller instance
- The action method name and parameters
- Model binding results (validated input)
- The action's return value

This makes filters much more useful for MVC-specific concerns.

### The 5 Filter Types and When They Run

**1. Authorization Filter** — runs first, before anything else
```csharp
// Checks: is this user allowed to call this action?
// If not — short-circuits the whole pipeline immediately
// [Authorize] attribute uses this filter under the hood
```
Use for: Custom permission checks, API key validation.

**2. Resource Filter** — runs after auth, before model binding
```csharp
// Model binding = parsing request body/query params into action parameters
// Resource filters can short-circuit before that expensive parsing happens
```
Use for: Response caching (return cached result before hitting the controller), blocking requests early based on headers.

**3. Action Filter** — runs before and after the controller action method
```csharp
public class LogActionFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        // Before action — context.ActionArguments has the parsed parameters
        Console.WriteLine($"Action: {context.ActionDescriptor.DisplayName}");
        Console.WriteLine($"Args: {context.ActionArguments["id"]}");
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        // After action — context.Result has the return value
        Console.WriteLine("Action finished");
    }
}
```
Use for: Logging with action details, input validation, modifying action arguments.

**4. Exception Filter** — runs when an unhandled exception escapes the action
```csharp
public class GlobalExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        // context.Exception = the thrown exception
        // Set context.Result to prevent the default error response
        context.Result = new ObjectResult(new { error = "Something went wrong" })
        {
            StatusCode = 500
        };
        context.ExceptionHandled = true; // prevents the exception from bubbling up
    }
}
```
Use for: Catch all unhandled exceptions and return a clean JSON error response instead of a stack trace. Apply globally so every controller benefits.

**5. Result Filter** — runs before and after the action result is serialized and sent
```csharp
// Action returns Ok(employee) → this creates an ObjectResult
// Result filter runs before/after that ObjectResult is written to the response
```
Use for: Adding response headers, wrapping responses in a standard envelope format.

### Order of Execution (Full Picture)
```
Authorization → Resource → Action (before) → Controller → Action (after) → Result → Response
                                                               ↑
                                               Exception Filter if exception thrown
```

### Registration
```csharp
// Globally (applies to all controllers)
builder.Services.AddControllers(options => {
    options.Filters.Add<GlobalExceptionFilter>();
    options.Filters.Add<LogActionFilter>();
});

// Per controller or action (attribute)
[ServiceFilter(typeof(LogActionFilter))]
public class EmployeesController : ControllerBase { }
```

### Interview Answer
> "There are 5 filter types in ASP.NET Core MVC: Authorization runs first and checks permissions. Resource runs after auth and can short-circuit for caching. Action runs before and after the controller method — good for logging and validation. Exception catches unhandled exceptions and returns consistent error responses. Result runs around the response serialization. Filters differ from middleware in that they run inside the MVC layer and have access to action arguments and results, not just the raw HTTP context."

---

## 4. LINQ

### What LINQ Actually Is

LINQ (Language Integrated Query) is a set of extension methods on `IEnumerable<T>` and `IQueryable<T>` that let you express data queries in C# rather than a separate query language.

When you use LINQ on an in-memory `List<T>`, it executes in C# (LINQ to Objects).
When you use LINQ on a `DbSet<T>` (EF Core), it translates your C# expression tree to SQL and runs it on the database (LINQ to Entities).

This is the key insight: the *same* LINQ syntax works on both in-memory collections and databases. EF Core's job is translating it.

### Deferred Execution — Understand This Deeply

LINQ queries are not executed when you write them. They build an **expression tree** — a description of what you want to do. The query only executes when you iterate the results.

```csharp
// This does NOTHING yet — just builds a description
var query = _context.Employees
    .Where(e => e.Salary > 3000)
    .OrderBy(e => e.Name);

// The SQL is sent to the database HERE
var results = await query.ToListAsync();

// Or here
var first = await query.FirstOrDefaultAsync();

// Or here (in a foreach)
await foreach (var emp in query.AsAsyncEnumerable()) { }
```

Why does this matter? Because you can compose queries:
```csharp
var query = _context.Employees.Where(e => e.DepartmentId == deptId);

if (searchTerm != null)
    query = query.Where(e => e.Name.Contains(searchTerm)); // adds to query

if (sortBySalary)
    query = query.OrderByDescending(e => e.Salary);

var results = await query.ToListAsync(); // one SQL query, however you built it
```

### Core Methods — All You Need

```csharp
// WHERE — filter rows
employees.Where(e => e.Salary > 3000)

// SELECT — project to different shape
employees.Select(e => new { e.Id, e.Name })
employees.Select(e => e.Name) // List<string>

// ORDERBY / ORDERBYDESCENDING
employees.OrderBy(e => e.Name)
employees.OrderByDescending(e => e.Salary)
employees.OrderBy(e => e.DeptId).ThenBy(e => e.Name) // multi-column sort

// TAKE / SKIP — pagination
employees.Take(10)           // first 10
employees.Skip(10).Take(10)  // second page of 10

// FIRST vs FIRSTORDEFAULT
employees.First(e => e.Id == 5)            // throws if not found
employees.FirstOrDefault(e => e.Id == 5)   // returns null if not found — prefer this

// SINGLE vs SINGLEORDEFAULT
employees.Single(e => e.Id == 5)           // throws if 0 or more than 1 found
employees.SingleOrDefault(e => e.Id == 5)  // null if 0, throws if 2+

// ANY / ALL
employees.Any(e => e.Salary > 5000)        // true if at least one matches
employees.All(e => e.Salary > 0)           // true if ALL match

// COUNT / SUM / AVERAGE / MIN / MAX
employees.Count(e => e.Salary > 3000)
employees.Sum(e => e.Salary)
employees.Average(e => e.Salary)
employees.Min(e => e.Salary)
employees.Max(e => e.Salary)

// GROUPBY — produces groups, not a flat list
employees
    .GroupBy(e => e.DepartmentId)
    .Select(g => new {
        DeptId = g.Key,           // the value you grouped by
        Count = g.Count(),        // aggregate over the group
        AvgSalary = g.Average(e => e.Salary)
    })

// INCLUDE — EF Core only, eager-load related data
_context.Employees.Include(e => e.Department)
_context.Employees.Include(e => e.Department).ThenInclude(d => d.Manager) // nested
```

### LINQ vs SQL Side by Side

| SQL | LINQ |
|-----|------|
| `SELECT name, salary FROM employees` | `.Select(e => new { e.Name, e.Salary })` |
| `WHERE salary > 3000` | `.Where(e => e.Salary > 3000)` |
| `ORDER BY name ASC` | `.OrderBy(e => e.Name)` |
| `ORDER BY salary DESC` | `.OrderByDescending(e => e.Salary)` |
| `LIMIT 10` | `.Take(10)` |
| `OFFSET 10 LIMIT 10` | `.Skip(10).Take(10)` |
| `COUNT(*)` | `.Count()` |
| `GROUP BY dept_id` | `.GroupBy(e => e.DeptId)` |
| `JOIN departments ON dept_id = d.id` | `.Include(e => e.Department)` (EF Core) |

### Interview Answer
> "LINQ is a set of extension methods that let you query collections and databases with C# instead of separate query languages. On an in-memory list it runs in C#. On a DbSet it translates to SQL — same syntax, different execution. Queries are deferred — they only execute when you call ToList, FirstOrDefault, etc. This lets you compose queries conditionally before executing. The most common methods are Where, Select, OrderBy, FirstOrDefault, GroupBy, and Include for loading related data."

---

## 5. ENTITY FRAMEWORK CORE (EF CORE)

### What Is an ORM and Why Use One?

Without EF Core, you'd write raw SQL strings in C# and manually map the results to objects:
```csharp
var cmd = new SqlCommand("SELECT Id, Name, Salary FROM Employees WHERE Id = @id");
cmd.Parameters.AddWithValue("@id", id);
var reader = cmd.ExecuteReader();
var emp = new Employee { Id = (int)reader["Id"], Name = (string)reader["Name"] };
```

This is tedious, error-prone, and doesn't type-check at compile time. EF Core eliminates this entirely — you work with C# objects, and EF handles the SQL.

### Models and Conventions

EF Core uses **conventions** to infer your schema from class structure:
- A property named `Id` or `{ClassName}Id` → Primary Key
- A property of type `int` PK → auto-increments
- A property named `{EntityName}Id` → Foreign Key
- A property of the related entity type → Navigation Property

```csharp
public class Employee
{
    public int Id { get; set; }               // PK by convention
    public string Name { get; set; } = null!; // = null! tells compiler "trust me, won't be null"
    public decimal Salary { get; set; }
    public DateTime HiredAt { get; set; }

    public int DepartmentId { get; set; }           // FK by convention
    public Department Department { get; set; } = null!; // Navigation property
}

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<Employee> Employees { get; set; } = []; // reverse navigation
}
```

### DbContext — Your Database Session

DbContext is the unit of work and the database session. It:
- Holds database connection
- Tracks which entities have changed
- Translates LINQ to SQL
- Manages transactions (SaveChanges is one transaction)

```csharp
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Employee> Employees { get; set; }   // maps to Employees table
    public DbSet<Department> Departments { get; set; } // maps to Departments table
}
```

Registration:
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));
// DbContext is Scoped by default when registered this way
```

### Change Tracking

When you load an entity, EF Core **tracks** it. If you modify a property and call `SaveChangesAsync()`, EF detects the change and generates an UPDATE automatically:

```csharp
var emp = await _context.Employees.FindAsync(id);
emp.Salary = 5000; // EF tracks this change
await _context.SaveChangesAsync(); // generates: UPDATE Employees SET Salary=5000 WHERE Id=@id
```

No explicit "update" call needed — just mutate the object and save.

### The N+1 Problem — Must Know

This is the #1 EF Core interview question.

**The scenario:** You load a list of employees, then access a navigation property on each one.

```csharp
var employees = await _context.Employees.ToListAsync();
// SQL: SELECT * FROM Employees — 1 query, 100 rows

foreach (var emp in employees)
{
    Console.WriteLine(emp.Department.Name);
    // EF sees Department is not loaded yet, fires:
    // SQL: SELECT * FROM Departments WHERE Id = 3
    // SQL: SELECT * FROM Departments WHERE Id = 3 (again, different emp)
    // SQL: SELECT * FROM Departments WHERE Id = 7
    // ... 100 more queries
}
// Total: 101 queries for 100 employees
```

**The fix:** Eager loading with `Include()` — tells EF to JOIN in a single query:

```csharp
var employees = await _context.Employees
    .Include(e => e.Department) // SQL: SELECT ... FROM Employees JOIN Departments
    .ToListAsync();             // 1 query total

foreach (var emp in employees)
{
    Console.WriteLine(emp.Department.Name); // already loaded, no query
}
```

### Migrations

When your model changes, you need to update the database schema. Migrations are the mechanism:

```bash
dotnet ef migrations add AddSalaryColumn  # generates a migration file with Up() and Down()
dotnet ef database update                  # runs pending migrations against the database
```

EF compares your current models against the last migration snapshot and generates the SQL diff.

### Interview Answer
> "EF Core is an ORM — it maps C# classes to database tables so you work with objects instead of raw SQL. A DbContext represents a database session and tracks changes to entities. When you modify a loaded entity and call SaveChangesAsync, EF detects the changes and generates the SQL. The most important pattern is using Include() to prevent the N+1 problem — without it, accessing a navigation property in a loop fires a separate query for every row. Migrations handle schema changes by diffing your model against the last snapshot."

---

## 6. C# KEYWORDS

Your friend said he asks this lightly. Know each one conceptually, not just the definition.

### `static`

A `static` member belongs to the **type itself**, not any instance. You call it on the class name, not on an object.

```csharp
public static class StringExtensions
{
    public static bool IsNullOrEmpty(string s) => s == null || s.Length == 0;
}

StringExtensions.IsNullOrEmpty(""); // called on the class, no 'new'
```

A `static class` cannot be instantiated at all — it's just a container for utility methods. Common for helpers, extension methods, constants. You'll see it in `Program.cs` — in older .NET the entry point was `static void Main()`.

### `partial`

A `partial` class can be **split across multiple files** — they compile into a single class. Useful when you want to separate auto-generated code from hand-written code so regenerating one part doesn't overwrite the other.

```csharp
// Employee.cs — your hand-written logic
public partial class Employee
{
    public string GetDisplayName() => $"{Name} ({Department?.Name})";
}

// Employee.Generated.cs — auto-generated by a tool
public partial class Employee
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
}
```

EF Core migrations use partial classes for exactly this reason.

### `abstract`

An `abstract` class defines a **template** — it can have real implemented methods, but some methods are marked abstract (no body), forcing subclasses to implement them. You cannot instantiate an abstract class directly.

```csharp
public abstract class Repository<T>
{
    protected readonly AppDbContext _context;

    public Repository(AppDbContext context) { _context = context; }

    // Concrete method — shared implementation
    public async Task SaveAsync() => await _context.SaveChangesAsync();

    // Abstract method — each subclass must implement this differently
    public abstract Task<T?> GetByIdAsync(int id);
}

public class EmployeeRepository : Repository<Employee>
{
    public EmployeeRepository(AppDbContext context) : base(context) { }

    public override async Task<Employee?> GetByIdAsync(int id)
        => await _context.Employees.Include(e => e.Department).FirstOrDefaultAsync(e => e.Id == id);
}
```

Use `abstract` when you have shared behavior but one or more methods must behave differently per subclass. It's different from an interface — abstract classes can have state and implemented methods.

### `sealed`

`sealed` prevents a class from being inherited. A sealed class is the **final implementation** — no subclass can extend it.

```csharp
public sealed class PaymentProcessor
{
    // No one can extend this — behavior is fixed
}
```

You also seal individual `override` methods to prevent further overriding down the inheritance chain. Often used for security-critical or performance-sensitive code.

### `readonly`

A `readonly` field can only be assigned in the **constructor** (or at declaration). After construction, it's immutable.

```csharp
public class EmployeeService
{
    private readonly IEmployeeRepository _repo;
    // '_repo' can only be set in the constructor below — never reassigned elsewhere

    public EmployeeService(IEmployeeRepository repo)
    {
        _repo = repo; // OK
    }

    public void DoSomething()
    {
        _repo = null; // COMPILE ERROR — readonly field
    }
}
```

You'll see `private readonly` everywhere in .NET services. It's the idiomatic way to store injected dependencies — signals to readers "this never changes after construction."

### `record`

A `record` is a reference type (like a class) but with **value-based equality** and immutability by default. Two records with the same property values are considered equal.

```csharp
public record EmployeeDto(int Id, string Name, decimal Salary);

var a = new EmployeeDto(1, "Marino", 3000);
var b = new EmployeeDto(1, "Marino", 3000);

Console.WriteLine(a == b);      // true — value equality
Console.WriteLine(a.Equals(b)); // true

// With a regular class, both would be false (reference equality)
```

Records are ideal for DTOs and data containers where you care about the *values*, not object identity. They also get a free `ToString()` that prints all properties.

### Quick Reference

| Keyword | One-liner | When to use |
|---------|-----------|-------------|
| `static` | Belongs to the type, not an instance | Utility methods, constants, extension methods |
| `partial` | Class split across multiple files | Auto-generated code + hand-written logic |
| `abstract` | Template class — some methods must be overridden | Base classes with shared + customizable behavior |
| `sealed` | Cannot be inherited | Final implementations, security/perf-critical classes |
| `readonly` | Set once in constructor, immutable after | Injected dependencies, config values |
| `record` | Value equality, immutable data object | DTOs, value objects, data transfer |

---

## 7. SOLID PRINCIPLES

SOLID is a set of 5 design principles for writing maintainable, flexible object-oriented code. Each letter is a principle. You'll be asked to explain them — know all 5 with a real example each.

### S — Single Responsibility Principle (SRP)

**A class should have only one reason to change.**

In other words: a class should do one thing. If it does multiple things, changes to one responsibility might break the other.

**Bad:**
```csharp
public class EmployeeService
{
    public Employee GetById(int id) { /* DB query */ }
    public void SendWelcomeEmail(Employee emp) { /* SMTP logic */ }
    public string GeneratePdfReport(Employee emp) { /* PDF generation */ }
}
```

`EmployeeService` now changes if: the database query logic changes, the email template changes, or the PDF format changes. Three reasons to change = three responsibilities.

**Good:**
```csharp
public class EmployeeService   { public Employee GetById(int id) { } }
public class EmailService      { public void SendWelcomeEmail(Employee emp) { } }
public class ReportService     { public string GeneratePdfReport(Employee emp) { } }
```

Each class has one job. Changes are isolated.

### O — Open/Closed Principle (OCP)

**Classes should be open for extension, closed for modification.**

You should be able to add new behavior without modifying existing code. New behavior comes from adding new classes, not editing old ones.

**Bad:**
```csharp
public class DiscountCalculator
{
    public decimal Calculate(string customerType, decimal price)
    {
        if (customerType == "Regular") return price * 0.95m;
        if (customerType == "VIP") return price * 0.80m;
        if (customerType == "Employee") return price * 0.60m;
        // Adding a new type = modifying this method = risky
        return price;
    }
}
```

Every new customer type requires editing this method — breaking existing logic.

**Good:**
```csharp
public interface IDiscountStrategy
{
    decimal Calculate(decimal price);
}

public class RegularDiscount : IDiscountStrategy
{
    public decimal Calculate(decimal price) => price * 0.95m;
}

public class VipDiscount : IDiscountStrategy
{
    public decimal Calculate(decimal price) => price * 0.80m;
}

// Adding a new type = add a new class, touch nothing existing
public class EmployeeDiscount : IDiscountStrategy
{
    public decimal Calculate(decimal price) => price * 0.60m;
}
```

### L — Liskov Substitution Principle (LSP)

**Subclasses should be substitutable for their base class without breaking the program.**

If you have code that works with a base class `Animal`, it should work with any subclass `Dog`, `Cat`, etc. without knowing which one it is. If a subclass breaks the expected behavior, it violates LSP.

**Bad:**
```csharp
public class Rectangle
{
    public virtual int Width { get; set; }
    public virtual int Height { get; set; }
    public int Area() => Width * Height;
}

public class Square : Rectangle
{
    // A square forces width == height — overrides break the contract
    public override int Width { set { base.Width = base.Height = value; } }
    public override int Height { set { base.Width = base.Height = value; } }
}

// This breaks when you use Square as a Rectangle:
Rectangle r = new Square();
r.Width = 4;
r.Height = 5;
Console.WriteLine(r.Area()); // Expected 20, got 25 — Square changed Height when Width was set
```

The subclass violated the expected behavior of the base class. Fix: don't inherit — use a shared interface instead.

**Simple rule:** If overriding a method requires you to weaken guarantees or make it do less than the base class promises, LSP is violated.

### I — Interface Segregation Principle (ISP)

**Don't force classes to implement interfaces they don't use.**

A fat interface with many methods forces all implementors to implement methods they may not need, often with empty or throwing stubs.

**Bad:**
```csharp
public interface IEmployee
{
    void Work();
    void ManageTeam();  // Not all employees manage teams
    void ApproveLeave(); // Not all employees approve leave
}

public class JuniorDeveloper : IEmployee
{
    public void Work() { /* makes sense */ }
    public void ManageTeam() { throw new NotImplementedException(); } // forced to implement
    public void ApproveLeave() { throw new NotImplementedException(); } // meaningless
}
```

**Good:**
```csharp
public interface IWorker       { void Work(); }
public interface IManager      { void ManageTeam(); void ApproveLeave(); }

public class JuniorDeveloper : IWorker { public void Work() { } }
public class TeamLead : IWorker, IManager { public void Work() { } public void ManageTeam() { } public void ApproveLeave() { } }
```

Clients only depend on what they actually need.

### D — Dependency Inversion Principle (DIP)

**High-level modules should not depend on low-level modules. Both should depend on abstractions.**

This is what DI is built on. Your `EmployeeService` (high-level) should not depend on `SqlEmployeeRepository` (low-level concrete). Both should depend on `IEmployeeRepository` (abstraction).

```csharp
// Without DIP (bad) — high-level depends on low-level
public class EmployeeService
{
    private SqlEmployeeRepository _repo = new SqlEmployeeRepository(); // concrete
}

// With DIP (good) — both depend on abstraction
public interface IEmployeeRepository { Task<Employee?> GetByIdAsync(int id); }
public class SqlEmployeeRepository : IEmployeeRepository { /* implementation */ }
public class EmployeeService
{
    private readonly IEmployeeRepository _repo; // abstraction
    public EmployeeService(IEmployeeRepository repo) { _repo = repo; }
}
```

If you ever need to swap SQL for MongoDB, you add a `MongoEmployeeRepository : IEmployeeRepository` — `EmployeeService` doesn't change at all.

### SOLID Quick Reference

| Letter | Principle | One-liner |
|--------|-----------|-----------|
| **S** | Single Responsibility | One class, one job, one reason to change |
| **O** | Open/Closed | Add behavior by adding code, not editing existing code |
| **L** | Liskov Substitution | Subclass should work wherever the base class is expected |
| **I** | Interface Segregation | Don't force implementations of methods they won't use |
| **D** | Dependency Inversion | Depend on interfaces, not concrete implementations |

### Interview Answer
> "SOLID is five design principles for maintainable OOP code. S: a class does one thing. O: add features by extending, not modifying. L: subclasses should be drop-in replacements for their base class. I: keep interfaces small and focused so classes only implement what they need. D: depend on abstractions not concrete classes — which is exactly what DI enforces."

---

## 8. GIT — BASICS

Your friend didn't mention Git explicitly but it's assumed knowledge for any junior developer. Know the concepts and the key commands.

### What Git Does

Git is a **distributed version control system**. Every developer has a full copy of the repository history. It tracks changes to files over time, lets multiple people work on the same codebase simultaneously, and lets you merge their changes.

### Core Concepts

**Repository (repo)** — a project folder tracked by Git. Contains all files and the full history of every change ever made.

**Commit** — a snapshot of all tracked files at a point in time. Every commit has a unique hash, an author, a timestamp, and a message describing what changed.

**Branch** — a parallel line of development. `main` is the default. When you work on a feature, you create a branch so your incomplete work doesn't affect `main`. When done, you merge it back.

**Remote** — a copy of the repo hosted somewhere else (GitHub, GitLab, Azure DevOps). `origin` is the conventional name for the main remote.

**Staging area (index)** — a buffer between your working files and a commit. You explicitly stage files you want to include in the next commit with `git add`.

### Essential Commands

```bash
# Setup
git init                          # initialize a new repo in current folder
git clone https://github.com/...  # copy a remote repo locally

# Checking state
git status                        # what's changed, what's staged
git log                           # list commits (newest first)
git log --oneline                 # condensed one-line version
git diff                          # show unstaged changes

# Making commits
git add filename.cs               # stage a specific file
git add .                         # stage all changed files
git commit -m "Add employee endpoint"  # commit staged files with message

# Branches
git branch                        # list branches (* = current)
git branch feature/employee-api   # create a new branch
git checkout feature/employee-api # switch to a branch
git checkout -b feature/employee-api  # create AND switch (shorthand)
git merge feature/employee-api    # merge a branch into current branch

# Remote
git push origin main              # push commits to remote
git pull origin main              # fetch + merge remote changes
git fetch                         # download remote changes without merging

# Undoing
git restore filename.cs           # discard unstaged changes to a file
git reset HEAD~1                  # undo last commit (keeps changes staged)
git stash                         # temporarily save uncommitted changes
git stash pop                     # restore stashed changes
```

### Typical Daily Workflow

```bash
git pull origin main              # get latest changes from team
git checkout -b feature/add-search  # create feature branch
# ... write code ...
git add .
git commit -m "Add employee search by name"
git push origin feature/add-search  # push branch to remote
# Open Pull Request on GitHub — teammates review
# After approval: merge into main
```

### Merge vs Rebase

**Merge** — combines two branches by creating a merge commit. Preserves full history including the branch structure. Messy history but safe and transparent.

**Rebase** — rewrites your commits on top of another branch as if you branched from the latest point. Cleaner linear history but rewrites commits (never rebase shared/public branches).

For a junior dev: **use merge**. Know that rebase exists.

### Pull Request (PR)

A PR is not a Git feature — it's a platform feature (GitHub/GitLab). It's a request to merge your branch into `main`. It's where code review happens. Your team reviews the diff, leaves comments, and approves or requests changes before merging.

### Interview Answer
> "Git is a distributed version control system. You work on feature branches, stage changes with git add, commit them with git commit, and push to a remote. Pull requests are how code review happens before merging into main. Key commands: clone, branch, checkout, add, commit, push, pull, merge. The difference between merge and rebase is that merge creates a merge commit preserving branch history, while rebase rewrites commits for a linear history."

---

## 9. SQL THEORY QUICK REVISION

### JOINs — The Full Picture

A JOIN combines rows from two tables based on a matching condition (always the FK relationship).

**INNER JOIN** — only rows where a match exists in BOTH tables
```sql
SELECT e.name, d.name AS dept
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;
-- Employees without a department are excluded
-- Departments with no employees are excluded
```

**LEFT JOIN** — ALL rows from the left table, matching rows from right (NULL if no match)
```sql
SELECT e.name, d.name AS dept
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;
-- All employees included, even if department_id is NULL
-- Department column will be NULL for those employees
```

**RIGHT JOIN** — ALL rows from the right table (rarely used — just swap tables and use LEFT JOIN)

**FULL OUTER JOIN** — ALL rows from both tables, NULL where no match on either side

**Decision rule:**
- "All employees, with their department if they have one" → LEFT JOIN
- "Only employees who belong to a department" → INNER JOIN
- "Which departments have no employees?" → LEFT JOIN from departments to employees, `WHERE employees.id IS NULL`

### WHERE, BETWEEN, LIKE

```sql
WHERE salary > 3000
WHERE salary BETWEEN 1000 AND 5000   -- same as >= 1000 AND <= 5000 (inclusive)
WHERE hired_at BETWEEN '2020-01-01' AND '2023-12-31'
WHERE name LIKE 'Mar%'               -- starts with 'Mar'
WHERE name LIKE '%ino'               -- ends with 'ino'
WHERE name LIKE '%arin%'             -- contains 'arin'
WHERE email IS NULL                  -- null check (not = NULL!)
WHERE email IS NOT NULL
WHERE city IN ('Zagreb', 'Split', 'Rijeka')  -- multiple values
WHERE city NOT IN ('Zagreb')
```

### GROUP BY, HAVING, Aggregates

The difference between WHERE and HAVING is **when** they filter:
- `WHERE` filters individual rows **before** grouping
- `HAVING` filters **groups** after aggregation

```sql
SELECT department_id,
       COUNT(*) AS employee_count,
       AVG(salary) AS avg_salary,
       MAX(salary) AS top_salary
FROM employees
WHERE hired_at > '2020-01-01'      -- filter rows first
GROUP BY department_id              -- then group
HAVING COUNT(*) > 3                 -- then filter groups
ORDER BY avg_salary DESC;
```

Reading order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY

### Aliases

Aliases rename columns or tables in the output. Not stored anywhere — just presentation.

```sql
-- Column alias — rename output column
SELECT name AS full_name, salary AS monthly_pay FROM employees;

-- Table alias — shorthand in JOINs (essential for readability)
SELECT e.name, d.name AS department
FROM employees AS e
LEFT JOIN departments AS d ON e.department_id = d.id;

-- You can drop the AS keyword — works without it
SELECT e.name, d.name dept
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;
```

### Foreign Keys

A FK is a constraint that enforces a relationship between tables. It says "the value in this column must exist as a primary key in that other table."

```sql
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    total DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

What the database enforces:
- You can't insert an order with `customer_id = 99` if customer 99 doesn't exist → **referential integrity**
- You can't delete a customer that has orders (by default) → **cascade rules** (`ON DELETE CASCADE` would delete orders too)

Without the FK constraint, your application logic is the only thing preventing orphaned data — the database won't stop you.

### Composite Keys

A composite key is a primary key made from **multiple columns**. Used when no single column is unique but a *combination* is.

```sql
CREATE TABLE course_enrollments (
    student_id INTEGER,
    course_id INTEGER,
    semester TEXT,
    grade TEXT,
    PRIMARY KEY (student_id, course_id, semester)
    -- A student can take the same course in different semesters (OK)
    -- But can't enroll in the same course+semester twice (blocked)
);
```

Real-world examples: order line items `(order_id, line_number)`, user roles `(user_id, role_id)`, inventory `(warehouse_id, product_id)`.

### Normalization

Normalization is designing your schema to eliminate redundancy. Each level builds on the previous.

**1NF — First Normal Form: atomic values**
No column should contain a list or multiple values. Every cell = one value.

Bad: `products = "Laptop, Mouse, Keyboard"` in one cell
Good: One row per product

**2NF — Second Normal Form: full key dependency**
Only applies when you have a composite key. Every non-key column must depend on the *entire* composite key, not just part of it.

Bad: `order_items(order_id, product_id, quantity, product_price, product_name)`
`product_price` and `product_name` depend only on `product_id`, not the full key `(order_id, product_id)`

Good: Split into `order_items(order_id, product_id, quantity)` and `products(product_id, product_name, product_price)`

**3NF — Third Normal Form: no transitive dependencies**
No non-key column should depend on another non-key column.

Bad: `employees(id, name, city, country)`
`country` depends on `city`, not on `id`. If you update Zagreb's country, you update it in every row.

Good: Split into `employees(id, name, city_id)` and `cities(city_id, city_name, country)`

**Memory aid:**
- 1NF: No lists in a cell
- 2NF: Non-key columns need the whole composite key
- 3NF: Non-key columns only depend on the primary key, nothing else

---

## CHEAT SHEET — Say These Aloud Before the Interview

**DI:** "Classes declare dependencies in the constructor, the container provides them. Transient = every time, Scoped = per request, Singleton = once. DbContext is always Scoped."

**Middleware:** "A pipeline every request passes through. Order matters. Authentication before authorization. Used for logging, error handling, CORS, auth."

**Filters:** "5 types: Authorization, Resource, Action, Exception, Result. Run inside MVC layer so they have access to action context. Exception filter is most useful for returning consistent error responses."

**LINQ:** "Extension methods for querying collections and databases. Where = filter, Select = project, OrderBy = sort, FirstOrDefault = get first or null, Include = eager-load related data. Deferred execution — runs on ToList()."

**EF Core:** "ORM mapping classes to tables. DbContext is the session. Change tracking auto-detects modifications. Include() prevents N+1. Migrations handle schema changes."

**SOLID:** "S = one job. O = extend not modify. L = subclasses are drop-in replacements. I = small focused interfaces. D = depend on abstractions."

**N+1:** "Load 100 employees, access Department in a loop = 101 queries. Fix: Include() generates a JOIN."

**Normalization:** "1NF = no lists in cells. 2NF = non-key columns depend on the full composite key. 3NF = non-key columns only depend on the PK."

**Git:** "Distributed VCS. Branch for features, commit snapshots, push to remote, PR for code review, merge into main."

---

*You've got this.*
