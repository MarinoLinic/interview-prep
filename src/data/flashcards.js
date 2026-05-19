// Priority levels:
// "core"      — Your friend said these WILL be asked. Study these first.
// "important" — Very likely to come up, know these well.
// "extra"     — Good to know, but don't stress if short on time.
//
// Cards with linqAnswer/linqExample will show LINQ version when toggled.
// Cards without (pure theory like normalization) stay the same in both modes.
const flashcards = [
  // === JOINS (highest priority) ===
  {
    id: 1,
    priority: "core",
    category: "JOINs",
    question: "What does INNER JOIN do?",
    answer: "Returns only rows where a match exists in BOTH tables. If a customer has no orders, they're excluded. If an order has no matching customer, it's excluded.",
    example: `SELECT c.name, o.total
FROM customers c
INNER JOIN orders o ON c.id = o.customer_id;`,
    linqAnswer: "Use .Join() to match two collections on a key. Only items with matches in both collections are returned. In EF Core, navigation properties + .Include() often replace manual joins.",
    linqExample: `// Method syntax — explicit Join
var result = customers.Join(
    orders,
    c => c.Id,            // outer key
    o => o.CustomerId,    // inner key
    (c, o) => new { c.Name, o.Total }  // result selector
);

// EF Core with navigation properties (preferred)
var result = _context.Orders
    .Include(o => o.Customer)
    .Select(o => new { o.Customer.Name, o.Total });`,
  },
  {
    id: 2,
    priority: "core",
    category: "JOINs",
    question: "What does LEFT JOIN do?",
    answer: "Returns ALL rows from the left table, plus matching rows from the right table. If no match exists, right table columns are NULL. Most common JOIN in real work.",
    example: `SELECT c.name, o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;
-- Ivan appears with NULL total (no orders)`,
    linqAnswer: "Use .GroupJoin() + .SelectMany() with .DefaultIfEmpty(). This keeps all left items, filling nulls where no match exists. EF Core handles this with navigation properties.",
    linqExample: `// LINQ left join pattern
var result = customers.GroupJoin(
    orders,
    c => c.Id,
    o => o.CustomerId,
    (c, orderGroup) => new { c, orderGroup }
).SelectMany(
    x => x.orderGroup.DefaultIfEmpty(),
    (x, o) => new { x.c.Name, Total = o?.Total }
);

// EF Core (simpler — navigation properties)
var result = _context.Customers
    .Select(c => new { c.Name, Total = c.Orders.Sum(o => o.Total) });`,
  },
  {
    id: 3,
    priority: "important",
    category: "JOINs",
    question: "What does RIGHT JOIN do?",
    answer: "Returns ALL rows from the right table, plus matching rows from the left table. If no match, left columns are NULL. Rarely used — you can flip tables and use LEFT JOIN instead.",
    example: `SELECT c.name, o.total
FROM customers c
RIGHT JOIN orders o ON c.id = o.customer_id;`,
    linqAnswer: "No direct .RightJoin() in LINQ. Just swap the collections and use the LEFT JOIN pattern (GroupJoin + DefaultIfEmpty), or start from the right table.",
    linqExample: `// Just flip — start from orders, join to customers
var result = orders.GroupJoin(
    customers,
    o => o.CustomerId,
    c => c.Id,
    (o, custGroup) => new { o, custGroup }
).SelectMany(
    x => x.custGroup.DefaultIfEmpty(),
    (x, c) => new { Name = c?.Name, x.o.Total }
);`,
  },
  {
    id: 4,
    priority: "core",
    category: "JOINs",
    question: "What is the JOIN formula you should memorize?",
    answer: "SELECT [columns] FROM [table1] [JOIN_TYPE] JOIN [table2] ON [table1.pk] = [table2.fk];",
    example: `SELECT c.name, o.total
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id;`,
    linqAnswer: "LINQ Join pattern: collection1.Join(collection2, outerKey, innerKey, resultSelector). For LEFT JOIN: .GroupJoin() + .SelectMany() + .DefaultIfEmpty().",
    linqExample: `// INNER JOIN formula
collection1.Join(collection2,
    item1 => item1.Key,       // outer key selector
    item2 => item2.ForeignKey, // inner key selector
    (item1, item2) => new { } // result selector
);

// LEFT JOIN formula
collection1.GroupJoin(collection2,
    item1 => item1.Key, item2 => item2.ForeignKey,
    (item1, group) => new { item1, group }
).SelectMany(x => x.group.DefaultIfEmpty(),
    (x, item2) => new { });`,
  },
  {
    id: 5,
    priority: "extra",
    category: "JOINs",
    question: "What is CROSS JOIN?",
    answer: "Combines every row from left table with every row from right table (Cartesian product). No ON clause needed. Result = left rows × right rows. Rarely useful.",
    example: `SELECT c.name, o.total
FROM customers c
CROSS JOIN orders o;
-- 4 customers × 5 orders = 20 rows`,
    linqAnswer: "Use .SelectMany() without a join condition — every item paired with every other item.",
    linqExample: `var result = customers.SelectMany(
    c => orders,
    (c, o) => new { c.Name, o.Total }
);
// 4 customers × 5 orders = 20 results`,
  },
  {
    id: 6,
    priority: "important",
    category: "JOINs",
    question: "How do you combine JOINs with aggregate functions?",
    answer: "JOIN first to get combined data, then GROUP BY to aggregate. LEFT JOIN keeps all rows from left table even with no matches (count shows 0).",
    example: `SELECT c.name, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id;`,
    linqAnswer: "Use navigation properties with .Select() projecting aggregates, or GroupJoin + aggregate methods.",
    linqExample: `// EF Core with navigation properties
var result = _context.Customers.Select(c => new {
    c.Name,
    OrderCount = c.Orders.Count(),
    TotalSpent = c.Orders.Sum(o => o.Total)
});

// Pure LINQ
var result = customers.GroupJoin(orders,
    c => c.Id, o => o.CustomerId,
    (c, ords) => new {
        c.Name,
        OrderCount = ords.Count(),
        TotalSpent = ords.Sum(o => o.Total)
    });`,
  },

  // === WHERE clause ===
  {
    id: 7,
    priority: "core",
    category: "WHERE",
    question: "What does WHERE do and what operators can you use?",
    answer: "WHERE filters individual rows before any grouping. Operators: = , != , > , < , >= , <= , AND, OR, NOT, LIKE, BETWEEN, IN, IS NULL, IS NOT NULL.",
    example: `SELECT * FROM orders
WHERE status = 'completed' AND total > 100;`,
    linqAnswer: ".Where() filters a collection with a lambda predicate. Use && for AND, || for OR, ! for NOT. Chain multiple .Where() calls or combine in one.",
    linqExample: `var result = orders
    .Where(o => o.Status == "completed" && o.Total > 100)
    .ToList();

// Multiple conditions
var result = customers
    .Where(c => c.City == "Zagreb" || c.City == "Split")
    .Where(c => c.Email != null)
    .ToList();`,
  },
  {
    id: 8,
    priority: "core",
    category: "WHERE",
    question: "What's the difference between WHERE and HAVING?",
    answer: "WHERE filters ROWS before grouping. HAVING filters GROUPS after grouping. You can't use HAVING without GROUP BY. You can use WHERE without GROUP BY.",
    example: `-- WHERE: filter rows first, then group
SELECT customer_id, SUM(total) FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING SUM(total) > 500;`,
    linqAnswer: "In LINQ: .Where() before .GroupBy() = SQL WHERE. .Where() after .GroupBy() = SQL HAVING. The position of the filter determines which it is.",
    linqExample: `var result = orders
    .Where(o => o.Status == "completed")   // WHERE (before grouping)
    .GroupBy(o => o.CustomerId)
    .Select(g => new {
        CustomerId = g.Key,
        TotalSpent = g.Sum(o => o.Total)
    })
    .Where(x => x.TotalSpent > 500);      // HAVING (after grouping)`,
  },
  {
    id: 9,
    priority: "important",
    category: "WHERE",
    question: "How does LIKE work for pattern matching?",
    answer: "LIKE uses % (any characters) and _ (exactly one character). Case insensitive in SQLite.",
    example: `SELECT * FROM customers WHERE name LIKE 'M%';    -- starts with M
SELECT * FROM customers WHERE name LIKE '%rin%'; -- contains 'rin'
SELECT * FROM customers WHERE email LIKE '%@email.com';`,
    linqAnswer: "Use .StartsWith(), .EndsWith(), .Contains() string methods inside .Where(). EF Core translates these to SQL LIKE automatically.",
    linqExample: `// starts with M
customers.Where(c => c.Name.StartsWith("M"));

// contains 'rin'
customers.Where(c => c.Name.Contains("rin"));

// ends with @email.com
customers.Where(c => c.Email.EndsWith("@email.com"));

// EF Core: .Contains() → LIKE '%rin%'`,
  },

  // === BETWEEN ===
  {
    id: 10,
    priority: "core",
    category: "BETWEEN",
    question: "What does BETWEEN do?",
    answer: "Filters values within a range, INCLUSIVE on both ends. Equivalent to >= AND <=. Works with numbers and text.",
    example: `SELECT * FROM orders WHERE total BETWEEN 100 AND 500;
-- Same as: WHERE total >= 100 AND total <= 500

SELECT * FROM customers WHERE name BETWEEN 'A' AND 'M';`,
    linqAnswer: "No .Between() method in LINQ. Use >= and <= in the .Where() predicate — same logic, explicit operators.",
    linqExample: `// BETWEEN 100 AND 500
var result = orders
    .Where(o => o.Total >= 100 && o.Total <= 500);

// Text range
var result = customers
    .Where(c => string.Compare(c.Name, "A") >= 0
             && string.Compare(c.Name, "M") <= 0);`,
  },
  {
    id: 11,
    priority: "extra",
    category: "BETWEEN",
    question: "What does NOT BETWEEN do?",
    answer: "Returns rows OUTSIDE the specified range (exclusive of both endpoints).",
    example: `SELECT * FROM orders WHERE total NOT BETWEEN 100 AND 500;
-- Returns orders with total < 100 OR total > 500`,
    linqAnswer: "Negate the range check: < lower OR > upper.",
    linqExample: `var result = orders
    .Where(o => o.Total < 100 || o.Total > 500);`,
  },

  // === Aliases ===
  {
    id: 12,
    priority: "core",
    category: "Aliases",
    question: "What are aliases (AS) used for?",
    answer: "AS renames columns or tables in output. Column aliases make results clearer. Table aliases shorten table names in JOINs. AS keyword is optional but recommended.",
    example: `-- Column alias
SELECT name AS customer_name, SUM(total) AS total_spent
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
GROUP BY c.id;

-- Table alias (shortens query)
SELECT c.name, o.total FROM customers AS c
LEFT JOIN orders AS o ON c.id = o.customer_id;`,
    linqAnswer: "In LINQ, anonymous object property names act as aliases. Name them whatever you want in the new { } projection. Lambda parameter names (c, o) are like table aliases.",
    linqExample: `// Property names = column aliases
var result = customers.Select(c => new {
    CustomerName = c.Name,     // AS customer_name
    TotalSpent = c.Orders.Sum(o => o.Total)  // AS total_spent
});

// Lambda params = table aliases
// 'c' for customer, 'o' for order — same as SQL aliases
orders.Where(o => o.Total > 100)
      .Select(o => new { o.CustomerId, o.Total });`,
  },

  // === Foreign Keys ===
  {
    id: 13,
    priority: "core",
    category: "Foreign Keys",
    question: "What is a FOREIGN KEY?",
    answer: "A constraint that links a column in one table to the PRIMARY KEY of another table. Enforces referential integrity — you can't create an order for a customer that doesn't exist. Prevents orphaned data.",
    example: `CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total DECIMAL(10,2),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);`,
    linqAnswer: "In EF Core, foreign keys are represented by a FK property (CustomerId) + a navigation property (Customer). EF Core enforces relationships and generates the FK constraint in migrations.",
    linqExample: `public class Order
{
    public int Id { get; set; }
    public decimal Total { get; set; }
    public int CustomerId { get; set; }        // FK property
    public Customer Customer { get; set; }      // Navigation property
}

// EF Core Fluent API (in OnModelCreating)
modelBuilder.Entity<Order>()
    .HasOne(o => o.Customer)
    .WithMany(c => c.Orders)
    .HasForeignKey(o => o.CustomerId);`,
  },
  {
    id: 14,
    priority: "important",
    category: "Foreign Keys",
    question: "What is referential integrity?",
    answer: "The database enforces that foreign key values must reference an existing primary key. INSERT fails if the referenced row doesn't exist. The database protects itself — not just your code.",
    example: `-- This FAILS if customer 99 doesn't exist:
INSERT INTO orders (customer_id, total, status)
VALUES (99, 500.00, 'completed');
-- Error: FOREIGN KEY constraint failed`,
    linqAnswer: "EF Core throws a DbUpdateException if you try to save an entity with a FK pointing to a non-existent record. The database still enforces this at the DB level too.",
    linqExample: `// This throws DbUpdateException — customer 99 doesn't exist
var order = new Order { CustomerId = 99, Total = 500 };
_context.Orders.Add(order);
await _context.SaveChangesAsync(); // EXCEPTION!`,
  },

  // === Composite Keys ===
  {
    id: 15,
    priority: "core",
    category: "Composite Keys",
    question: "What is a composite key?",
    answer: "A primary key made of MULTIPLE columns together. Used when no single column is unique by itself, but a combination of columns is. No AUTOINCREMENT — you provide the values.",
    example: `CREATE TABLE enrollments (
    student_id INTEGER,
    course_id INTEGER,
    semester TEXT,
    grade TEXT,
    PRIMARY KEY (student_id, course_id, semester)
);
-- Same student can take same course in different semesters`,
    linqAnswer: "In EF Core, configure composite keys with .HasKey() in Fluent API using an anonymous object. Can't use [Key] attribute for composite keys.",
    linqExample: `public class Enrollment
{
    public int StudentId { get; set; }
    public int CourseId { get; set; }
    public string Semester { get; set; }
    public string Grade { get; set; }
}

// In DbContext OnModelCreating:
modelBuilder.Entity<Enrollment>()
    .HasKey(e => new { e.StudentId, e.CourseId, e.Semester });`,
  },
  {
    id: 16,
    priority: "core",
    category: "Composite Keys",
    question: "Interview answer: Explain composite keys.",
    answer: "\"A composite key is a primary key made of multiple columns. Used when no single column is unique by itself, but a combination is. For example, in an enrollments table, (student_id, course_id, semester) together uniquely identify a student's grade in a specific course during a semester.\"",
    example: `-- This FAILS — combination already exists:
INSERT INTO enrollments VALUES (1, 101, 'Fall2024', 'B');
-- (1, 101, 'Fall2024') already exists → UNIQUE constraint violated`,
  },

  // === Normalization (theory — no LINQ equivalent) ===
  {
    id: 17,
    priority: "core",
    category: "Normalization",
    question: "What is 1NF (First Normal Form)?",
    answer: "Each cell contains only ONE value (atomic values). No lists or multiple values in a single cell.",
    example: `-- BAD (violates 1NF):
-- order_id | products
-- 1        | Laptop, Mouse, Keyboard  ← multiple values!

-- GOOD (1NF):
-- order_id | product
-- 1        | Laptop
-- 1        | Mouse
-- 1        | Keyboard`,
  },
  {
    id: 18,
    priority: "core",
    category: "Normalization",
    question: "What is 2NF (Second Normal Form)?",
    answer: "No partial dependencies. If you have a composite key, ALL non-key columns must depend on the ENTIRE key, not just part of it. Split into separate tables.",
    example: `-- BAD: product_price depends only on product, not entire key (order_id, item_number)
-- GOOD: Split into products table and order_items table
CREATE TABLE products (product_id INTEGER PRIMARY KEY, name TEXT, price DECIMAL);
CREATE TABLE order_items (order_id INT, item_number INT, product_id INT, quantity INT,
    PRIMARY KEY (order_id, item_number),
    FOREIGN KEY (product_id) REFERENCES products(product_id));`,
  },
  {
    id: 19,
    priority: "core",
    category: "Normalization",
    question: "What is 3NF (Third Normal Form)?",
    answer: "No non-key dependencies. Non-key columns should depend ONLY on the primary key, not on other non-key columns. Example: 'country' depends on 'city', not on customer_id → split into cities table.",
    example: `-- BAD: country depends on city (non-key → non-key)
-- customers: id | name | city | country

-- GOOD: Split into two tables
CREATE TABLE cities (city_id INTEGER PRIMARY KEY, city TEXT, country TEXT);
CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT,
    city_id INTEGER, FOREIGN KEY (city_id) REFERENCES cities(city_id));`,
  },
  {
    id: 20,
    priority: "core",
    category: "Normalization",
    question: "Interview answer: Why is normalization important?",
    answer: "\"It prevents data inconsistency and redundancy. If you repeat data in multiple places, updating it becomes error-prone. With normalization, you update in one place and it reflects everywhere through foreign keys.\"",
    example: `-- Without normalization: "Zagreb, Croatia" repeated in 100 customer rows
-- With normalization: "Zagreb, Croatia" stored ONCE in cities table
-- Change it once → all 100 customers reflect the change`,
  },

  // === GROUP BY & Aggregates ===
  {
    id: 21,
    priority: "important",
    category: "Aggregates",
    question: "What are the 5 aggregate functions?",
    answer: "COUNT(*) — how many rows. SUM(col) — add up values. AVG(col) — average. MIN(col) — smallest. MAX(col) — largest. They collapse many rows into one result (or one per group).",
    example: `SELECT COUNT(*) FROM orders;           -- 5
SELECT SUM(total) FROM orders;          -- 1879
SELECT AVG(total) FROM orders;          -- 375.8
SELECT MIN(total), MAX(total) FROM orders; -- 80, 999`,
    linqAnswer: "LINQ has .Count(), .Sum(), .Average(), .Min(), .Max() — same 5 aggregate operations, called as extension methods on collections.",
    linqExample: `int count = orders.Count();                   // 5
decimal sum = orders.Sum(o => o.Total);        // 1879
decimal avg = orders.Average(o => o.Total);    // 375.8
decimal min = orders.Min(o => o.Total);        // 80
decimal max = orders.Max(o => o.Total);        // 999

// With filter (like COUNT with WHERE)
int completed = orders.Count(o => o.Status == "completed"); // 4`,
  },
  {
    id: 22,
    priority: "important",
    category: "Aggregates",
    question: "How does GROUP BY work?",
    answer: "GROUP BY splits rows into groups based on a column's values, then applies aggregate functions to each group separately.",
    example: `SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent
FROM orders
GROUP BY customer_id;
-- customer 1: 2 orders, 350 total
-- customer 2: 2 orders, 530 total
-- customer 3: 1 order, 999 total`,
    linqAnswer: ".GroupBy() groups a collection by a key. Each group has a .Key property and is itself a collection you can aggregate with .Count(), .Sum(), etc.",
    linqExample: `var result = orders
    .GroupBy(o => o.CustomerId)
    .Select(g => new {
        CustomerId = g.Key,
        OrderCount = g.Count(),
        TotalSpent = g.Sum(o => o.Total)
    })
    .ToList();
// { CustomerId: 1, OrderCount: 2, TotalSpent: 350 }
// { CustomerId: 2, OrderCount: 2, TotalSpent: 530 }
// { CustomerId: 3, OrderCount: 1, TotalSpent: 999 }`,
  },
  {
    id: 23,
    priority: "important",
    category: "Aggregates",
    question: "What is the correct SQL clause order?",
    answer: "SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT. This order is mandatory.",
    example: `SELECT customer_id, SUM(total) AS total_spent
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING SUM(total) > 500
ORDER BY total_spent DESC
LIMIT 5;`,
    linqAnswer: "In LINQ you chain methods in logical order: source → .Where() → .GroupBy() → .Select() → .Where() (HAVING) → .OrderBy() → .Take(). Order is flexible but this mirrors SQL logic.",
    linqExample: `var result = orders                              // FROM orders
    .Where(o => o.Status == "completed")          // WHERE
    .GroupBy(o => o.CustomerId)                    // GROUP BY
    .Select(g => new {                            // SELECT
        CustomerId = g.Key,
        TotalSpent = g.Sum(o => o.Total)
    })
    .Where(x => x.TotalSpent > 500)              // HAVING
    .OrderByDescending(x => x.TotalSpent)        // ORDER BY DESC
    .Take(5);                                     // LIMIT 5`,
  },

  // === ORDER BY, DISTINCT, LIMIT ===
  {
    id: 24,
    priority: "extra",
    category: "Sorting & Limiting",
    question: "How do ORDER BY, DISTINCT, and LIMIT work?",
    answer: "ORDER BY sorts results (ASC default, DESC for reverse). DISTINCT removes duplicate rows. LIMIT restricts number of rows returned. OFFSET skips rows (for pagination).",
    example: `SELECT DISTINCT city FROM customers;  -- unique cities only
SELECT * FROM orders ORDER BY total DESC LIMIT 3;  -- top 3 orders
SELECT * FROM orders ORDER BY total DESC LIMIT 10 OFFSET 10; -- page 2`,
    linqAnswer: ".OrderBy() / .OrderByDescending() for sorting. .Distinct() for unique values. .Take(n) for LIMIT. .Skip(n) for OFFSET.",
    linqExample: `// DISTINCT
var cities = customers.Select(c => c.City).Distinct();

// ORDER BY DESC + LIMIT 3
var top3 = orders.OrderByDescending(o => o.Total).Take(3);

// Pagination: page 2 (skip 10, take 10)
var page2 = orders.OrderByDescending(o => o.Total)
    .Skip(10).Take(10);`,
  },

  // === CREATE TABLE & PRIMARY KEY ===
  {
    id: 25,
    priority: "important",
    category: "DDL",
    question: "What is PRIMARY KEY and AUTOINCREMENT?",
    answer: "PRIMARY KEY uniquely identifies each row — no duplicates allowed. AUTOINCREMENT means the database auto-assigns the next number (1, 2, 3...). You don't provide the id value on INSERT.",
    example: `CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    city TEXT
);
-- NOT NULL = mandatory field, can't be blank`,
    linqAnswer: "In EF Core, a property named 'Id' or '[ClassName]Id' is automatically the PK. The DB auto-generates it. Use [Required] or .IsRequired() for NOT NULL.",
    linqExample: `public class Customer
{
    public int Id { get; set; }             // PK, auto-increment by convention
    [Required]
    public string Name { get; set; }        // NOT NULL
    public string? Email { get; set; }      // nullable
    public string? City { get; set; }       // nullable
}`,
  },

  // === INSERT ===
  {
    id: 26,
    priority: "extra",
    category: "DML",
    question: "How does INSERT INTO work?",
    answer: "INSERT INTO table (columns) VALUES (values). Column order in statement must match VALUES order. You can skip optional columns (they'll be NULL). You can insert multiple rows with commas.",
    example: `INSERT INTO customers (name, email, city) VALUES
('Marino', 'marino@email.com', 'Zagreb'),
('Ana', 'ana@email.com', 'Split'),
('Ivan', 'ivan@email.com', 'Zagreb');`,
    linqAnswer: "In EF Core: create object, .Add() to DbSet, .SaveChangesAsync(). Id is auto-assigned. Skip properties → they default to null.",
    linqExample: `var customer = new Customer {
    Name = "Marino",
    Email = "marino@email.com",
    City = "Zagreb"
};
_context.Customers.Add(customer);
await _context.SaveChangesAsync();
// customer.Id is now auto-assigned (e.g., 1)

// Add multiple
_context.Customers.AddRange(customer1, customer2, customer3);
await _context.SaveChangesAsync();`,
  },

  // === Subqueries ===
  {
    id: 27,
    priority: "extra",
    category: "Subqueries",
    question: "What is a subquery?",
    answer: "A query inside another query, enclosed in parentheses. Can be used in WHERE (filtering), FROM (as a derived table), or SELECT (scalar subquery).",
    example: `-- Find customers who have placed at least one order
SELECT name FROM customers
WHERE id IN (SELECT DISTINCT customer_id FROM orders);

-- Find orders above average total
SELECT * FROM orders
WHERE total > (SELECT AVG(total) FROM orders);`,
    linqAnswer: "In LINQ, subqueries are just nested expressions or variables. Use .Any()/.Contains() for IN/EXISTS, or compute a value and use it in .Where().",
    linqExample: `// IN subquery → .Contains() or .Any()
var customerIds = orders.Select(o => o.CustomerId).Distinct();
var result = customers.Where(c => customerIds.Contains(c.Id));

// Or with .Any() (like EXISTS — often faster)
var result = customers
    .Where(c => orders.Any(o => o.CustomerId == c.Id));

// Subquery for comparison
var avgTotal = orders.Average(o => o.Total);
var aboveAvg = orders.Where(o => o.Total > avgTotal);`,
  },

  // === NULL handling ===
  {
    id: 28,
    priority: "important",
    category: "WHERE",
    question: "How do you check for NULL values?",
    answer: "NEVER use = NULL. Always use IS NULL or IS NOT NULL. NULL means 'unknown/missing' — it's not equal to anything, not even itself.",
    example: `SELECT * FROM customers WHERE phone IS NULL;
SELECT * FROM customers WHERE phone IS NOT NULL;
-- WRONG: WHERE phone = NULL  ← always returns no rows!`,
    linqAnswer: "In C#, just use == null or != null. C# handles null comparison correctly (unlike SQL where = NULL fails).",
    linqExample: `// IS NULL
var noPhone = customers.Where(c => c.Phone == null);

// IS NOT NULL
var hasPhone = customers.Where(c => c.Phone != null);

// C# handles this correctly — no weird SQL gotchas here`,
  },
];

export default flashcards;
