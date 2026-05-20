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
    readMore: `Think of it like ordering food at a restaurant. In the bad version, the chef goes to the farm, picks vegetables, milks the cow — does everything himself. In the good version, the chef just says "I need milk and tomatoes" and the kitchen manager (the DI container) delivers them. The chef doesn't care where they came from.

In code: instead of your class creating its own helpers with 'new', it just lists what it needs in the constructor. The framework figures out what to give it. This means during testing you can hand it fake helpers that don't need a real database.`
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
    readMore: `Think of three different ways a coffee shop could serve drinks:

Transient = every customer gets a freshly made cup, even if two people order the same thing at the same time. Simple, no sharing.

Scoped = everyone at the same table shares one pot of coffee. Different tables get different pots. In web terms, one HTTP request = one table.

Singleton = there's one giant coffee urn for the whole shop, all day. Everyone drinks from it. It has to be sturdy enough to handle everyone at once (thread-safe).

DbContext (your database connection) should be Scoped because everyone in one request needs to see the same data changes, but different requests shouldn't interfere with each other.`
  },
  {
    id: 3,
    priority: "core",
    category: "Dependency Injection",
    question: "Why must DbContext always be Scoped?",
    answer: "If Transient: every repository call in one request would use a different DbContext — changes wouldn't be tracked together. If Singleton: one DbContext shared across all requests simultaneously — entity tracking would corrupt across users. Scoped means one DbContext per request, sharing one connection and one change tracker.",
    readMore: `Imagine DbContext is a shopping cart.

Transient: every time you pick up an item, you get a NEW empty cart. At checkout you only have the last item. All the others are lost in random carts around the store. Bad!

Singleton: there's ONE cart for the entire store. Every shopper is throwing items into it simultaneously. You end up paying for someone else's groceries. Bad!

Scoped: you get your own cart when you walk in, you use it for your whole visit, and it's thrown away when you leave. Perfect — that's one cart per request.`
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
    readMore: `Imagine you're testing a car's steering. You don't need a real engine — you just need the wheels to turn. So you plug in a fake engine that does nothing.

Same with code: if EmployeeService uses IEmployeeRepository (an interface), during tests you can plug in a fake repository that returns hardcoded data. The service doesn't know the difference because it only talks to the interface, not the real database class. If you used the concrete class directly, you'd need a real database for every test — slow and fragile.`
  },
  {
    id: 5,
    priority: "core",
    category: "Dependency Injection",
    question: "Give a complete interview answer for DI.",
    answer: "\"DI means a class declares what it needs in its constructor instead of creating it with `new`. The .NET DI container reads your registrations and automatically provides the right implementation. The three lifetimes are Transient (new instance every time), Scoped (once per HTTP request — used for DbContext), and Singleton (once for the app — used for caches). The biggest benefit is testability — you inject a mock instead of a real database when testing.\"",
    readMore: `Practice saying this out loud. The key points to hit:
1. Classes don't create their own dependencies
2. The container provides them based on registrations
3. Name all three lifetimes with one example each
4. End with testability as the main benefit

This covers everything an interviewer expects from a junior. Keep it under 30 seconds.`
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
    readMore: `Think of airport security. Before you reach your gate (the controller), you pass through a series of checkpoints:

1. Ticket check (routing — are you in the right terminal?)
2. ID check (authentication — who are you?)
3. Security scan (authorization — are you allowed through?)
4. Boarding (the controller does its job)

On the way back (the response), you pass through the same checkpoints in reverse — they can stamp your boarding pass, log you, etc.

Every single passenger goes through the same checkpoints in the same order. That's middleware — a pipeline of steps every request must pass through.`
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
    readMore: `The order is like getting into a nightclub:

1. HTTPS redirect = making sure you're at the right entrance
2. Routing = the bouncer checks which room you're headed to
3. Authentication = checking your ID — WHO are you?
4. Authorization = checking the guest list — are you ALLOWED in this room?
5. Controller = you're inside, doing your thing

You can't check the guest list before checking the ID. That's why authentication MUST come before authorization. If you swap them, authorization doesn't know who the user is yet and will reject everyone.`
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
    readMore: `A custom middleware is like a stopwatch operator at a race:

1. The constructor receives '_next' — this is "the rest of the race" (all the middleware and controller that come after you)
2. InvokeAsync is called for every request. You do your "before" work (start stopwatch), call await _next(context) to let the request continue through the pipeline, then do your "after" work (stop stopwatch, log the time)

The key insight: everything before _next(context) runs on the way IN (request). Everything after runs on the way OUT (response).`
  },
  {
    id: 9,
    priority: "important",
    category: "Middleware",
    question: "What is the difference between Middleware and Filters?",
    answer: "Middleware sits at the HTTP pipeline level — sees raw HttpContext, runs for every request including static files. Filters sit at the MVC level — only run for requests that reach a controller action, have access to action name, arguments, model state. Use filters for controller-specific behavior.",
    readMore: `Think of it as two levels of security:

Middleware = building security. Everyone who enters the building passes through it — delivery people, visitors, employees. It only knows basic info: "someone walked through the front door."

Filters = office-level security. Only people who make it to a specific office encounter these. The office receptionist knows much more: which meeting you're here for, what documents you brought, your appointment details.

Use middleware for things that apply to ALL requests (logging, CORS). Use filters when you need to know specifics about the controller action being called.`
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
    readMore: `Think of the 5 filters as checkpoints inside an office building (after you've already passed building security, which is middleware):

1. Authorization: security desk — "Are you allowed in this office?" If no, you're kicked out immediately.
2. Resource: reception — can check a cache and say "here's your answer, no need to see the manager."
3. Action: the manager's assistant — prepares things before your meeting, takes notes after.
4. Exception: the fire alarm — only activates if something goes wrong.
5. Result: the mailroom — packages the response before it leaves the building.

Each one has a specific job and they run in this exact order.`
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
    readMore: `An Action Filter is like a security camera with a log book at a meeting room door:

Before the meeting (OnActionExecuting): it records who's going in, what documents they're carrying (the action arguments like an 'id' parameter). You can even turn someone away if their documents are wrong.

After the meeting (OnActionExecuted): it records what happened — did the meeting produce a result? Was there an error?

This is more powerful than middleware because middleware only sees "someone made an HTTP request." The action filter sees "someone called GetEmployee with id=5 and got back an Employee object." Much richer context.`
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
    readMore: `Without an exception filter, if your controller throws an error, the user gets an ugly stack trace with internal code details — a security risk and bad UX.

The exception filter is like a PR spokesperson: when something goes wrong internally, instead of showing the messy details to the public, they step in and say "We're sorry, something went wrong. We're looking into it." Clean, professional, consistent.

context.ExceptionHandled = true is you telling the framework "I've dealt with this, don't panic." Without it, the exception keeps bubbling up and might crash the app or show the stack trace anyway.`
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
    readMore: `Global = a rule that applies to the whole school. Every class, every student, everywhere. You set it once in AddControllers() and forget about it.

Per-controller/action = a rule for one specific classroom or one specific lesson. You put [ServiceFilter(...)] on just that controller or method.

Typically you'd register error handling and logging globally (you want them everywhere), but something like a special rate-limiter or validation filter only on specific endpoints that need it.`
  },

  // === 4. LINQ ===
  {
    id: 14,
    priority: "core",
    category: "LINQ",
    question: "What is LINQ and how does it work differently on List<T> vs DbSet<T>?",
    answer: "LINQ is extension methods that let you query collections and databases with C#. On an in-memory List<T> it runs in C# (LINQ to Objects). On a DbSet<T> (EF Core) it translates your C# expression tree to SQL and runs it on the database (LINQ to Entities). Same syntax, different execution.",
    readMore: `Imagine you have a universal remote that works with any TV brand. You press "volume up" and it works whether you have a Samsung or an LG — the remote sends different signals internally, but you don't care.

LINQ is that universal remote for data. You write .Where(x => x.Age > 18) and:
• On a List in memory: C# loops through the list and filters
• On a DbSet from a database: EF Core translates it to SQL (WHERE age > 18) and the database does the work

Same syntax, completely different execution behind the scenes. You just write C# and the right thing happens.`
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
    readMore: `Think of LINQ like writing a shopping list vs actually going shopping.

When you write .Where(...).OrderBy(...), you're just writing the list: "I want apples, sorted by size, only the red ones." Nobody has gone to the store yet.

The actual shopping trip happens when you call .ToListAsync() or .FirstOrDefaultAsync(). THAT's when the SQL is generated and sent to the database.

Why is this useful? Because you can keep adding to your shopping list conditionally: "oh, and if the user wants organic, add that filter too." You build up the whole query, then execute it once. One trip to the store instead of many.`
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
    readMore: `These are your bread-and-butter tools. Think of them as:

• Where = a bouncer ("only let these people through")
• Select = a costume change ("transform into this shape")
• OrderBy = a line organizer ("sort yourselves by height")
• Skip/Take = a velvet rope ("skip the first 10, let the next 10 in" — pagination)
• FirstOrDefault = "give me the first person in line, or nobody if the line is empty"
• Any = "is ANYONE in this line taller than 6 feet?"
• GroupBy = "everyone group up by hair color"
• Include = "bring your friends along" (load related data)

You'll chain these together constantly: .Where().OrderBy().Take(10).ToListAsync()`
  },
  {
    id: 17,
    priority: "important",
    category: "LINQ",
    question: "What is the difference between First, FirstOrDefault, Single, and SingleOrDefault?",
    answer: "First — throws if not found. FirstOrDefault — returns null if not found (prefer this). Single — throws if 0 or more than 1 found. SingleOrDefault — null if 0, throws if 2+. Use FirstOrDefault for \"get me one or nothing\". Use SingleOrDefault when you expect exactly 0 or 1 result.",
    readMore: `Think of it like looking for a specific book on a shelf:

First = "Give me the first matching book. If there are none, THROW THE SHELF ON THE GROUND." (crashes)
FirstOrDefault = "Give me the first matching book, or just say 'nothing found'." (returns null — use this one)

Single = "Give me THE ONE matching book. If there are none OR more than one, THROW THE SHELF." (very strict)
SingleOrDefault = "Give me the one matching book, or say 'nothing found'. But if there are TWO matches, THROW THE SHELF."

In practice: FirstOrDefault is your default choice. SingleOrDefault is for when duplicates would be a bug (like looking up by unique ID).`
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
    readMore: `If you already know SQL, this is your Rosetta Stone. The mental model is:

• SQL thinks in tables and rows
• LINQ thinks in collections and objects

But they map almost 1:1. The biggest difference is that LINQ chains methods left-to-right while SQL reads more like English sentences. Also, LINQ uses .Include() for JOINs when using EF Core, which is simpler than writing JOIN syntax manually.

Tip: if an interviewer asks you to write a query, you can say "in SQL that would be... and in LINQ that translates to..." This shows you understand both.`
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
    readMore: `Imagine you're working with a spreadsheet. Without an ORM, every time you want data, you have to write the spreadsheet formula yourself, read the raw cell values, and manually type them into a form. One typo and everything breaks.

With EF Core, you just say "give me employee #5" and it hands you a nice C# object with .Name, .Salary, etc. already filled in. Behind the scenes it wrote the SQL, ran it, and mapped the results — you never touched SQL.

ORM stands for Object-Relational Mapper: it maps between your C# objects and relational database tables.`
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
    readMore: `EF Core is smart about naming. It uses conventions (rules based on names) so you don't have to configure everything manually:

• A property called "Id" or "EmployeeId"? That's your primary key.
• A property called "DepartmentId" on an Employee? That's a foreign key to the Departments table.
• A property of type Department on Employee? That's a navigation property — it lets you write emp.Department.Name instead of doing a JOIN yourself.

Think of it as EF Core reading your class names and property names and guessing the database structure. Most of the time it guesses right, which means less configuration code for you.`
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
    readMore: `Imagine you're editing a Google Doc. You don't press a "save changes" button after every keystroke — Google tracks what you changed. When you're done, it syncs.

EF Core works the same way. When you load an employee from the database, EF takes a "snapshot" of its values. Then you change emp.Salary = 5000. EF compares the current state to the snapshot and sees "Salary changed from 3000 to 5000." When you call SaveChangesAsync(), it generates ONLY the UPDATE for that one changed field.

You never write UPDATE SQL yourself. Just change the object and save. EF figures out the rest.`
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
    readMore: `The N+1 problem is the #1 performance mistake with ORMs. Here's the analogy:

Bad way: You ask the school office for a list of 100 students. Then you walk back to the office 100 TIMES to ask "what class is student #1 in?", "what class is student #2 in?" etc. That's 101 trips total.

Good way: You ask the office "give me all 100 students AND their class info in one go." One trip.

In code: without Include(), EF loads employees first, then lazily fires a separate SQL query for each employee's department when you access it. With Include(), EF generates one JOIN query that fetches everything at once. Always use Include() when you know you'll need related data.`
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
    readMore: `DbContext is your "window into the database." Think of it as a librarian:

• It holds the library card (database connection)
• It keeps track of which books you've checked out and which ones you've scribbled in (change tracking)
• It translates your requests from English to the library's internal system (LINQ to SQL)
• When you say "I'm done," it processes all your changes in one batch (SaveChanges = one transaction)

DbSet<Employee> is like a specific shelf in the library — the "Employees shelf." You query it with LINQ and get Employee objects back. Each DbSet maps to one database table.`
  },
  {
    id: 24,
    priority: "important",
    category: "EF Core",
    question: "How do EF Core Migrations work?",
    answer: "When your model changes, migrations update the database schema. EF compares your current models against the last migration snapshot and generates the SQL diff. Run `dotnet ef migrations add <Name>` to generate a migration, then `dotnet ef database update` to apply it.",
    example: `dotnet ef migrations add AddSalaryColumn  # generates migration with Up() and Down()
dotnet ef database update                  # runs pending migrations against the DB`,
    readMore: `Think of migrations like version control for your database schema (not data, just the structure).

You change your C# model (add a Salary property to Employee). EF compares your code to the last known schema and says "ah, you added a column." It generates a migration file with:
• Up() — how to apply the change (ALTER TABLE ADD COLUMN)
• Down() — how to undo it (ALTER TABLE DROP COLUMN)

Then 'dotnet ef database update' runs all pending migrations. This way your database evolves alongside your code, and you can always roll back if something goes wrong. The migration files are committed to Git so your whole team stays in sync.`
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
    readMore: `Think of a regular class like a cookie cutter — you use it to create cookies (instances), and each cookie can have different frosting. You need to make a cookie before you can eat it.

A static class is like the oven itself — there's only one, you don't "create" ovens, you just use it directly: Oven.Bake(cookie).

A static METHOD on a regular class is like a sign on the cookie cutter that says "recommended oven temperature: 180°C." The info belongs to the cutter design itself, not to any individual cookie.

In .NET you see static for: Math.Round(), Console.WriteLine(), string.IsNullOrEmpty() — utility functions that don't need an instance.`
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
    readMore: `Imagine you and a coworker are both writing different parts of the same document. Instead of fighting over one file, you each work in your own file, and the printer combines them into one final document.

That's exactly what partial does. One file might be auto-generated by a tool (like EF Core migrations or a code generator), and the other file is your hand-written logic. When the tool regenerates its file, your file is untouched.

Without partial, the tool would overwrite your custom code every time it regenerates. With partial, they live in separate files but compile into one class.`
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
    readMore: `Think of an abstract class like a recipe template:

"Every cake must be mixed, baked, and decorated."
• Mixed and baked are the same for all cakes (concrete methods — shared implementation).
• Decorated is different for every cake (abstract method — each subclass must provide its own).

You can't eat a "template cake" — you can't instantiate an abstract class. You have to make a specific cake (ChocolateCake, VanillaCake) that fills in the decoration step.

How is this different from an interface? An interface is just a contract ("you must have these methods") with no shared code. An abstract class can have BOTH shared code AND required-to-implement methods. Use abstract when subclasses share behavior.`
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
    readMore: `Think of sealed like putting a padlock on a class. Nobody can inherit from it and change its behavior.

Why would you want this?
• Security: if PaymentProcessor handles money, you don't want someone subclassing it and overriding the "charge" method to skip validation.
• Performance: the .NET runtime can optimize sealed classes because it knows there are no subclasses to worry about.
• Design clarity: it signals "this class is complete as-is, don't extend it."

Many built-in .NET types like String are sealed. In modern .NET, sealing classes you don't intend to be inherited is considered best practice.`
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
    readMore: `readonly is like writing something in permanent marker during construction. Once the object is built, that field is locked forever.

You'll see 'private readonly' on almost every injected dependency in .NET:
private readonly IEmployeeRepository _repo;

This tells everyone reading the code: "_repo is set once in the constructor and never changes." It's a safety guarantee — no method can accidentally reassign it to null or a different instance.

Compare to 'const': a const is known at compile time and can never change (like pi = 3.14). readonly is set at runtime (in the constructor) and then locked. Use readonly for things you don't know until the program runs, like injected services.`
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
    readMore: `With a normal class, two objects are "equal" only if they are literally the same object in memory (same reference). Even if two Employee objects have identical data, == returns false because they're different objects.

A record flips this: two records are equal if all their properties have the same values. It's like comparing two receipts — you don't care if they're printed on different pieces of paper, you care if the amounts and items are the same.

Records are perfect for DTOs (Data Transfer Objects) — objects that just carry data between layers. You don't care about identity, you care about the values inside. They also give you a nice ToString() for free: "EmployeeDto { Id = 1, Name = Marino, Salary = 3000 }".`
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
    readMore: `Think of a Swiss Army knife vs specialized tools. A Swiss Army knife does everything — cuts, opens bottles, files nails. But if the blade breaks, you lose everything. And it's not great at any single task.

SRP says: use a dedicated knife for cutting, a dedicated bottle opener, a dedicated file. Each tool does one thing well. If the bottle opener breaks, the knife still works.

In code: if EmployeeService handles DB queries AND email AND PDF reports, a change to the email template could accidentally break the database query. Split them into separate classes and each one only changes for one reason.`
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
    readMore: `Think of electrical outlets. The outlet design is "closed" — you don't rewire your house every time you buy a new appliance. Instead, you "extend" by plugging in new devices that follow the standard plug shape (the interface).

In code: instead of an ever-growing if/else chain that you edit every time there's a new customer type, you define an interface (IDiscountStrategy) and add new classes. The existing code that USES the discount never changes — it just calls strategy.Calculate(price) and doesn't care which class it is.

This is huge for teams: you can add features without risking breaking existing, tested code.`
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
    readMore: `The classic example: a Square IS-A Rectangle mathematically, but in code it's a problem.

If someone has code that says "take this rectangle, set width to 4, set height to 5, area should be 20" — it works for any Rectangle. But a Square secretly links width and height, so setting height to 5 also changes width to 5, giving area = 25. The code broke without knowing it was dealing with a Square.

The rule is simple: if you can use a base class reference and a subclass makes it behave unexpectedly, you violated LSP. The fix is usually: don't force inheritance. Use a common interface instead, or redesign the hierarchy so subclasses truly behave like the base class.`
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
    readMore: `Imagine a job contract that says you must: write code, manage a team, approve leave, do accounting, and clean the office. A junior developer signs it and has to "implement" team management by doing nothing (throw new NotImplementedException()). That's a bad contract.

Better: have separate contracts — one for coding (IWorker), one for management (IManager), one for accounting (IAccountant). The junior only signs the coding contract. The team lead signs coding + management.

In code: fat interfaces force classes to implement methods they don't use. Small, focused interfaces let each class only commit to what it actually does.`
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
    readMore: `Without DIP: EmployeeService directly creates SqlEmployeeRepository. It's like a CEO personally going to a specific supplier's warehouse to pick up parts. If the supplier changes, the CEO has to change their routine.

With DIP: EmployeeService just says "I need someone who can get employees" (the interface). A manager (the DI container) decides which supplier to use. The CEO never knows or cares which supplier it is.

This is the foundation of Dependency Injection. The "inversion" is that instead of the high-level class controlling which low-level class it uses, both depend on a shared abstraction (the interface), and something external decides the wiring.`
  },
  {
    id: 36,
    priority: "core",
    category: "SOLID",
    question: "Summarize all 5 SOLID principles in one sentence each.",
    answer: "S: A class does one thing. O: Add features by extending, not modifying. L: Subclasses should be drop-in replacements for their base class. I: Keep interfaces small and focused so classes only implement what they need. D: Depend on abstractions not concrete classes — which is exactly what DI enforces.",
    readMore: `Memory trick for the interview — one word per letter:

S = Split (split responsibilities into separate classes)
O = Extend (extend with new classes, don't edit old ones)
L = Substitute (subclass should be substitutable for parent)
I = Slim (keep interfaces slim)
D = Abstract (depend on abstractions)

If you can explain each one with a quick example, you're golden. Most interviewers are happy with 1-2 sentences per letter plus one example for whichever they ask you to go deeper on.`
  },

  // === 8. GIT ===
  {
    id: 37,
    priority: "core",
    category: "Git",
    question: "What are the core Git concepts?",
    answer: "Repository — project folder with full history. Commit — snapshot with unique hash, author, timestamp, message. Branch — parallel line of development. Remote — copy hosted elsewhere (GitHub). Staging area — buffer between working files and a commit (git add).",
    readMore: `Think of Git like a time machine for your code:

• Repository = your project folder, but with a hidden history of every change ever made
• Commit = a "save point" in a video game. You can always go back to it. It has a unique ID, who saved it, and a note about what changed.
• Branch = a parallel universe. You can experiment without affecting the main timeline. When your experiment works, you merge it back.
• Remote = a backup copy on the internet (GitHub). Everyone on the team syncs through it.
• Staging area = a box where you put files you want to include in your next save point. git add puts files in the box, git commit saves the box.`
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
    readMore: `The daily rhythm is simple:

1. Start your day: git pull (get your team's latest changes)
2. Start a feature: git checkout -b feature/my-thing (create your own parallel universe)
3. Work on it, making small commits as you go
4. When done: git push (upload your branch)
5. Open a Pull Request for your team to review
6. After approval: merge into main

The key commands to memorize: pull, checkout -b, add, commit, push, merge. That covers 95% of daily Git use. Everything else you can Google as needed.`
  },
  {
    id: 39,
    priority: "important",
    category: "Git",
    question: "What is the difference between merge and rebase?",
    answer: "Merge combines two branches by creating a merge commit — preserves full history including branch structure. Rebase rewrites your commits on top of another branch as if you branched from the latest point — cleaner linear history but rewrites commits. Never rebase shared/public branches. For juniors: use merge.",
    readMore: `Merge = two rivers joining. Both rivers' histories are preserved, and there's a clear "join point" (the merge commit). It's messy-looking but safe.

Rebase = picking up your river and replanting it at the end of the other river, as if it always started there. Looks cleaner (one straight line) but you've rewritten history.

The golden rule: NEVER rebase a branch that other people are working on. Rewriting shared history causes chaos — everyone's commits get confused.

For your interview: "I typically use merge because it's safer and preserves history. I know rebase exists for cleaner history but I'd only use it on my own local branches." This is the right junior answer.`
  },
  {
    id: 40,
    priority: "important",
    category: "Git",
    question: "What is a Pull Request?",
    answer: "A PR is not a Git feature — it's a platform feature (GitHub/GitLab/Azure DevOps). It's a request to merge your branch into main. It's where code review happens. Your team reviews the diff, leaves comments, and approves or requests changes before merging.",
    readMore: `A Pull Request is NOT a Git command — it's a feature of GitHub/GitLab/Azure DevOps. Think of it as raising your hand in class and saying "I'd like my work to be added to the main project."

The process:
1. You push your branch to the remote
2. You open a PR on GitHub saying "please review and merge my changes"
3. Your teammates look at the code diff, leave comments, suggest improvements
4. After approval, someone clicks "Merge"

This is how professional teams prevent bugs — no code goes into main without another set of eyes on it. Mentioning that you value code review in an interview is always a good look.`
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
    readMore: `Think of JOINs like matching people at a dance:

INNER JOIN = only people who have a dance partner get on the floor. Wallflowers on both sides are excluded.

LEFT JOIN = EVERYONE from the left table gets on the floor. If they don't have a partner, they dance alone (NULL partner). Nobody from the right side dances alone though.

RIGHT JOIN = opposite of LEFT JOIN. Rarely used — just swap the table order and use LEFT JOIN.

FULL OUTER JOIN = everyone gets on the floor, partner or not. Both wallflower groups are included.

The decision rule is simple: do you want ALL rows from one table regardless of matches? Use LEFT JOIN. Only matched rows? Use INNER JOIN.`
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
    readMore: `The key difference:

WHERE is a bouncer at the door: "You can't come in if you were hired before 2020." It filters individual people (rows) BEFORE they're grouped.

HAVING is a judge after the groups are formed: "Only groups with more than 3 members qualify." It filters entire groups AFTER aggregation.

You CAN'T use COUNT(*) in WHERE because the counting hasn't happened yet — rows haven't been grouped. That's what HAVING is for.

Remember the SQL execution order: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY. This order explains everything about what you can use where.`
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
    readMore: `These are your filtering Swiss Army knife in SQL:

• BETWEEN = "from 1000 to 5000, including both ends." Cleaner than writing >= 1000 AND <= 5000.
• LIKE with % = pattern matching. % means "any characters." 'Mar%' = starts with Mar. '%ino' = ends with ino. '%arin%' = contains arin anywhere.
• IN = shorthand for multiple OR conditions. IN ('Zagreb', 'Split') is the same as city = 'Zagreb' OR city = 'Split'.
• IS NULL = the ONLY way to check for NULL. Never use = NULL — it doesn't work in SQL because NULL isn't a value, it's the absence of a value. NULL = NULL returns false!`
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
    readMore: `A Foreign Key is like a reference check. If an order says "I belong to customer #99," the database checks: "Does customer #99 actually exist?" If not, it blocks the insert.

This is called referential integrity — the database guarantees that relationships are valid. Without it, you could have orders pointing to customers that don't exist (orphaned data).

The reverse also applies: you can't delete customer #99 if they have orders (by default). You'd have to delete the orders first, or set up ON DELETE CASCADE which auto-deletes the orders when the customer is deleted.

FK constraints are your safety net. Without them, bugs in your application code could silently corrupt your data.`
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
    readMore: `Sometimes no single column can uniquely identify a row. For example, a student can take many courses, and a course has many students. But a student can only take a specific course in a specific semester once.

So you combine (student_id, course_id, semester) into one primary key. Together they're unique, even though individually they're not.

Real-world examples:
• Shopping cart items: (cart_id, product_id) — one product per cart
• User roles: (user_id, role_id) — a user can't have the same role twice
• Flight bookings: (flight_id, seat_number) — one person per seat

In EF Core, you configure composite keys in OnModelCreating with .HasKey(x => new { x.StudentId, x.CourseId, x.Semester }).`
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
    readMore: `Normalization is about not repeating yourself in your database:

1NF (no lists): Don't put "Laptop, Mouse, Keyboard" in one cell. If you need to search for "Mouse," you'd have to do string parsing. One row per item instead.

2NF (full key dependency): If your key is (order_id, product_id), then product_name should NOT be in this table because it only depends on product_id, not the full key. Move it to a products table.

3NF (no transitive dependencies): If employees table has city and country, country depends on city, not on the employee. So if Zagreb moves to a different country (hypothetically), you'd have to update every employee in Zagreb. Move city/country to a cities table.

Each level eliminates a type of redundancy. Most real-world databases aim for 3NF.`
  },

  // === CHEAT SHEET / INTERVIEW ANSWERS ===
  {
    id: 47,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: DI",
    answer: "\"Classes declare dependencies in the constructor, the container provides them. Transient = every time, Scoped = per request, Singleton = once. DbContext is always Scoped.\"",
    readMore: `Say this in under 15 seconds. Practice it until it's automatic. If they ask "why Scoped for DbContext?" you follow up with: "Because one request needs one shared database session. Transient would create multiple disconnected sessions, Singleton would share one across all users simultaneously."`
  },
  {
    id: 48,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: Middleware",
    answer: "\"A pipeline every request passes through. Order matters. Authentication before authorization. Used for logging, error handling, CORS, auth.\"",
    readMore: `Keep it short. If they want more detail, explain the pipeline diagram: request goes through MW1 → MW2 → MW3 → Controller, then response comes back MW3 → MW2 → MW1. Each middleware can do work on the way in AND on the way out. The order in Program.cs determines the order in the pipeline.`
  },
  {
    id: 49,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: Filters",
    answer: "\"5 types: Authorization, Resource, Action, Exception, Result. Run inside MVC layer so they have access to action context. Exception filter is most useful for returning consistent error responses.\"",
    readMore: `Name all 5 in order: Authorization, Resource, Action, Exception, Result. The follow-up question is usually "how do filters differ from middleware?" Answer: "Middleware runs for every HTTP request and only sees raw HttpContext. Filters run inside MVC and have access to the controller, action name, arguments, and return value."`
  },
  {
    id: 50,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: LINQ",
    answer: "\"Extension methods for querying collections and databases. Where = filter, Select = project, OrderBy = sort, FirstOrDefault = get first or null, Include = eager-load related data. Deferred execution — runs on ToList().\"",
    readMore: `The key thing interviewers want to hear is "deferred execution." It shows you understand that LINQ builds a query description, not the result. The query only hits the database when you materialize it with ToList(), FirstOrDefault(), etc. This lets you compose queries conditionally before executing.`
  },
  {
    id: 51,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: EF Core",
    answer: "\"ORM mapping classes to tables. DbContext is the session. Change tracking auto-detects modifications. Include() prevents N+1. Migrations handle schema changes.\"",
    readMore: `The N+1 question is almost guaranteed. Be ready to explain: "If I load 100 employees and access their Department in a loop, that's 101 queries — 1 for employees plus 100 for departments. The fix is Include(e => e.Department) which generates a single JOIN query." This is the #1 EF Core interview topic.`
  },
  {
    id: 52,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: SOLID",
    answer: "\"S = one job. O = extend not modify. L = subclasses are drop-in replacements. I = small focused interfaces. D = depend on abstractions.\"",
    readMore: `Interviewers usually ask you to explain one or two in depth, not all five. The most commonly deep-dived are S (Single Responsibility) and D (Dependency Inversion) because they directly relate to real code decisions. Have the EmployeeService example ready for S, and the interface + DI container example ready for D.`
  },
  {
    id: 53,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: N+1 Problem",
    answer: "\"Load 100 employees, access Department in a loop = 101 queries. Fix: Include() generates a JOIN.\"",
    readMore: `This is the single most important EF Core concept for interviews. Be able to explain WHY it's 101 queries: the first query loads all employees. Then for each employee, accessing .Department triggers a separate lazy-loading query because the Department wasn't loaded yet. Include() tells EF to JOIN the Departments table in the original query, so everything comes back in one trip.`
  },
  {
    id: 54,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: Normalization",
    answer: "\"1NF = no lists in cells. 2NF = non-key columns depend on the full composite key. 3NF = non-key columns only depend on the PK.\"",
    readMore: `The memory aid is simple and sequential: each level adds one more rule.

1NF: atomic values (no lists in a single cell)
2NF: everything from 1NF + non-key columns must depend on the WHOLE key (matters for composite keys)
3NF: everything from 2NF + no non-key column depends on another non-key column

If they ask for an example, use: employees(id, name, city, country) violates 3NF because country depends on city, not on id. Fix: separate cities table.`
  },
  {
    id: 55,
    priority: "core",
    category: "Cheat Sheet",
    question: "Quick interview answer: Git",
    answer: "\"Distributed VCS. Branch for features, commit snapshots, push to remote, PR for code review, merge into main.\"",
    readMore: `For Git, they mainly want to know you use it daily and follow a proper workflow. Mention: feature branches, meaningful commit messages, pull requests for code review, and never committing directly to main. If asked about merge vs rebase, say you prefer merge for safety and know rebase exists for cleaner history.`
  },
]

export default revisionFlashcards
