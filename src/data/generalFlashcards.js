// General Backend / Programming Interview Questions
// Mix of behavioral, conceptual, and scenario questions
// Some have "best answers", others are prompts to prepare for

const generalFlashcards = [
  // === Architecture & Design ===
  {
    id: 1,
    priority: "core",
    category: "Architecture",
    question: "What is the difference between monolithic and microservices architecture?",
    answer: "Monolith = one codebase, one deployment, everything together. Microservices = separate services for each domain (users, orders, payments), each deployable independently. Monolith is simpler to start with. Microservices scale better but add complexity (networking, data consistency, deployment).",
    readMore: `For a junior role, the honest answer is:

"I'd start with a monolith because it's simpler to develop, test, and deploy.
If specific parts need to scale independently or the team grows large enough
that people step on each other's toes, you can extract microservices later."

This shows maturity — jumping straight to microservices is actually a red flag for juniors.`
  },
  {
    id: 2,
    priority: "core",
    category: "Architecture",
    question: "What is REST and what makes an API RESTful?",
    answer: "REST (Representational State Transfer) uses HTTP methods to perform CRUD: GET (read), POST (create), PUT/PATCH (update), DELETE (remove). RESTful APIs use resource-based URLs (/api/users/5), are stateless (no server-side sessions), and return appropriate HTTP status codes.",
    example: `GET    /api/users      → list all users
GET    /api/users/5    → get user with id 5
POST   /api/users      → create new user
PUT    /api/users/5    → update user 5
DELETE /api/users/5    → delete user 5

// Good URL design:
/api/orders/42/items     → items for order 42
/api/users?city=Zagreb   → filter users by city

// Bad URL design:
/api/getUser?id=5        → verb in URL (use GET method instead)
/api/deleteUser/5        → verb in URL (use DELETE method instead)`,
  },
  {
    id: 3,
    priority: "important",
    category: "Architecture",
    question: "What is the difference between SQL and NoSQL databases?",
    answer: "SQL (relational): structured tables, fixed schema, ACID transactions, uses SQL language. Good for structured data with relationships (e-commerce, banking). NoSQL (non-relational): flexible schema, various types (document, key-value, graph). Good for unstructured data, horizontal scaling, rapid iteration.",
    readMore: `SQL databases: PostgreSQL, MySQL, SQL Server, SQLite
→ Data lives in tables with rows and columns
→ Schema is defined upfront
→ Relationships via foreign keys and JOINs
→ ACID: Atomicity, Consistency, Isolation, Durability

NoSQL databases: MongoDB (document), Redis (key-value), Neo4j (graph)
→ Flexible schema — each document can have different fields
→ Usually no JOINs — data is often denormalized (duplicated)
→ Scales horizontally (add more servers) easier than SQL

When to choose:
→ Structured data with relationships → SQL
→ Flexible, rapidly changing data → NoSQL
→ Need transactions → SQL
→ Need massive scale with simple queries → NoSQL`
  },

  // === Version Control ===
  {
    id: 4,
    priority: "core",
    category: "Git",
    question: "What is your Git workflow? How do you handle feature development?",
    answer: "Use feature branches: create a branch from main/develop, work on the feature, open a pull request, get code review, then merge. Never commit directly to main. Use meaningful commit messages. Resolve conflicts by pulling the latest main into your branch before merging.",
    readMore: `A good workflow answer:

1. "I create a feature branch from main: git checkout -b feature/add-user-endpoint"
2. "I make small, focused commits with clear messages"
3. "When done, I push and open a pull request"
4. "A teammate reviews my code"
5. "After approval, I merge (usually squash merge to keep history clean)"
6. "If there are conflicts, I pull main into my branch and resolve them"

Bonus points for mentioning:
• Branch naming conventions: feature/, bugfix/, hotfix/
• CI/CD running tests on PR
• Squash merging for clean history`
  },

  // === Testing ===
  {
    id: 5,
    priority: "important",
    category: "Testing",
    question: "What types of tests do you know and when do you use each?",
    answer: "Unit tests = test individual methods/functions in isolation (mock dependencies). Integration tests = test multiple components together (real DB, real API calls). E2E tests = test the full application from user perspective. The testing pyramid: many unit tests, fewer integration, fewest E2E.",
    example: `// Unit test example (xUnit + Moq)
[Fact]
public async Task GetById_ReturnsEmployee_WhenExists()
{
    // Arrange
    var mockService = new Mock<IEmployeeService>();
    mockService.Setup(s => s.GetByIdAsync(1))
        .ReturnsAsync(new Employee { Id = 1, Name = "Marino" });
    
    var controller = new EmployeesController(mockService.Object);
    
    // Act
    var result = await controller.GetById(1);
    
    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result);
    var employee = Assert.IsType<Employee>(okResult.Value);
    Assert.Equal("Marino", employee.Name);
}`,
    readMore: `The testing pyramid:

        /\\
       / E2E \\        ← Few: slow, expensive, brittle
      /--------\\
     /Integration\\    ← Some: test components together
    /--------------\\
   /   Unit Tests    \\ ← Many: fast, cheap, isolated

For a junior role, knowing unit tests is enough:
• Arrange (set up) → Act (call the method) → Assert (check results)
• Mock dependencies with Mock<IService>
• Test both happy path AND error cases`
  },

  // === Problem Solving / Behavioral ===
  {
    id: 6,
    priority: "core",
    category: "Behavioral",
    question: "The API is suddenly slow. How do you debug it?",
    answer: "1. Check for N+1 queries (most common cause in EF Core). 2. Check for missing database indexes on frequently queried columns. 3. Look at application logs for slow queries. 4. Profile the SQL that EF Core generates. 5. Check external dependencies (APIs, services). 6. Check if the data volume has grown (need pagination?).",
    readMore: `Walk through this systematically in the interview:

"First, I'd check the logs to identify which endpoint is slow.
Then I'd look at the database queries — N+1 is the most common cause in EF Core.
I'd enable SQL logging to see what queries are actually being generated.
If queries are fine, I'd check for missing indexes on frequently filtered columns.
If it's not the database, I'd check external API calls or network issues.
Finally, I'd consider if the data has simply grown too large and we need pagination."`
  },
  {
    id: 7,
    priority: "core",
    category: "Behavioral",
    question: "A bug is reported in production. What do you do?",
    answer: "1. Check logs to understand what happened. 2. Try to reproduce locally. 3. Don't push directly to production — create a hotfix branch. 4. Fix, test, get a code review. 5. Deploy through the normal pipeline. 6. Communicate status to stakeholders throughout.",
    readMore: `The key things interviewers look for:

1. Stay calm — don't panic
2. Investigate before coding — check logs, understand the problem
3. Follow process — hotfix branch, code review, don't bypass pipeline
4. Communicate — tell your team/PM what's happening and ETA
5. Post-mortem — after fixing, understand WHY it happened and how to prevent it

Never say: "I'd SSH into the production server and fix the code directly."
That's a red flag.`
  },
  {
    id: 8,
    priority: "important",
    category: "Behavioral",
    question: "How do you handle disagreements with a teammate about code?",
    answer: "Discuss the tradeoffs objectively — focus on facts, not opinions. If both approaches are valid, consider: readability, maintainability, team conventions. If you can't agree, ask a third person or tech lead. The important thing is the team agrees on a consistent approach.",
  },
  {
    id: 9,
    priority: "important",
    category: "Behavioral",
    question: "Tell me about a project you worked on. What was your role?",
    answer: "(Prepare YOUR answer) Structure: What was the project? What was your specific contribution? What challenges did you face? How did you solve them? What did you learn? Even personal projects count — show enthusiasm and growth.",
    readMore: `Use the STAR method:

S (Situation): "I built an interview prep app to study for this job"
T (Task): "I needed to create an interactive SQL simulator with flashcards"
A (Action): "I used React, Tailwind, and sql.js to build an in-browser SQL engine"
R (Result): "I now have a working app that helped me learn SQL, LINQ, and .NET concepts"

Tips:
• Be specific about YOUR contribution (not just "the team did")
• Mention challenges you overcame
• Show what you learned
• It's OK to talk about personal/learning projects as a junior`
  },

  // === Security ===
  {
    id: 10,
    priority: "important",
    category: "Security",
    question: "What are the most common web security vulnerabilities?",
    answer: "SQL Injection (use parameterized queries/ORMs), XSS (sanitize user input, encode output), CSRF (use anti-forgery tokens), broken authentication (hash passwords, use JWT properly), sensitive data exposure (HTTPS, don't log secrets). EF Core prevents SQL injection by default.",
    readMore: `For a junior, know these three well:

SQL Injection:
  BAD: $"SELECT * FROM users WHERE name = '{userInput}'"
  GOOD: Use parameterized queries or EF Core (does it automatically)

XSS (Cross-Site Scripting):
  BAD: Rendering user input directly into HTML
  GOOD: Encode/sanitize output. Razor does this by default with @Model.Name

CSRF (Cross-Site Request Forgery):
  BAD: No verification that the request came from your site
  GOOD: Use anti-forgery tokens (built into ASP.NET)

Bonus: "EF Core uses parameterized queries by default, which prevents SQL injection.
And ASP.NET's Razor engine HTML-encodes by default, which prevents XSS."`
  },

  // === General CS Concepts ===
  {
    id: 11,
    priority: "core",
    category: "Concepts",
    question: "What is the difference between authentication and authorization?",
    answer: "Authentication = WHO are you? (login, JWT token, username/password). Authorization = WHAT can you do? (roles, permissions, policies). Authentication must happen BEFORE authorization. In ASP.NET: UseAuthentication() before UseAuthorization().",
    example: `// Authentication — verify identity
app.UseAuthentication();  // reads JWT/cookie, sets User

// Authorization — check permissions
app.UseAuthorization();   // checks [Authorize] attributes

// On a controller:
[Authorize]                    // must be logged in
[Authorize(Roles = "Admin")]   // must be admin
public class AdminController : ControllerBase { }`,
  },
  {
    id: 12,
    priority: "important",
    category: "Concepts",
    question: "What is caching and when would you use it?",
    answer: "Caching stores frequently accessed data in fast storage (memory) to avoid expensive operations (DB queries, API calls). Types: in-memory cache (IMemoryCache), distributed cache (Redis). Use for: data that doesn't change often, expensive computations, frequently accessed endpoints.",
  },
  {
    id: 13,
    priority: "extra",
    category: "Concepts",
    question: "What are design patterns you should know?",
    answer: "Repository Pattern = abstracts data access behind an interface. Factory Pattern = creates objects without specifying exact class. Singleton = one instance globally (DI handles this). Observer = pub/sub event system. Strategy = swap algorithms at runtime. For juniors: know Repository and DI container (which IS a factory).",
  },
  {
    id: 14,
    priority: "core",
    category: "Concepts",
    question: "What is HTTPS and why is it important?",
    answer: "HTTPS encrypts communication between client and server using TLS/SSL. Without it, anyone on the network can read passwords, tokens, and data in plain text. Always use HTTPS in production. In ASP.NET: app.UseHttpsRedirection() redirects HTTP to HTTPS.",
  },
  {
    id: 15,
    priority: "extra",
    category: "Concepts",
    question: "What is Docker and why is it used?",
    answer: "Docker packages your app + all its dependencies into a container that runs the same everywhere (dev, staging, production). 'Works on my machine' → 'Works in the container.' A Dockerfile defines how to build the container. docker-compose orchestrates multiple containers (app + database).",
  },

  // === SOLID Principles ===
  {
    id: 16,
    priority: "core",
    category: "SOLID",
    question: "What is the Single Responsibility Principle (S in SOLID)?",
    answer: "A class should have only one reason to change — meaning it should do one job. If a class handles business logic AND sends emails AND writes logs, it has too many responsibilities. Split it into focused classes: OrderService, EmailService, Logger.",
    readMore: `Bad example:
class UserService {
  CreateUser() { ... }
  SendWelcomeEmail() { ... }
  GeneratePdfReport() { ... }
  LogToFile() { ... }
}

Good example:
class UserService { CreateUser() { ... } }
class EmailService { SendWelcomeEmail() { ... } }
class ReportService { GeneratePdf() { ... } }
class Logger { Log() { ... } }

Why it matters: When you need to change how emails are sent, you only touch EmailService. No risk of accidentally breaking user creation.`
  },
  {
    id: 17,
    priority: "core",
    category: "SOLID",
    question: "What is the Open/Closed Principle (O in SOLID)?",
    answer: "Classes should be open for extension but closed for modification. Instead of modifying existing code to add new behavior (risky, might break things), you extend it — create a new class that implements an interface or inherits from a base class.",
    readMore: `Bad — modifying existing code for every new payment type:
class PaymentService {
  Process(type) {
    if (type == "credit") { ... }
    else if (type == "paypal") { ... }
    else if (type == "crypto") { ... }  // have to touch this class every time
  }
}

Good — extend without modifying:
interface IPaymentProcessor { void Process(); }
class CreditCardProcessor : IPaymentProcessor { ... }
class PayPalProcessor : IPaymentProcessor { ... }
class CryptoProcessor : IPaymentProcessor { ... }  // just add a new class

The existing code never changes. New payment types = new classes, not editing old ones.`
  },
  {
    id: 18,
    priority: "important",
    category: "SOLID",
    question: "What is the Liskov Substitution Principle (L in SOLID)?",
    answer: "A subclass should be usable anywhere its parent class is expected without breaking anything. If your code works with Animal, it should also work with Dog or Cat (subclasses of Animal) without surprises or errors.",
    readMore: `Classic violation — Square extending Rectangle:

class Rectangle { Width, Height, Area() => Width * Height }
class Square : Rectangle { 
  // Setting Width must also set Height... 
  // This breaks code that expects Width and Height to be independent
}

If someone does:
  Rectangle r = new Square();
  r.Width = 5;
  r.Height = 10;
  r.Area() // expects 50, gets 100 — BROKEN

Rule of thumb: If your subclass needs to override a parent method and the override completely changes the expected behavior, you're violating LSP.`
  },
  {
    id: 19,
    priority: "important",
    category: "SOLID",
    question: "What is the Interface Segregation Principle (I in SOLID)?",
    answer: "Don't force a class to implement methods it doesn't need. Instead of one fat interface with 10 methods, split it into smaller, focused interfaces. A class should only depend on the methods it actually uses.",
    readMore: `Bad — one giant interface:
interface IWorker {
  void Code();
  void Test();
  void Design();
  void ManagePeople();
}
// A junior dev has to implement ManagePeople() even though they don't manage anyone

Good — split by role:
interface IDeveloper { void Code(); void Test(); }
interface IDesigner { void Design(); }
interface IManager { void ManagePeople(); }

class JuniorDev : IDeveloper { ... }        // only what they need
class TechLead : IDeveloper, IManager { ... } // both`
  },
  {
    id: 20,
    priority: "core",
    category: "SOLID",
    question: "What is the Dependency Inversion Principle (D in SOLID)?",
    answer: "High-level modules should not depend on low-level modules. Both should depend on abstractions (interfaces). This IS Dependency Injection — inject IOrderService (interface), not OrderService (concrete class). Makes code testable and swappable.",
    readMore: `Bad — depends on concrete implementation:
class OrderController {
  private OrderService _service = new OrderService(); // GLUED to this class
  // Can't test without a real OrderService
  // Can't swap for a different implementation
}

Good — depends on abstraction:
class OrderController {
  private readonly IOrderService _service;
  public OrderController(IOrderService service) { _service = service; }
  // Can inject MockOrderService in tests
  // Can swap to FastOrderService in production
}

This principle is literally what DI containers do in .NET.
When the interviewer asks about SOLID, connecting D to DI shows real understanding.`
  },
];

export default generalFlashcards;
