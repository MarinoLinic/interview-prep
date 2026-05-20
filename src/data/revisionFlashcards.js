// Interview Revision — C#/.NET + SQL
// Based on the interview revision document covering DI, Middleware, Filters, LINQ, EF Core, C# Keywords, SOLID, Git, SQL

const revisionFlashcards = [
  // === 1. DEPENDENCY INJECTION ===
  {
    id: 1,
    priority: "core",
    category: "Dependency Injection",
    question: "What problem does Dependency Injection solve?",
    answer: "Without DI, a class creates its own dependencies with `new` — making it untestable, tightly coupled, and impossible to swap implementations. DI means a class declares what it needs in its constructor, and the DI container provides the correct implementation automatically.",
    example: `// BAD — hardcoded dependency
public class EmployeeService
{
    private readonly EmployeeRepository _repo;
    public EmployeeService()
    {
        _repo = new EmployeeRepository(); // can't test without real DB
    }
}

// GOOD — dependency injected
public class EmployeeService
{
    private readonly IEmployeeRepository _repo;
    public EmployeeService(IEmployeeRepository repo)
    {
        _repo = repo; // can inject a mock for testing
    }
}`,
  },
  {
    id: 2,
    priority: "core",
    category: "Dependency Injection",
    question: "What are the three DI lifetimes in .NET and when do you use each?",
    answer: "Transient — new instance every time (stateless services like email sender, validator). Scoped — one instance per HTTP request (DbContext, repositories). Singleton — one instance for the entire app lifetime (caches, config). DbContext must always be Scoped.",
    example: `builder.Services.AddTransient<IEmailService, EmailService>();
// New instance every time — stateless, cheap to create

builder.Services.AddScoped<IEmployeeService, EmployeeService>();
builder.Services.AddDbContext<AppDbContext>(); // Scoped by default
// One instance per HTTP request — shared within that request

builder.Services.AddSingleton<ICacheService, MemoryCacheService>();
// One instance for the entire app — must be thread-safe`,
  },
  {
    id: 3,
    priority: "core",
    category: "Dependency Injection",
    question: "Why must DbContext always be Scoped?",
    answer: "If Transient: every repository call in one request would use a different DbContext — changes wouldn't be tracked together. If Singleton: one DbContext shared across all requests simultaneously — entity tracking would corrupt across users. Scoped means one DbContext per request, sharing one connection and one change tracker.",
  },
  {
    id: 4,
    priority: "important",
    category: "Dependency Injection",
    question: "Why do we register interfaces (IEmployeeRepository) instead of concrete classes?",
    answer: "Because when writing unit tests, you want to inject a fake MockEmployeeRepository that returns hardcoded data without a real database. Your code only depends on IEmployeeRepository, so the test can inject the mock and the service never knows the difference. This is the entire value proposition of DI.",
    example: `// Registration
builder.Services.AddScoped<IEmployeeRepository, EmployeeRepository>();
// "When someone asks for IEmployeeRepository, give them EmployeeRepository"

// In tests, you inject a mock instead:
var mockRepo = new MockEmployeeRepository();
var service = new EmployeeService(mockRepo); // no real DB needed`,
  },
  {
    id: 5,
    priority: "core",
    category: "Dependency Injection",
    question: "Give a complete interview answer for DI.",
    answer: "\"DI means a class declares what it needs in its constructor instead of creating it with `new`. The .NET DI container reads your registrations and automatically provides the right implementation. The three lifetimes are Transient (new instance every time), Scoped (once per HTTP request — used for DbContext), and Singleton (once for the app — used for caches). The biggest benefit is testability — you inject a mock instead of a real database when testing.\"",
  },

  // === 2. MIDDLEWARE ===
  {
    id: 6,
    priority: "core",
    category: "Middleware",
    question: "What is middleware in ASP.NET Core?",
    answer: "Middleware is a component in the HTTP request pipeline. Every request passes through middleware in order, and responses pass back in reverse. Each middleware can inspect/modify both request and response. Used for cross-cutting concerns: logging, error handling, CORS, auth.",
    example: `Request →  [MW1]  →  [MW2]  →  [MW3]  →  Controller
           ↑                              |
Response ← [MW1] ←  [MW2]  ←  [MW3]  ← /

Each middleware runs before passing forward and can run code
after the rest of the chain completes.`,
  },
  {
    id: 7,
    priority: "core",
    category: "Middleware",
    question: "Why does middleware registration order matter? What is the correct order?",
    answer: "Order is critical because each middleware assumes the previous ones have already run. Authorization assumes authentication already set the user identity. Routing assumes HTTPS redirection has already happened.",
    example: `app.UseHttpsRedirection();  // 1. Redirect HTTP to HTTPS
app.UseRouting();           // 2. Figure out which endpoint matches
app.UseAuthentication();    // 3. Decode JWT/cookie — WHO is this user?
app.UseAuthorization();     // 4. Check permissions — AFTER knowing who they are
app.MapControllers();       // 5. Call the matched controller action`,
  },
  {
    id: 8,
    priority: "important",
    category: "Middleware",
    question: "Write a custom middleware component.",
    answer: "A custom middleware receives a RequestDelegate (the rest of the pipeline), and its InvokeAsync method does work before calling _next(context), then optionally does work after the rest of the pipeline returns.",
    example: `public class RequestTimingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestTimingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var start = DateTime.UtcNow;
        await _next(context); // pass to next middleware / controller
        var elapsed = DateTime.UtcNow - start;
        Console.WriteLine($"{context.Request.Path} took {elapsed.TotalMilliseconds}ms");
    }
}

// Register: app.UseMiddleware<RequestTimingMiddleware>();`,
  },
  {
    id: 9,
    priority: "important",
    category: "Middleware",
    question: "What is the difference between Middleware and Filters?",
    answer: "Middleware sits at the HTTP pipeline level — sees raw HttpContext, runs for every request including static files. Filters sit at the MVC level — only run for requests that reach a controller action, have access to action name, arguments, model state. Use filters for controller-specific behavior.",
  },

  // === 3. FILTERS ===
  {
    id: 10,
    priority: "core",
    category: "Filters",
    question: "What are the 5 filter types in ASP.NET Core MVC and their execution order?",
    answer: "Authorization → Resource → Action → (Controller) → Result. Exception filter runs if an unhandled exception is thrown. Authorization checks permissions first. Resource can short-circuit for caching. Action runs before/after the method. Exception catches errors. Result runs around response serialization.",
    example: `Authorization → Resource → Action (before) → Controller → Action (after) → Result → Response
                                                               ↑
                                               Exception Filter if exception thrown`,
  },
  {
    id: 11,
    priority: "important",
    category: "Filters",
    question: "What is an Action Filter and when would you use one?",
    answer: "An Action Filter runs before and after the controller action method. It has access to ActionArguments (parsed parameters) and the Result (return value). Use for logging with action details, input validation, modifying action arguments.",
    example: `public class LogActionFilter : IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        Console.WriteLine($"Action: {context.ActionDescriptor.DisplayName}");
        Console.WriteLine($"Args: {context.ActionArguments["id"]}");
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
        Console.WriteLine("Action finished");
    }
}`,
  },
  {
    id: 12,
    priority: "important",
    category: "Filters",
    question: "What is an Exception Filter and how does it work?",
    answer: "An Exception Filter runs when an unhandled exception escapes the action. It catches the exception and returns a clean JSON error response instead of a stack trace. Set context.ExceptionHandled = true to prevent the exception from bubbling up. Apply globally so every controller benefits.",
    example: `public class GlobalExceptionFilter : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        context.Result = new ObjectResult(new { error = "Something went wrong" })
        {
            StatusCode = 500
        };
        context.ExceptionHandled = true;
    }
}

// Register globally:
builder.Services.AddControllers(options => {
    options.Filters.Add<GlobalExceptionFilter>();
});`,
  },
  {
    id: 13,
    priority: "important",
    category: "Filters",
    question: "How do you register filters globally vs per-controller?",
    answer: "Globally: add to options.Filters in AddControllers(). Per-controller or per-action: use [ServiceFilter(typeof(...))] attribute. Global filters apply to all controllers automatically.",
    example: `// Globally (applies to all controllers)
builder.Services.AddControllers(options => {
    options.Filters.Add<GlobalExceptionFilter>();
    options.Filters.Add<LogActionFilter>();
});

// Per controller or action (attribute)
[ServiceFilter(typeof(LogActionFilter))]
public class EmployeesController : ControllerBase { }`,
  },

  // === 4. LINQ ===
  {
    id: 14,
    priority: "core",
    category: "LINQ",
    question: "What is LINQ and how does it work differently on List<T> vs DbSet<T>?",
    answer: "LINQ is extension methods that let you query collections and databases with C#. On an in-memory List<T> it runs in C# (LINQ to Objects). On a DbSet<T> (EF Core) it translates your C# expression tree to SQL and runs it on the database (LINQ to Entities). Same syntax, different execution.",
  },
  {
    id: 15,
    priority: "core",
    category: "LINQ",
    question: "What is deferred execution in LINQ?",
    answer: "LINQ queries are not executed when you write them — they build an expression tree (a description of what you want). The query only executes when you iterate the results (ToList, FirstOrDefault, foreach). This lets you compose queries conditionally before executing a single SQL statement.",
    example: `// This does NOTHING yet — just builds a description
var query = _context.Employees
    .Where(e => e.Salary > 3000)
    .OrderBy(e => e.Name);

// SQL is sent to the database HERE
var results = await query.ToListAsync();

// You can compose conditionally:
var query = _context.Employees.Where(e => e.DepartmentId == deptId);
if (searchTerm != null)
    query = query.Where(e => e.Name.Contains(searchTerm));
var results = await query.ToListAsync(); // one SQL query`,
  },
  {
    id: 16,
    priority: "core",
    category: "LINQ",
    question: "What are the most important LINQ methods?",
    answer: "Where (filter), Select (project/transform), OrderBy/OrderByDescending (sort), Take/Skip (pagination), First/FirstOrDefault (get one), Any/All (boolean check), Count/Sum/Average/Min/Max (aggregates), GroupBy (group rows), Include (eager-load related data in EF Core).",
    example: `employees.Where(e => e.Salary > 3000)
employees.Select(e => new { e.Id, e.Name })
employees.OrderBy(e => e.Name)
employees.Skip(10).Take(10) // pagination
employees.FirstOrDefault(e => e.Id == 5) // null if not found
employees.Any(e => e.Salary > 5000) // true if at least one matches
employees.GroupBy(e => e.DepartmentId)
    .Select(g => new { DeptId = g.Key, Count = g.Count() })
_context.Employees.Include(e => e.Department) // eager-load`,
  },
  {
    id: 17,
    priority: "important",
    category: "LINQ",
    question: "What is the difference between First, FirstOrDefault, Single, and SingleOrDefault?",
    answer: "First — throws if not found. FirstOrDefault — returns null if not found (prefer this). Single — throws if 0 or more than 1 found. SingleOrDefault — null if 0, throws if 2+. Use FirstOrDefault for \"get me one or nothing\". Use SingleOrDefault when you expect exactly 0 or 1 result.",
  },
  {
    id: 18,
    priority: "important",
    category: "LINQ",
    question: "LINQ vs SQL comparison — translate common SQL to LINQ.",
    answer: "WHERE → .Where(), SELECT columns → .Select(), ORDER BY → .OrderBy(), LIMIT → .Take(), OFFSET → .Skip(), COUNT → .Count(), GROUP BY → .GroupBy(), JOIN → .Include() (EF Core).",
    example: `| SQL                              | LINQ                                        |
| SELECT name, salary             | .Select(e => new { e.Name, e.Salary })      |
| WHERE salary > 3000             | .Where(e => e.Salary > 3000)                |
| ORDER BY name ASC               | .OrderBy(e => e.Name)                       |
| ORDER BY salary DESC            | .OrderByDescending(e => e.Salary)           |
| LIMIT 10                        | .Take(10)                                   |
| OFFSET 10 LIMIT 10             | .Skip(10).Take(10)                          |
| COUNT(*)                        | .Count()                                    |
| GROUP BY dept_id                | .GroupBy(e => e.DeptId)                     |
| JOIN departments ON ...         | .Include(e => e.Department)                 |`,
  },

  // === 5. ENTITY FRAMEWORK CORE ===
  {
    id: 19,
    priority: "core",
    category: "EF Core",
    question: "What is EF Core and why use an ORM?",
    answer: "EF Core is an ORM — it maps C# classes to database tables so you work with objects instead of raw SQL. Without it, you'd write SQL strings and manually map results to objects. EF Core eliminates this — you work with C# objects and EF handles the SQL generation.",
    example: `// Without EF Core (tedious and error-prone):
var cmd = new SqlCommand("SELECT Id, Name FROM Employees WHERE Id = @id");
cmd.Parameters.AddWithValue("@id", id);
var reader = cmd.ExecuteReader();
var emp = new Employee { Id = (int)reader["Id"], Name = (string)reader["Name"] };

// With EF Core:
var emp = await _context.Employees.FindAsync(id);`,
  },
  {
    id: 20,
    priority: "core",
    category: "EF Core",
    question: "What are EF Core conventions for keys and relationships?",
    answer: "A property named Id or {ClassName}Id → Primary Key. An int PK → auto-increments. A property named {EntityName}Id → Foreign Key. A property of the related entity type → Navigation Property. EF infers your schema from class structure.",
    example: `public class Employee
{
    public int Id { get; set; }               // PK by convention
    public string Name { get; set; } = null!;
    public decimal Salary { get; set; }
    public int DepartmentId { get; set; }           // FK by convention
    public Department Department { get; set; } = null!; // Navigation property
}

public class Department
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public ICollection<Employee> Employees { get; set; } = []; // reverse nav
}`,
  },
  {
    id: 21,
    priority: "core",
    category: "EF Core",
    question: "What is Change Tracking in EF Core?",
    answer: "When you load an entity, EF Core tracks it. If you modify a property and call SaveChangesAsync(), EF detects the change and generates an UPDATE automatically. No explicit \"update\" call needed — just mutate the object and save.",
    example: `var emp = await _context.Employees.FindAsync(id);
emp.Salary = 5000; // EF tracks this change
await _context.SaveChangesAsync();
// generates: UPDATE Employees SET Salary=5000 WHERE Id=@id`,
  },
  {
    id: 22,
    priority: "core",
    category: "EF Core",
    question: "What is the N+1 problem and how do you fix it?",
    answer: "Load 100 employees, access Department in a loop = 101 queries (1 for employees + 100 for each department). Fix: use Include() to eager-load — tells EF to JOIN in a single query. This is the #1 EF Core interview question.",
    example: `// BAD — N+1 problem (101 queries)
var employees = await _context.Employees.ToListAsync();
foreach (var emp in employees)
    Console.WriteLine(emp.Department.Name); // fires a query EACH time

// GOOD — Include() generates a JOIN (1 query)
var employees = await _context.Employees
    .Include(e => e.Department)
    .ToListAsync();
foreach (var emp in employees)
    Console.WriteLine(emp.Department.Name); // already loaded`,
  },
  {
    id: 23,
    priority: "important",
    category: "EF Core",
    question: "What is DbContext and what does it do?",
    answer: "DbContext is the unit of work and database session. It holds the database connection, tracks which entities have changed, translates LINQ to SQL, and manages transactions (SaveChanges is one transaction). It should always be registered as Scoped.",
    example: `public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
    public DbSet<Employee> Employees { get; set; }   // maps to Employees table
    public DbSet<Department> Departments { get; set; }
}

// Registration (Scoped by default):
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));`,
  },
  {
    id: 24,
    priority: "important",
    category: "EF Core",
    question: "How do EF Core Migrations work?",
    answer: "When your model changes, migrations update the database schema. EF compares your current models against the last migration snapshot and generates the SQL diff. Run `dotnet ef migrations add <Name>` to generate a migration, then `dotnet ef database update` to apply it.",
    example: `dotnet ef migrations add AddSalaryColumn  # generates migration with Up() and Down()
dotnet ef database update                  # runs pending migrations against the DB`,
  },

  // === 6. C# KEYWORDS ===
  {
    id: 25,
    priority: "core",
    category: "C# Keywords",
    question: "What does the `static` keyword mean?",
    answer: "A static member belongs to the type itself, not any instance. You call it on the class name, not on an object. A static class cannot be instantiated — it's just a container for utility methods. Common for helpers, extension methods, constants.",
    example: `public static class StringExtensions
{
    public static bool IsNullOrEmpty(string s) => s == null || s.Length == 0;
}

StringExtensions.IsNullOrEmpty(""); // called on the class, no 'new'`,
  },
  {
    id: 26,
    priority: "important",
    category: "C# Keywords",
    question: "What does the `partial` keyword mean?",
    answer: "A partial class can be split across multiple files — they compile into a single class. Useful when you want to separate auto-generated code from hand-written code so regenerating one part doesn't overwrite the other. EF Core migrations use partial classes for this reason.",
    example: `// Employee.cs — your hand-written logic
public partial class Employee
{
    public string GetDisplayName() => $"{Name} ({Department?.Name})";
}

// Employee.Generated.cs — auto-generated by a tool
public partial class Employee
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
}`,
  },
  {
    id: 27,
    priority: "core",
    category: "C# Keywords",
    question: "What does the `abstract` keyword mean?",
    answer: "An abstract class defines a template — it can have real implemented methods, but some methods are marked abstract (no body), forcing subclasses to implement them. You cannot instantiate an abstract class directly. Different from an interface — abstract classes can have state and implemented methods.",
    example: `public abstract class Repository<T>
{
    protected readonly AppDbContext _context;
    public Repository(AppDbContext context) { _context = context; }

    // Concrete method — shared implementation
    public async Task SaveAsync() => await _context.SaveChangesAsync();

    // Abstract method — each subclass must implement differently
    public abstract Task<T?> GetByIdAsync(int id);
}

public class EmployeeRepository : Repository<Employee>
{
    public override async Task<Employee?> GetByIdAsync(int id)
        => await _context.Employees.FindAsync(id);
}`,
  },
  {
    id: 28,
    priority: "important",
    category: "C# Keywords",
    question: "What does the `sealed` keyword mean?",
    answer: "sealed prevents a class from being inherited. A sealed class is the final implementation — no subclass can extend it. You can also seal individual override methods to prevent further overriding down the inheritance chain. Often used for security-critical or performance-sensitive code.",
    example: `public sealed class PaymentProcessor
{
    // No one can extend this — behavior is fixed
}`,
  },
  {
    id: 29,
    priority: "core",
    category: "C# Keywords",
    question: "What does the `readonly` keyword mean?",
    answer: "A readonly field can only be assigned in the constructor (or at declaration). After construction, it's immutable. You see `private readonly` everywhere in .NET services — it's the idiomatic way to store injected dependencies, signaling \"this never changes after construction.\"",
    example: `public class EmployeeService
{
    private readonly IEmployeeRepository _repo;
    // Can only be set in the constructor — never reassigned elsewhere

    public EmployeeService(IEmployeeRepository repo)
    {
        _repo = repo; // OK
    }

    public void DoSomething()
    {
        // _repo = null; // COMPILE ERROR — readonly field
    }
}`,
  },
  {
    id: 30,
    priority: "important",
    category: "C# Keywords",
    question: "What is a `record` in C#?",
    answer: "A record is a reference type (like a class) but with value-based equality and immutability by default. Two records with the same property values are considered equal. Ideal for DTOs and data containers where you care about values, not object identity. Also gets a free ToString() that prints all properties.",
    example: `public record EmployeeDto(int Id, string Name, decimal Salary);

var a = new EmployeeDto(1, "Marino", 3000);
var b = new EmployeeDto(1, "Marino", 3000);

Console.WriteLine(a == b);      // true — value equality
Console.WriteLine(a.Equals(b)); // true

// With a regular class, both would be false (reference equality)`,
  },

  // === 7. SOLID PRINCIPLES ===
  {
    id: 31,
    priority: "core",
    category: "SOLID",
    question: "What is the Single Responsibility Principle (S in SOLID)?",
    answer: "A class should have only one reason to change — it should do one thing. If it does multiple things, changes to one responsibility might break the other.",
    example: `// BAD — three responsibilities
public class EmployeeService
{
    public Employee GetById(int id) { /* DB query */ }
    public void SendWelcomeEmail(Employee emp) { /* SMTP */ }
    public string GeneratePdfReport(Employee emp) { /* PDF */ }
}

// GOOD — each class has one job
public class EmployeeService   { public Employee GetById(int id) { } }
public class EmailService      { public void SendWelcomeEmail(Employee emp) { } }
public class ReportService     { public string GeneratePdfReport(Employee emp) { } }`,
  },
  {
    id: 32,
    priority: "core",
    category: "SOLID",
    question: "What is the Open/Closed Principle (O in SOLID)?",
    answer: "Classes should be open for extension, closed for modification. You should be able to add new behavior without modifying existing code. New behavior comes from adding new classes, not editing old ones.",
    example: `// BAD — must modify this method for every new type
public decimal Calculate(string customerType, decimal price)
{
    if (customerType == "Regular") return price * 0.95m;
    if (customerType == "VIP") return price * 0.80m;
    // Adding new type = modifying existing code
}

// GOOD — add new class, touch nothing existing
public interface IDiscountStrategy { decimal Calculate(decimal price); }
public class RegularDiscount : IDiscountStrategy { ... }
public class VipDiscount : IDiscountStrategy { ... }
public class EmployeeDiscount : IDiscountStrategy { ... } // new, no edits`,
  },
  {
    id: 33,
    priority: "core",
    category: "SOLID",
    question: "What is the Liskov Substitution Principle (L in SOLID)?",
    answer: "Subclasses should be substitutable for their base class without breaking the program. If code works with a base class, it should work with any subclass without knowing which one. If a subclass breaks expected behavior, it violates LSP.",
    example: `// BAD — Square violates Rectangle's contract
Rectangle r = new Square();
r.Width = 4;
r.Height = 5;
Console.WriteLine(r.Area()); // Expected 20, got 25
// Square changed Height when Width was set — broke expectations

// Rule: If overriding a method requires weakening guarantees
// or making it do less than the base class promises, LSP is violated.
// Fix: don't inherit — use a shared interface instead.`,
  },
  {
    id: 34,
    priority: "core",
    category: "SOLID",
    question: "What is the Interface Segregation Principle (I in SOLID)?",
    answer: "Don't force classes to implement interfaces they don't use. A fat interface with many methods forces all implementors to implement methods they may not need, often with empty or throwing stubs. Keep interfaces small and focused.",
    example: `// BAD — fat interface
public interface IEmployee
{
    void Work();
    void ManageTeam();   // Not all employees manage
    void ApproveLeave(); // Not all employees approve
}
public class JuniorDeveloper : IEmployee
{
    public void Work() { }
    public void ManageTeam() { throw new NotImplementedException(); } // forced
}

// GOOD — segregated interfaces
public interface IWorker  { void Work(); }
public interface IManager { void ManageTeam(); void ApproveLeave(); }
public class JuniorDeveloper : IWorker { public void Work() { } }`,
  },
  {
    id: 35,
    priority: "core",
    category: "SOLID",
    question: "What is the Dependency Inversion Principle (D in SOLID)?",
    answer: "High-level modules should not depend on low-level modules. Both should depend on abstractions. Your EmployeeService (high-level) should not depend on SqlEmployeeRepository (low-level concrete). Both should depend on IEmployeeRepository (abstraction). This is what DI is built on.",
    example: `// BAD — high-level depends on low-level concrete
public class EmployeeService
{
    private SqlEmployeeRepository _repo = new SqlEmployeeRepository();
}

// GOOD — both depend on abstraction
public interface IEmployeeRepository { Task<Employee?> GetByIdAsync(int id); }
public class SqlEmployeeRepository : IEmployeeRepository { /* impl */ }
public class EmployeeService
{
    private readonly IEmployeeRepository _repo; // abstraction
    public EmployeeService(IEmployeeRepository repo) { _repo = repo; }
}`,
  },
  {
    id: 36,
    priority: "core",
    category: "SOLID",
    question: "Summarize all 5 SOLID principles in one sentence each.",
    answer: "S: A class does one thing. O: Add features by extending, not modifying. L: Subclasses should be drop-in replacements for their base class. I: Keep interfaces small and focused so classes only implement what they need. D: Depend on abstractions not concrete classes — which is exactly what DI enforces.",
  },

  // === 8. GIT ===
  {
    id: 37,
    priority: "core",
    category: "Git",
    question: "What are the core Git concepts?",
    answer: "Repository — project folder with full history. Commit — snapshot with unique hash, author, timestamp, message. Branch — parallel line of development. Remote — copy hosted elsewhere (GitHub). Staging area — buffer between working files and a commit (git add).",
  },
  {
    id: 38,
    priority: "core",
    category: "Git",
    question: "What are the essential Git commands for daily work?",
    answer: "git status (what's changed), git add . (stage all), git commit -m \"msg\" (commit), git branch / checkout -b (create/switch branch), git push/pull (sync with remote), git merge (combine branches), git stash (save uncommitted changes temporarily).",
    example: `# Typical daily workflow:
git pull origin main              # get latest
git checkout -b feature/add-search  # feature branch
# ... write code ...
git add .
git commit -m "Add employee search by name"
git push origin feature/add-search  # push branch
# Open Pull Request → review → merge`,
  },
  {
    id: 39,
    priority: "important",
    category: "Git",
    question: "What is the difference between merge and rebase?",
    answer: "Merge combines two branches by creating a merge commit — preserves full history including branch structure. Rebase rewrites your commits on top of another branch as if you branched from the latest point — cleaner linear history but rewrites commits. Never rebase shared/public branches. For juniors: use merge.",
  },
  {
    id: 40,
    priority: "important",
    category: "Git",
    question: "What is a Pull Request?",
    answer: "A PR is not a Git feature — it's a platform feature (GitHub/GitLab/Azure DevOps). It's a request to merge your branch into main. It's where code review happens. Your team reviews the diff, leaves comments, and approves or requests changes before merging.",
  },

  // === 9. SQL THEORY ===
  {
    id: 41,
    priority: "core",
    category: "SQL",
    question: "Explain the different types of JOINs.",
    answer: "INNER JOIN — only rows where a match exists in BOTH tables. LEFT JOIN — ALL rows from left table, NULLs where no match on right. RIGHT JOIN — ALL rows from right (rarely used). FULL OUTER JOIN — ALL rows from both, NULL where no match on either side.",
    example: `-- INNER JOIN: only employees WITH a department
SELECT e.name, d.name AS dept
FROM employees e
INNER JOIN departments d ON e.department_id = d.id;

-- LEFT JOIN: ALL employees, NULL dept if none
SELECT e.name, d.name AS dept
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id;

-- Decision:
-- "All employees, with dept if they have one" → LEFT JOIN
-- "Only employees who belong to a department" → INNER JOIN
-- "Which departments have no employees?" → LEFT JOIN + WHERE e.id IS NULL`,
  },
  {
    id: 42,
    priority: "core",
    category: "SQL",
    question: "What is the difference between WHERE and HAVING?",
    answer: "WHERE filters individual rows BEFORE grouping. HAVING filters GROUPS after aggregation. You can't use aggregate functions in WHERE — use HAVING instead. Execution order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY.",
    example: `SELECT department_id,
       COUNT(*) AS employee_count,
       AVG(salary) AS avg_salary
FROM employees
WHERE hired_at > '2020-01-01'      -- filter rows first
GROUP BY department_id              -- then group
HAVING COUNT(*) > 3                 -- then filter groups
ORDER BY avg_salary DESC;`,
  },
  {
    id: 43,
    priority: "important",
    category: "SQL",
    question: "What are WHERE, BETWEEN, LIKE, IN, and IS NULL?",
    answer: "BETWEEN is inclusive range (>= AND <=). LIKE uses % for wildcards (starts with, ends with, contains). IN checks against multiple values. IS NULL / IS NOT NULL for null checks (never use = NULL).",
    example: `WHERE salary BETWEEN 1000 AND 5000   -- inclusive range
WHERE name LIKE 'Mar%'               -- starts with 'Mar'
WHERE name LIKE '%ino'               -- ends with 'ino'
WHERE name LIKE '%arin%'             -- contains 'arin'
WHERE email IS NULL                  -- null check (not = NULL!)
WHERE city IN ('Zagreb', 'Split', 'Rijeka')  -- multiple values`,
  },
  {
    id: 44,
    priority: "core",
    category: "SQL",
    question: "What is a Foreign Key and what does it enforce?",
    answer: "A FK constraint enforces that a value in one column must exist as a primary key in another table. It prevents inserting invalid references (referential integrity) and prevents deleting referenced rows (unless ON DELETE CASCADE). Without FK, only application logic prevents orphaned data.",
    example: `CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    total DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);
-- Can't insert order with customer_id = 99 if customer 99 doesn't exist
-- Can't delete customer that has orders (by default)`,
  },
  {
    id: 45,
    priority: "important",
    category: "SQL",
    question: "What is a Composite Key?",
    answer: "A primary key made from multiple columns. Used when no single column is unique but a combination is. Examples: order line items (order_id, line_number), user roles (user_id, role_id), course enrollments (student_id, course_id, semester).",
    example: `CREATE TABLE course_enrollments (
    student_id INTEGER,
    course_id INTEGER,
    semester TEXT,
    grade TEXT,
    PRIMARY KEY (student_id, course_id, semester)
    -- Same course in different semesters: OK
    -- Same course+semester twice: blocked
);`,
  },
  {
    id: 46,
    priority: "core",
    category: "SQL",
    question: "What is Normalization? Explain 1NF, 2NF, and 3NF.",
    answer: "Normalization eliminates redundancy in schema design. 1NF: no lists in a cell (atomic values). 2NF: non-key columns depend on the FULL composite key, not just part. 3NF: non-key columns only depend on the primary key, not on other non-key columns (no transitive dependencies).",
    example: `-- 1NF violation: products = "Laptop, Mouse, Keyboard" in one cell
-- Fix: one row per product

-- 2NF violation: order_items(order_id, product_id, quantity, product_name)
-- product_name depends only on product_id, not the full key
-- Fix: split into order_items + products table

-- 3NF violation: employees(id, name, city, country)
-- country depends on city, not on id
-- Fix: split into employees(id, name, city_id) and cities(city_id, name, country)`,
  },

  // === CHEAT SHEET / INTERVIEW ANSWERS ===
  {
    id: 47,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: DI",
    answer: "\"Classes declare dependencies in the constructor, the container provides them. Transient = every time, Scoped = per request, Singleton = once. DbContext is always Scoped.\"",
  },
  {
    id: 48,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: Middleware",
    answer: "\"A pipeline every request passes through. Order matters. Authentication before authorization. Used for logging, error handling, CORS, auth.\"",
  },
  {
    id: 49,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: Filters",
    answer: "\"5 types: Authorization, Resource, Action, Exception, Result. Run inside MVC layer so they have access to action context. Exception filter is most useful for returning consistent error responses.\"",
  },
  {
    id: 50,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: LINQ",
    answer: "\"Extension methods for querying collections and databases. Where = filter, Select = project, OrderBy = sort, FirstOrDefault = get first or null, Include = eager-load related data. Deferred execution — runs on ToList().\"",
  },
  {
    id: 51,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: EF Core",
    answer: "\"ORM mapping classes to tables. DbContext is the session. Change tracking auto-detects modifications. Include() prevents N+1. Migrations handle schema changes.\"",
  },
  {
    id: 52,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: SOLID",
    answer: "\"S = one job. O = extend not modify. L = subclasses are drop-in replacements. I = small focused interfaces. D = depend on abstractions.\"",
  },
  {
    id: 53,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: N+1 Problem",
    answer: "\"Load 100 employees, access Department in a loop = 101 queries. Fix: Include() generates a JOIN.\"",
  },
  {
    id: 54,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: Normalization",
    answer: "\"1NF = no lists in cells. 2NF = non-key columns depend on the full composite key. 3NF = non-key columns only depend on the PK.\"",
  },
  {
    id: 55,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: Git",
    answer: "\"Distributed VCS. Branch for features, commit snapshots, push to remote, PR for code review, merge into main.\"",
  },
]

export default revisionFlashcards
