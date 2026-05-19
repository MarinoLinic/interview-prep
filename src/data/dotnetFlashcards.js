// .NET / ASP.NET Core Flashcards
// Focus: DI, middleware, filters, EF Core, REST APIs, SOLID
// Friend says: "dependency injection, middleware, koji filteri postoje, LINQ i EF Core"

const dotnetFlashcards = [
  // === Dependency Injection ===
  {
    id: 1,
    priority: "core",
    category: "Dependency Injection",
    question: "What is Dependency Injection and why do we use it?",
    answer: "DI is providing a class with its dependencies from the outside rather than having the class create them itself. Instead of new OrderService() inside a controller, the controller declares what it needs in the constructor, and the DI container provides it. Benefits: loose coupling, easy testing (inject mocks), easy to swap implementations.",
    example: `// BAD — tightly coupled
public class OrderController
{
    private OrderService _service = new OrderService(); // hardcoded
}

// GOOD — depends on interface, not implementation
public class OrderController : ControllerBase
{
    private readonly IOrderService _service;

    public OrderController(IOrderService service)  // injected
    {
        _service = service;
    }
}

// Register in Program.cs:
builder.Services.AddScoped<IOrderService, OrderService>();`,
    readMore: `Think of it like ordering food:

Without DI: You go to the kitchen, find ingredients, cook the meal yourself.
With DI: You tell the waiter what you want, and the kitchen delivers it.

The class (controller) says "I need an IOrderService" in its constructor.
The DI container (waiter) sees this and provides an OrderService instance.

Why interfaces? Because tomorrow you can swap OrderService for MockOrderService
in tests, or FastOrderService in production — the controller doesn't care.

This is the "D" in SOLID (Dependency Inversion Principle):
"Depend on abstractions (interfaces), not concretions (classes)."`
  },
  {
    id: 2,
    priority: "core",
    category: "Dependency Injection",
    question: "What are the three DI lifetimes: Transient, Scoped, Singleton?",
    answer: "Transient = new instance EVERY time requested. Scoped = one instance per HTTP request (all services in the same request share it). Singleton = ONE instance for the entire app lifetime. Use Scoped for DbContext and business services. Use Singleton for caches and config. Use Transient for lightweight stateless helpers.",
    example: `// Program.cs registration
builder.Services.AddTransient<IEmailService, EmailService>();
// → new EmailService() every time it's injected

builder.Services.AddScoped<IOrderService, OrderService>();
// → same instance within one HTTP request

builder.Services.AddSingleton<ICacheService, CacheService>();
// → ONE instance shared across ALL requests forever

// Most common: Scoped for DB-related services
builder.Services.AddScoped<AppDbContext>();`,
    readMore: `This is one of the most asked .NET interview questions. Memorize this:

Transient: Created each time. Like getting a new napkin — use it and throw it away.
→ Good for: lightweight, stateless services

Scoped: One per HTTP request. Like a shopping cart — lasts for your visit, then gone.
→ Good for: DbContext (you want one DB connection per request)
→ ServiceA and ServiceB in the same request get the SAME DbContext

Singleton: One for the whole app. Like a shared whiteboard — everyone uses the same one.
→ Good for: caches, configuration, shared state
→ WARNING: Must be thread-safe (multiple requests access it simultaneously)

Common mistake: Injecting a Scoped service into a Singleton — the Scoped service
gets "captured" and lives forever, causing stale data bugs.`
  },

  // === Middleware ===
  {
    id: 3,
    priority: "core",
    category: "Middleware",
    question: "What is middleware in ASP.NET Core?",
    answer: "Middleware is a pipeline of components that every HTTP request passes through before reaching the controller, and every response passes through on the way back. Each middleware can inspect, modify, or short-circuit the request. ORDER MATTERS — authentication must come before authorization.",
    example: `// Program.cs — order matters!
app.UseExceptionHandler("/error"); // 1st — catch errors
app.UseHttpsRedirection();         // 2nd — redirect HTTP→HTTPS
app.UseAuthentication();           // 3rd — who are you?
app.UseAuthorization();            // 4th — what can you do?
app.MapControllers();              // 5th — route to controller

// Think of it as layers:
// Request  → ExcHandler → HTTPS → Auth → Authz → Controller
// Response ← ExcHandler ← HTTPS ← Auth ← Authz ← Controller`,
    readMore: `Think of middleware as security checkpoints at an airport:

1. Ticket check (Authentication) — "Who are you?"
2. Passport control (Authorization) — "Are you allowed?"
3. Security scan (Validation) — "Is your baggage safe?"
4. Gate (Controller) — "Here's your flight"

Each checkpoint can:
• Let you through to the next one (call next())
• Send you back (short-circuit — e.g., 401 Unauthorized)
• Modify your "ticket" (add headers, transform request)

The response travels back through the same checkpoints in reverse.

Key rule: UseAuthentication() MUST come before UseAuthorization().
If you flip them, authorization checks happen before the user is identified → always fails.`
  },
  {
    id: 4,
    priority: "important",
    category: "Middleware",
    question: "How do you create custom middleware?",
    answer: "Create a class with a constructor that takes RequestDelegate (the next middleware), and an InvokeAsync method that receives HttpContext. Code before 'await _next(context)' runs on the way IN, code after runs on the way OUT. Register with app.UseMiddleware<T>().",
    example: `public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;

    public RequestLoggingMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // BEFORE controller
        Console.WriteLine($"→ {context.Request.Method} {context.Request.Path}");

        await _next(context);  // pass to next middleware

        // AFTER controller
        Console.WriteLine($"← {context.Response.StatusCode}");
    }
}

// Register:
app.UseMiddleware<RequestLoggingMiddleware>();`,
  },

  // === Filters ===
  {
    id: 5,
    priority: "core",
    category: "Filters",
    question: "What are filters in ASP.NET Core and what types exist?",
    answer: "Filters run within the MVC pipeline (after routing, around controller actions). Types: Authorization filters (run first), Resource filters (caching), Action filters (before/after action), Exception filters (handle exceptions), Result filters (before/after result). Action filters are the most commonly asked about.",
    example: `// Action Filter — most common type
public class ValidateModelAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext ctx)
    {
        if (!ctx.ModelState.IsValid)
        {
            ctx.Result = new BadRequestObjectResult(ctx.ModelState);
            // short-circuits — controller action never runs
        }
    }
}

// Usage — apply to action or controller
[HttpPost]
[ValidateModel]
public async Task<IActionResult> Create(CreateOrderDto dto)
{
    // If we get here, model is valid
}`,
    readMore: `Filters vs Middleware — what's the difference?

Middleware: Runs for EVERY request. No access to MVC context.
  → Good for: logging, CORS, auth, error handling
  
Filters: Run only for MVC requests. Have access to controller, action, model state.
  → Good for: validation, action-specific logic, exception handling per controller

Filter execution order:
1. Authorization filters — check if user is allowed
2. Resource filters — caching, can short-circuit
3. Action filters — before/after the action method
4. Exception filters — handle exceptions from actions
5. Result filters — before/after the result is executed

You can apply filters:
• On a single action: [ValidateModel]
• On a whole controller: [ServiceFilter(typeof(LoggingFilter))]
• Globally: builder.Services.AddControllers(options => options.Filters.Add<GlobalFilter>())`
  },

  // === Entity Framework Core ===
  {
    id: 6,
    priority: "core",
    category: "EF Core",
    question: "What is Entity Framework Core and what is a DbContext?",
    answer: "EF Core is an ORM (Object-Relational Mapper) — maps C# classes to database tables. DbContext is your gateway to the database: it holds DbSet<T> properties (one per table), tracks changes to entities, and commits them with SaveChangesAsync(). Register it as Scoped in DI.",
    example: `// DbContext — your database gateway
public class AppDbContext : DbContext
{
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Order> Orders { get; set; }

    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) {}

    protected override void OnModelCreating(ModelBuilder mb)
    {
        mb.Entity<Order>()
            .HasOne(order => order.Customer)
            .WithMany(customer => customer.Orders)
            .HasForeignKey(order => order.CustomerId);
    }
}

// Register in Program.cs
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));`,
    readMore: `EF Core translates your C# code into SQL automatically.

Instead of writing:
  SELECT * FROM customers WHERE city = 'Zagreb'

You write:
  _context.Customers.Where(c => c.City == "Zagreb").ToListAsync()

EF Core generates the SQL for you and maps the results back to C# objects.

Key concepts:
• DbSet<T> = represents a table. _context.Customers = the customers table
• Navigation properties = relationships. customer.Orders = all orders for this customer
• Change tracking = EF Core watches what you modify and generates UPDATE SQL
• SaveChangesAsync() = commits all tracked changes to the database in one transaction`
  },
  {
    id: 7,
    priority: "core",
    category: "EF Core",
    question: "What is the N+1 problem and how do you fix it?",
    answer: "N+1 happens when you load a list of entities (1 query), then access a related entity on each one in a loop (N queries). With 100 orders, that's 101 queries! Fix it with .Include() (eager loading) — loads related data in a single JOIN query.",
    example: `// BAD — N+1 problem (101 queries for 100 orders!)
var orders = await _context.Orders.ToListAsync();  // 1 query
foreach (var order in orders)
{
    Console.WriteLine(order.Customer.Name);
    // ↑ 1 query PER order to load Customer — disaster!
}

// GOOD — eager loading with Include (1 query total)
var orders = await _context.Orders
    .Include(order => order.Customer)  // JOINs Customer
    .ToListAsync();
// Now order.Customer is already loaded — no extra queries`,
    readMore: `This is a CLASSIC interview question. The answer is almost always ".Include()".

Why it happens:
EF Core uses "lazy loading" by default in some configs — related data isn't loaded
until you access it. So each order.Customer triggers a separate SELECT.

Three loading strategies:
1. Eager loading (.Include()) — load everything upfront in one query. BEST for most cases.
2. Explicit loading — manually load related data when needed.
3. Lazy loading — auto-loads when accessed (requires proxies). Causes N+1 if not careful.

How to detect N+1:
• Enable EF Core logging to see generated SQL
• If you see the same SELECT repeated 100 times → N+1 problem
• Fix: add .Include() for the related entity`
  },
  {
    id: 8,
    priority: "important",
    category: "EF Core",
    question: "What are migrations in EF Core?",
    answer: "Migrations are a way to evolve your database schema over time using code. When you change your C# models, you create a migration that generates the SQL to update the database. This gives you version control for your database schema.",
    example: `// 1. Change your model
public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Phone { get; set; }  // NEW column
}

// 2. Create migration (generates SQL)
// dotnet ef migrations add AddCustomerPhone

// 3. Apply to database
// dotnet ef database update

// 4. To see the SQL without applying:
// dotnet ef migrations script`,
  },

  // === REST API ===
  {
    id: 9,
    priority: "core",
    category: "REST API",
    question: "What HTTP status codes should you use for CRUD operations?",
    answer: "200 OK = success (GET). 201 Created = resource created (POST). 204 No Content = success, no body (PUT/DELETE). 400 Bad Request = invalid input. 401 Unauthorized = not authenticated. 403 Forbidden = authenticated but not allowed. 404 Not Found = resource doesn't exist. 500 = server error.",
    example: `[HttpGet]
public async Task<IActionResult> GetAll()
    => Ok(await _service.GetAllAsync());          // 200

[HttpGet("{id}")]
public async Task<IActionResult> GetById(int id)
{
    var item = await _service.GetByIdAsync(id);
    return item == null ? NotFound() : Ok(item);  // 404 or 200
}

[HttpPost]
public async Task<IActionResult> Create(CreateDto dto)
{
    var created = await _service.CreateAsync(dto);
    return CreatedAtAction(                       // 201
        nameof(GetById), new { id = created.Id }, created);
}

[HttpDelete("{id}")]
public async Task<IActionResult> Delete(int id)
{
    await _service.DeleteAsync(id);
    return NoContent();                           // 204
}`,
    readMore: `Memorize these status code groups:

2xx = Success
  200 = OK (here's your data)
  201 = Created (I made the thing, here's where to find it)
  204 = No Content (done, nothing to return)

4xx = Client error (YOUR fault)
  400 = Bad Request (invalid data sent)
  401 = Unauthorized (who are you? log in first)
  403 = Forbidden (I know who you are, but you can't do this)
  404 = Not Found (that thing doesn't exist)

5xx = Server error (MY fault)
  500 = Internal Server Error (something crashed)

Interview tip: Always use 201 with CreatedAtAction for POST (not just 200).
It includes a Location header pointing to where the new resource lives.`
  },
  {
    id: 10,
    priority: "important",
    category: "REST API",
    question: "What are DTOs and why use them instead of exposing your models?",
    answer: "DTOs (Data Transfer Objects) are simple classes that define what data goes in/out of your API. Never expose your database models directly — DTOs let you control which fields are visible, prevent over-posting attacks, and decouple your API from your database schema.",
    example: `// Database model — has everything
public class Employee
{
    public int Id { get; set; }
    public string Name { get; set; }
    public decimal Salary { get; set; }
    public string PasswordHash { get; set; }  // NEVER expose!
}

// DTO for creation — only what's needed to create
public class CreateEmployeeDto
{
    public string Name { get; set; }
    public decimal Salary { get; set; }
}

// DTO for response — control what client sees
public class EmployeeResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    // No Salary, no PasswordHash
}`,
  },

  // === SOLID ===
  {
    id: 11,
    priority: "important",
    category: "SOLID",
    question: "What are the SOLID principles?",
    answer: "S = Single Responsibility (one class, one job). O = Open/Closed (open for extension, closed for modification). L = Liskov Substitution (subclass works wherever parent works). I = Interface Segregation (don't force unnecessary methods). D = Dependency Inversion (depend on abstractions, not concretions — this is DI).",
    example: `// S — Single Responsibility
// OrderService handles orders. EmailService sends emails. Don't mix.

// O — Open/Closed
// Add new behavior by creating new classes, not modifying existing ones

// L — Liskov Substitution
// If Dog : Animal, then Dog should work anywhere Animal is expected

// I — Interface Segregation
// Split IFullService into IReadService + IWriteService

// D — Dependency Inversion
// Inject IOrderService, not OrderService
public class Controller
{
    private readonly IOrderService _service; // interface, not class
}`,
    readMore: `For a junior interview, focus on S and D — they're the most practical.

S (Single Responsibility):
"Each class should have one reason to change."
Bad: UserService that handles login, email sending, AND file uploads.
Good: AuthService, EmailService, FileService — each does one thing.

D (Dependency Inversion):
"Depend on interfaces, not implementations."
This IS dependency injection. You already know it if you understand DI.

For L, I, O — know the name and a one-sentence explanation.
Don't worry about deep examples for a junior role.`
  },

  // === Program.cs ===
  {
    id: 12,
    priority: "important",
    category: "Architecture",
    question: "What happens in Program.cs in an ASP.NET Core app?",
    answer: "Program.cs is the entry point. It has two phases: 1) Service registration (builder.Services.Add...) — configure DI, DbContext, authentication. 2) Middleware pipeline (app.Use...) — configure the request pipeline in the correct order. Then app.Run() starts the server.",
    example: `var builder = WebApplication.CreateBuilder(args);

// === PHASE 1: Register services (DI container) ===
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite("Data Source=app.db"));
builder.Services.AddScoped<IOrderService, OrderService>();

var app = builder.Build();

// === PHASE 2: Configure middleware pipeline ===
app.UseExceptionHandler("/error");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run(); // Start the server`,
  },
];

export default dotnetFlashcards;
