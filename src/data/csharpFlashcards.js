// C# Flashcards — focus on key differences from JavaScript and important C# concepts
// Priority: "core" = friend will ask, "important" = likely, "extra" = nice to know

const csharpFlashcards = [
  // === Type System ===
  {
    id: 1,
    priority: "core",
    category: "Types",
    question: "What's the difference between value types and reference types in C#?",
    answer: "Value types (int, bool, struct, enum) store data directly on the stack. Reference types (class, string, array, object) store a reference (pointer) to heap memory. Assigning a value type copies the data; assigning a reference type copies the reference (both point to the same object).",
    example: `// Value type — copy is independent
int a = 5;
int b = a;  // b is a separate copy
b = 10;     // a is still 5

// Reference type — both point to same object
var list1 = new List<int> { 1, 2, 3 };
var list2 = list1;  // same list!
list2.Add(4);       // list1 also has 4 now`,
    readMore: `In JavaScript, everything is basically a reference type (objects, arrays) or a primitive.
In C#, the distinction matters because:

• int, double, bool, char, struct, enum → value types (stack)
• class, string, array, interface → reference types (heap)

Why it matters: If you pass a struct to a method, changes inside the method DON'T affect the original.
If you pass a class instance, changes DO affect the original.

The key JS → C# trap: In JS, numbers/strings are immutable primitives. In C#, 
int is a value type (similar), but structs are also value types (no JS equivalent).`
  },
  {
    id: 2,
    priority: "core",
    category: "Types",
    question: "What is the difference between 'var', 'dynamic', and explicit typing?",
    answer: "var = compiler infers the type at compile time (still strongly typed). dynamic = type resolved at runtime (no IntelliSense, no compile-time checks). Explicit typing (int x = 5) = you declare the type yourself. In C#, var is NOT like JavaScript's var — it's strongly typed.",
    example: `var name = "Marino";     // compiler knows it's string
// name = 42;             // ERROR — can't assign int to string

dynamic value = "hello"; // no compile-time checking
value = 42;              // OK at compile time
value = true;            // also OK — resolved at runtime

string explicit = "typed"; // you declare the type`,
    readMore: `Coming from JavaScript, the biggest trap is thinking C#'s var works like JS var.

JavaScript var: weakly typed, function-scoped, can hold anything
C# var: strongly typed, the compiler figures out the type and LOCKS it

So in C#:
var x = 5;    // x is int forever. You can't do x = "hello" later.
var y = "hi"; // y is string forever.

When to use var in C#:
• When the type is obvious: var list = new List<string>()
• With LINQ: var result = items.Where(i => i.Active)
• DON'T use when the type isn't clear: var x = GetData() — what type is this?`
  },
  {
    id: 3,
    priority: "important",
    category: "Types",
    question: "What are nullable types and how do you handle null in C#?",
    answer: "Value types can't be null by default. Add ? to make them nullable: int? x = null. Use ?? (null coalescing) to provide defaults, and ?. (null conditional) to safely access members. C# 8+ has nullable reference types for compile-time null warnings.",
    example: `int? age = null;           // nullable int
int actual = age ?? 0;     // if null, use 0

string? name = GetName();  // might be null
int len = name?.Length ?? 0; // safe access

// Null check patterns
if (name is not null) { /* safe */ }
if (name != null) { /* also works */ }`,
    readMore: `In JavaScript, null and undefined are everywhere. In C#, value types (int, bool, etc.)
CANNOT be null unless you opt in with ?.

?? is called "null coalescing operator":
  string display = name ?? "Unknown";
  → If name is null, use "Unknown"

?. is called "null conditional operator":
  int? length = name?.Length;
  → If name is null, length is null (doesn't throw)

??= is "null coalescing assignment":
  name ??= "Default";
  → Only assigns if name IS null`
  },

  // === Keywords ===
  {
    id: 4,
    priority: "core",
    category: "Keywords",
    question: "What does 'static' mean in C#?",
    answer: "static means the member belongs to the TYPE itself, not to instances. You access it with ClassName.Method(), not new ClassName().Method(). A static class can't be instantiated at all. Static members are shared across all instances.",
    example: `public static class MathHelper
{
    public static int Add(int a, int b) => a + b;
}

// Usage — no 'new' needed
int sum = MathHelper.Add(3, 4);

// Static field — shared across ALL instances
public class Counter
{
    public static int TotalCount = 0;
    public Counter() { TotalCount++; }
}`,
    readMore: `Think of static as "belongs to the blueprint, not the house."

Non-static: Every house has its own door. Each instance has its own copy.
Static: All houses share one mailbox. There's only one, on the class itself.

Common uses:
• Utility/helper methods: Math.Max(), string.IsNullOrEmpty()
• Constants: public static readonly string AppName = "MyApp"
• Factory methods: Task.Run(), Guid.NewGuid()

Interview tip: "static means it belongs to the type, not instances. 
You don't need to create an object to use it."`
  },
  {
    id: 5,
    priority: "core",
    category: "Keywords",
    question: "What's the difference between 'abstract' and 'interface' in C#?",
    answer: "Interface = pure contract, no implementation (until C# 8 default methods). A class can implement MULTIPLE interfaces. Abstract class = partial implementation, can have fields, constructors, and both abstract and concrete methods. A class can inherit only ONE abstract class.",
    example: `// Interface — just a contract
public interface ILogger
{
    void Log(string message);
}

// Abstract class — partial implementation
public abstract class Animal
{
    public string Name { get; set; }      // concrete
    public abstract string Speak();       // must override
    public void Breathe() => Console.WriteLine("*breathes*");
}

// Class can implement multiple interfaces
public class Dog : Animal, ILogger
{
    public override string Speak() => "Woof";
    public void Log(string msg) => Console.WriteLine(msg);
}`,
    readMore: `This is a VERY common interview question. Key differences:

Interface:
• No fields, no constructors
• All members are public by default
• A class can implement MANY interfaces
• Think: "what can it DO?" (IDisposable, IEnumerable)

Abstract class:
• Can have fields, constructors, regular methods
• Can have access modifiers (private, protected)
• A class can inherit only ONE
• Think: "what IS it?" (Animal, Shape, Vehicle)

Rule of thumb: Use interfaces for contracts/capabilities,
use abstract classes for shared base behavior with some common code.`
  },
  {
    id: 6,
    priority: "important",
    category: "Keywords",
    question: "What do 'virtual', 'override', 'sealed', and 'partial' mean?",
    answer: "virtual = method CAN be overridden by child. override = replaces parent's virtual method. sealed = class can't be inherited (or method can't be further overridden). partial = splits a class definition across multiple files (used by code generators, EF Core scaffolding).",
    example: `public class Animal
{
    public virtual string Speak() => "...";  // CAN override
}

public class Dog : Animal
{
    public override string Speak() => "Woof"; // overrides
}

public sealed class FinalDog : Dog
{
    // No class can inherit from FinalDog
}

// partial — same class, two files
// File1.cs
public partial class User { public string Name { get; set; } }
// File2.cs (generated code)
public partial class User { public void Validate() { } }`,
    readMore: `virtual + override = polymorphism (one of OOP's core pillars).

Without virtual: The parent's method is always called, even if child has a "new" version.
With virtual + override: The child's version is called, even through a parent reference.

sealed: "Nobody can extend this further." Used for security or optimization.
String class in .NET is sealed — you can't inherit from it.

partial: Lets you split one class across files. You'll see it in:
• EF Core scaffolded models (auto-generated + your custom code)
• Windows Forms / Blazor (designer file + your code)
• Large classes that benefit from organization`
  },
  {
    id: 7,
    priority: "extra",
    category: "Keywords",
    question: "What are 'readonly' and 'const' in C#?",
    answer: "const = compile-time constant, must be assigned at declaration, value is baked into compiled code. readonly = can be assigned at declaration OR in constructor, then never changed. Use const for true constants (Pi, MaxSize), readonly for values set at runtime (config, injected values).",
    example: `public class Config
{
    public const double Pi = 3.14159;        // compile-time
    public readonly string ConnectionString; // runtime

    public Config(string connStr)
    {
        ConnectionString = connStr; // OK — in constructor
    }
    
    // ConnectionString = "new"; // ERROR after construction
}`,
  },

  // === Async/Await ===
  {
    id: 8,
    priority: "core",
    category: "Async",
    question: "How does async/await work in C#? How is it different from JavaScript?",
    answer: "Similar concept: async marks a method as asynchronous, await pauses until the async operation completes. Key difference: C# returns Task<T> (like Promise<T>), and you should NEVER use .Result or .Wait() (deadlock risk). Always 'async all the way up'.",
    example: `// C# — uses Task<T> instead of Promise<T>
public async Task<string> GetDataAsync()
{
    var result = await httpClient.GetStringAsync(url);
    return result;  // auto-wrapped in Task<string>
}

// NEVER do this — deadlock risk!
var data = service.GetDataAsync().Result;  // BAD

// Always await
var data = await service.GetDataAsync();   // GOOD`,
    readMore: `JavaScript vs C# async:

JavaScript:
  async function getData() { return await fetch(url); }
  // Returns Promise<Response>

C#:
  public async Task<string> GetDataAsync() { return await ...; }
  // Returns Task<string>

Key differences:
1. C# uses Task/Task<T>, JS uses Promise
2. C# convention: suffix async methods with "Async"
3. C# has a real thread pool — await frees the thread for other work
4. NEVER use .Result or .Wait() in C# — causes deadlocks in web apps
5. "async void" in C# = fire-and-forget (only for event handlers, NEVER in services)`
  },

  // === Collections ===
  {
    id: 9,
    priority: "important",
    category: "Collections",
    question: "What are the main collection types in C#?",
    answer: "List<T> = resizable array (like JS Array). Dictionary<TKey, TValue> = key-value pairs (like JS Map/object). HashSet<T> = unique values only. Queue<T> = FIFO. Stack<T> = LIFO. IEnumerable<T> = the base interface for anything you can loop over.",
    example: `var list = new List<string> { "a", "b", "c" };
list.Add("d");
list.Remove("b");
list.Count; // 3

var dict = new Dictionary<string, int>
{
    { "apples", 3 }, { "bananas", 5 }
};
dict["oranges"] = 2;  // add
int count = dict["apples"]; // get

var set = new HashSet<int> { 1, 2, 3 };
set.Add(2);  // ignored — already exists`,
    readMore: `Coming from JavaScript:

JS Array → C# List<T> (resizable, ordered)
JS Object/Map → C# Dictionary<TKey, TValue>
JS Set → C# HashSet<T>

The big difference: C# collections are TYPED.
List<string> can ONLY hold strings. You can't put a number in it.
In JS, arrays can hold anything: [1, "hello", true, null]

IEnumerable<T> is important:
It's the interface that lets you use foreach and LINQ.
Most methods return IEnumerable — call .ToList() when you need a concrete list.`
  },

  // === OOP Differences from JS ===
  {
    id: 10,
    priority: "important",
    category: "OOP",
    question: "How is C# OOP different from JavaScript?",
    answer: "C# has real classes (not syntactic sugar over prototypes). C# has access modifiers (public/private/protected/internal). C# supports single inheritance + multiple interfaces. C# has properties ({ get; set; }) instead of plain fields. C# has strong typing for parameters and return types.",
    example: `// C# — real encapsulation
public class User
{
    public string Name { get; set; }          // property
    public string Email { get; private set; } // read outside, write inside only
    private string _password;                 // truly private

    public User(string name, string email)
    {
        Name = name;
        Email = email;
    }
}

// JS equivalent — no real privacy (except #private)
// class User { constructor(name) { this.name = name; } }`,
    readMore: `Key OOP differences C# vs JavaScript:

1. Access modifiers MATTER in C#:
   public — anyone can access
   private — only this class
   protected — this class + children
   internal — this assembly (project) only

2. Properties vs fields:
   JS: this.name = "Marino"  (just a field)
   C#: public string Name { get; set; }  (property with getter/setter)

3. Inheritance:
   JS: class Dog extends Animal (prototype chain)
   C#: class Dog : Animal (true inheritance, single only)

4. No 'this' confusion:
   In C#, 'this' always refers to the current instance. No binding issues.`
  },
  {
    id: 11,
    priority: "important",
    category: "OOP",
    question: "What are generics in C# and how do they compare to JavaScript?",
    answer: "Generics let you write type-safe code that works with any type. List<T>, Dictionary<TKey, TValue>, Task<T> are all generic. JavaScript has no equivalent — everything is 'any' implicitly. Generics catch type errors at compile time, not runtime.",
    example: `// Generic class
public class Result<T>
{
    public bool Success { get; set; }
    public T Data { get; set; }
    public string Error { get; set; }
}

// Usage — T is replaced with the actual type
var userResult = new Result<User> { Success = true, Data = user };
var countResult = new Result<int> { Success = true, Data = 42 };

// Generic method
public T FindById<T>(int id) where T : class
{
    return _context.Set<T>().Find(id);
}`,
    readMore: `Generics = "I don't know what type yet, but it'll be consistent."

Without generics, you'd need:
  List of ints → IntList
  List of strings → StringList
  List of users → UserList

With generics:
  List<int>, List<string>, List<User> — one class handles all

JavaScript doesn't have this because JS doesn't have compile-time types.
TypeScript has generics (Array<number>, Promise<string>) — same concept.

Common constraints:
  where T : class    — T must be a reference type
  where T : struct   — T must be a value type
  where T : new()    — T must have a parameterless constructor
  where T : IEntity  — T must implement IEntity`
  },

  // === Error Handling ===
  {
    id: 12,
    priority: "important",
    category: "Error Handling",
    question: "How does exception handling differ between C# and JavaScript?",
    answer: "C# uses try/catch/finally like JS, but with typed exceptions. You can catch specific exception types in order (most specific first). C# has no 'undefined' — only null. throw without a value re-throws the current exception (preserving stack trace).",
    example: `try
{
    var result = int.Parse("abc");
}
catch (FormatException ex)    // specific first
{
    Console.WriteLine($"Bad format: {ex.Message}");
}
catch (Exception ex)          // catch-all last
{
    Console.WriteLine($"Error: {ex.Message}");
    throw;  // re-throw, keeps stack trace
}
finally
{
    // always runs — cleanup
}`,
  },

  // === String Handling ===
  {
    id: 13,
    priority: "extra",
    category: "Types",
    question: "How do C# strings differ from JavaScript strings?",
    answer: "Both are immutable. C# has string interpolation with $\"Hello {name}\" (like JS template literals). C# strings are reference types but behave like value types for equality (== compares content, not reference). C# has verbatim strings @\"...\" for paths and multi-line.",
    example: `// Interpolation (like JS template literals)
string greeting = $"Hello, {name}!";

// Verbatim string — no escape needed
string path = @"C:\\Users\\file.txt";

// Raw string literal (C# 11)
string json = \"\"\"
    { "name": "Marino", "age": 25 }
    \"\"\";

// Equality — compares content (unlike JS objects)
string a = "hello";
string b = "hello";
Console.WriteLine(a == b); // true`,
  },

  // === LINQ basics (bridging) ===
  {
    id: 14,
    priority: "core",
    category: "LINQ",
    question: "What is LINQ and how does it compare to JavaScript array methods?",
    answer: "LINQ (Language Integrated Query) lets you query collections with SQL-like operations. .Where() = JS .filter(), .Select() = JS .map(), .FirstOrDefault() = JS .find(), .Any() = JS .some(), .All() = JS .every(), .OrderBy() = JS .sort(). LINQ uses deferred execution — queries don't run until you enumerate them.",
    example: `// JavaScript              →  C# LINQ
// arr.filter(x => x > 5)  →  list.Where(x => x > 5)
// arr.map(x => x * 2)     →  list.Select(x => x * 2)
// arr.find(x => x.id == 1)→  list.FirstOrDefault(x => x.Id == 1)
// arr.some(x => x > 10)   →  list.Any(x => x > 10)
// arr.every(x => x > 0)   →  list.All(x => x > 0)
// arr.reduce((a,b) => a+b)→  list.Sum() / list.Aggregate()

var result = employees
    .Where(emp => emp.Salary > 3000)
    .OrderByDescending(emp => emp.Salary)
    .Select(emp => new { emp.Name, emp.Salary })
    .Take(5)
    .ToList();`,
    readMore: `LINQ is one of C#'s killer features. If you know JS array methods, you already know 80% of LINQ.

Deferred execution is the key concept:
  var query = list.Where(x => x > 5);  // nothing happens yet!
  var results = query.ToList();          // NOW it executes

This means you can build up queries piece by piece and they only run once.
EF Core uses this to build SQL queries — each .Where(), .OrderBy() etc. adds to the SQL,
and it only hits the database when you call .ToList(), .First(), etc.

Methods that trigger execution: .ToList(), .ToArray(), .Count(), .First(), .Any()`
  },
];

export default csharpFlashcards;
