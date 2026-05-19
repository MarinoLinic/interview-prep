// Priority levels:
// "core"      — Your friend said these WILL be asked. Study these first.
// "important" — Very likely to come up, know these well.
// "extra"     — Good to know, but don't stress if short on time.
//
// Cards with linqAnswer/linqExample will show LINQ version when toggled.
// Cards without (pure theory like normalization) stay the same in both modes.
// Cards with readMore have expandable beginner-friendly explanations.
const flashcards = [
  // === JOINS (highest priority) ===
  {
    id: 1,
    priority: "core",
    category: "JOINs",
    question: "What does INNER JOIN do?",
    answer: "Returns only rows where a match exists in BOTH tables. If a customer has no orders, they're excluded. If an order has no matching customer, it's excluded.",
    example: `SELECT customers.name, orders.total
FROM customers
INNER JOIN orders
  ON customers.id = orders.customer_id;`,
    linqAnswer: "Use .Join() to match two collections on a key. Only items with matches in both collections are returned. In EF Core, navigation properties + .Include() often replace manual joins.",
    linqExample: `var result = customers.Join(
    orders,
    customer => customer.Id,
    order => order.CustomerId,
    (customer, order) => new {
        customer.Name,
        order.Total
    }
);`,
    readMore: `Think of INNER JOIN like a Venn diagram — you only get the overlap.

Imagine two lists:
• Customers: [Ana, Ivan, Petra]
• Orders: [Ana bought shoes, Ana bought a hat, Petra bought a bag]

INNER JOIN matches them on customer ID. Result:
• Ana — shoes
• Ana — hat  
• Petra — bag

Ivan has NO orders, so he's completely excluded from results. That's the key point: if there's no match on the other side, the row disappears.

When to use: When you ONLY want rows that have data in both tables.`,
  },
  {
    id: 2,
    priority: "core",
    category: "JOINs",
    question: "What does LEFT JOIN do?",
    answer: "Returns ALL rows from the left table, plus matching rows from the right table. If no match exists, right table columns are NULL. Most common JOIN in real work.",
    example: `SELECT customers.name, orders.total
FROM customers
LEFT JOIN orders
  ON customers.id = orders.customer_id;
-- Ivan appears with NULL total (no orders)`,
    linqAnswer: "Use .GroupJoin() + .SelectMany() with .DefaultIfEmpty(). This keeps all left items, filling nulls where no match exists.",
    linqExample: `var result = customers.GroupJoin(
    orders,
    customer => customer.Id,
    order => order.CustomerId,
    (customer, orderGroup) => new { customer, orderGroup }
).SelectMany(
    temp => temp.orderGroup.DefaultIfEmpty(),
    (temp, order) => new {
        temp.customer.Name,
        Total = order?.Total
    }
);`,
    readMore: `LEFT JOIN = "Give me everyone from the left table, even if they have nothing on the right side."

Example: You want a report of ALL customers and how much they spent. Some customers haven't placed any orders yet.

With INNER JOIN: those customers vanish from your report (bad!).
With LEFT JOIN: they appear with NULL values for the order columns.

Visual:
┌──────────┐     ┌──────────┐
│ customers│ ←── │  orders  │
│ ALL rows │     │ only if  │
│ included │     │ matches  │
└──────────┘     └──────────┘

Result:
• Ana — 150.00
• Ana — 200.00
• Ivan — NULL (no orders!)
• Petra — 999.00

The "left" table is the one listed FIRST (after FROM). The "right" table is the one after LEFT JOIN.`,
  },
  {
    id: 3,
    priority: "important",
    category: "JOINs",
    question: "What does RIGHT JOIN do?",
    answer: "Returns ALL rows from the right table, plus matching rows from the left table. If no match, left columns are NULL. Rarely used — you can flip tables and use LEFT JOIN instead.",
    example: `SELECT customers.name, orders.total
FROM customers
RIGHT JOIN orders
  ON customers.id = orders.customer_id;`,
    linqAnswer: "No direct .RightJoin() in LINQ. Just swap the collections and use the LEFT JOIN pattern (GroupJoin + DefaultIfEmpty), or start from the right table.",
    linqExample: `// Just flip — start from orders, join to customers
var result = orders.GroupJoin(
    customers,
    order => order.CustomerId,
    customer => customer.Id,
    (order, customerGroup) => new { order, customerGroup }
).SelectMany(
    temp => temp.customerGroup.DefaultIfEmpty(),
    (temp, customer) => new {
        Name = customer?.Name,
        temp.order.Total
    }
);`,
  },
  {
    id: 4,
    priority: "core",
    category: "JOINs",
    question: "What is the JOIN formula you should memorize?",
    answer: "SELECT [columns] FROM [table1] [JOIN_TYPE] JOIN [table2] ON [table1.pk] = [table2.fk];",
    example: `-- The pattern:
SELECT [what you want]
FROM [left table]
[INNER/LEFT/RIGHT] JOIN [right table]
  ON [left_table.column] = [right_table.column];

-- Real example:
SELECT customers.name, orders.total
FROM customers
LEFT JOIN orders
  ON customers.id = orders.customer_id;`,
    linqAnswer: "LINQ Join pattern: collection1.Join(collection2, outerKey, innerKey, resultSelector). For LEFT JOIN: .GroupJoin() + .SelectMany() + .DefaultIfEmpty().",
    linqExample: `// INNER JOIN formula:
source.Join(
    target,
    sourceItem => sourceItem.Key,
    targetItem => targetItem.ForeignKey,
    (sourceItem, targetItem) => new { /* result */ }
);

// LEFT JOIN formula:
source.GroupJoin(
    target,
    sourceItem => sourceItem.Key,
    targetItem => targetItem.ForeignKey,
    (sourceItem, group) => new { sourceItem, group }
).SelectMany(
    temp => temp.group.DefaultIfEmpty(),
    (temp, targetItem) => new { /* result */ }
);`,
    readMore: `The JOIN formula is like a recipe. Once you memorize it, you can write any JOIN:

Step 1: What do you want? → SELECT columns
Step 2: Starting from which table? → FROM table1  
Step 3: What kind of join? → INNER/LEFT/RIGHT JOIN table2
Step 4: How are they connected? → ON table1.column = table2.column

The ON clause is the "glue" — it tells the database which rows in table1 match which rows in table2. Usually it's a primary key = foreign key relationship.

Example with real tables:
• customers has "id" (primary key)
• orders has "customer_id" (foreign key → points to customers.id)
• So: ON customers.id = orders.customer_id`,
  },
  {
    id: 5,
    priority: "extra",
    category: "JOINs",
    question: "What is CROSS JOIN?",
    answer: "Combines every row from left table with every row from right table (Cartesian product). No ON clause needed. Result = left rows × right rows. Rarely useful.",
    example: `SELECT customers.name, products.name
FROM customers
CROSS JOIN products;
-- 6 customers × 5 products = 30 rows`,
    linqAnswer: "Use .SelectMany() without a join condition — every item paired with every other item.",
    linqExample: `var result = customers.SelectMany(
    customer => products,
    (customer, product) => new {
        CustomerName = customer.Name,
        ProductName = product.Name
    }
);
// 6 customers × 5 products = 30 results`,
  },
  {
    id: 6,
    priority: "important",
    category: "JOINs",
    question: "How do you combine JOINs with aggregate functions?",
    answer: "JOIN first to get combined data, then GROUP BY to aggregate. LEFT JOIN keeps all rows from left table even with no matches (count shows 0).",
    example: `SELECT
  customers.name,
  COUNT(orders.id) AS order_count,
  SUM(orders.total) AS total_spent
FROM customers
LEFT JOIN orders
  ON customers.id = orders.customer_id
GROUP BY customers.id;`,
    linqAnswer: "Use GroupJoin (which naturally groups) then project aggregates — Count() and Sum() on each group.",
    linqExample: `var result = customers.GroupJoin(
    orders,
    customer => customer.Id,
    order => order.CustomerId,
    (customer, orderGroup) => new {
        customer.Name,
        OrderCount = orderGroup.Count(),
        TotalSpent = orderGroup.Sum(order => order.Total)
    }
);`,
    readMore: `This is a common interview pattern: "Show me each customer's total spending."

Why LEFT JOIN? Because you want ALL customers, even those with $0 spent. INNER JOIN would hide them.

Why GROUP BY? Because after the JOIN, a customer with 3 orders appears 3 times. GROUP BY collapses those 3 rows into 1, letting you COUNT/SUM them.

Why COUNT(orders.id) not COUNT(*)? Because COUNT(*) counts ALL rows including NULLs. If a customer has 0 orders, COUNT(*) gives 1 (it counts the NULL row). COUNT(orders.id) gives 0 correctly because it skips NULLs.`,
  },

  // === WHERE clause ===
  {
    id: 7,
    priority: "core",
    category: "WHERE",
    question: "What does WHERE do and what operators can you use?",
    answer: "WHERE filters individual rows before any grouping. Operators: = , != , > , < , >= , <= , AND, OR, NOT, LIKE, BETWEEN, IN, IS NULL, IS NOT NULL.",
    example: `SELECT *
FROM orders
WHERE status = 'completed'
  AND total > 100;`,
    linqAnswer: ".Where() filters a collection with a lambda predicate. Use && for AND, || for OR, ! for NOT. Chain multiple .Where() calls or combine in one.",
    linqExample: `var result = orders
    .Where(order => order.Status == "completed"
                 && order.Total > 100)
    .ToList();

// Multiple conditions (chaining)
var result = customers
    .Where(customer => customer.City == "Zagreb"
                    || customer.City == "Split")
    .Where(customer => customer.Email != null)
    .ToList();`,
    readMore: `WHERE is your filter. It runs BEFORE any grouping happens.

Think of it like filtering a spreadsheet:
1. Database looks at every single row
2. For each row, checks: "Does this row pass the WHERE condition?"
3. If yes → keep it. If no → throw it away.

Common operators:
• =  means "equals" (not ==, that's C#!)
• != or <> means "not equals"
• AND means both conditions must be true
• OR means at least one condition must be true
• IN ('a','b','c') means "is one of these values"

Important: WHERE runs row-by-row. If you need to filter GROUPS (like "customers who spent more than $500 total"), use HAVING instead.`,
  },
  {
    id: 8,
    priority: "core",
    category: "WHERE",
    question: "What's the difference between WHERE and HAVING?",
    answer: "WHERE filters ROWS before grouping. HAVING filters GROUPS after grouping. You can't use HAVING without GROUP BY. You can use WHERE without GROUP BY.",
    example: `-- WHERE: filter rows first
-- HAVING: filter groups after
SELECT customer_id, SUM(total) AS total_spent
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING SUM(total) > 500;`,
    linqAnswer: "In LINQ: .Where() before .GroupBy() = SQL WHERE. .Where() after .GroupBy() = SQL HAVING. The position of the filter determines which it is.",
    linqExample: `var result = orders
    .Where(order => order.Status == "completed")  // WHERE (before grouping)
    .GroupBy(order => order.CustomerId)
    .Select(group => new {
        CustomerId = group.Key,
        TotalSpent = group.Sum(order => order.Total)
    })
    .Where(x => x.TotalSpent > 500);             // HAVING (after grouping)`,
    readMore: `This confuses a lot of beginners. Here's the simple rule:

WHERE = filters individual rows (BEFORE grouping)
HAVING = filters groups (AFTER grouping)

Example: "Show me customers who spent more than $500 on completed orders."

Step 1 (WHERE): Look at each order → keep only 'completed' ones
Step 2 (GROUP BY): Group the remaining orders by customer
Step 3 (HAVING): Look at each group → keep only groups where SUM > 500

You CANNOT write: WHERE SUM(total) > 500
Because WHERE runs before grouping — SUM doesn't exist yet!

Memory trick: WHERE = Where is this row? (looking at individual rows)
             HAVING = Having looked at the group totals...`,
  },
  {
    id: 9,
    priority: "important",
    category: "WHERE",
    question: "How does LIKE work for pattern matching?",
    answer: "LIKE uses % (any characters) and _ (exactly one character). Case insensitive in SQLite.",
    example: `-- Starts with M
SELECT * FROM customers
WHERE name LIKE 'M%';

-- Contains 'rin'
SELECT * FROM customers
WHERE name LIKE '%rin%';

-- Ends with @email.com
SELECT * FROM customers
WHERE email LIKE '%@email.com';`,
    linqAnswer: "Use .StartsWith(), .EndsWith(), .Contains() string methods inside .Where(). EF Core translates these to SQL LIKE automatically.",
    linqExample: `// Starts with M
customers.Where(customer => customer.Name.StartsWith("M"));

// Contains 'rin'
customers.Where(customer => customer.Name.Contains("rin"));

// Ends with @email.com
customers.Where(customer => customer.Email.EndsWith("@email.com"));`,
  },

  // === BETWEEN ===
  {
    id: 10,
    priority: "core",
    category: "BETWEEN",
    question: "What does BETWEEN do?",
    answer: "Filters values within a range, INCLUSIVE on both ends. Equivalent to >= AND <=. Works with numbers and text.",
    example: `SELECT * FROM orders
WHERE total BETWEEN 100 AND 500;
-- Same as: WHERE total >= 100 AND total <= 500`,
    linqAnswer: "No .Between() method in LINQ. Use >= and <= in the .Where() predicate — same logic, explicit operators.",
    linqExample: `// BETWEEN 100 AND 500
var result = orders
    .Where(order => order.Total >= 100
                 && order.Total <= 500);`,
    readMore: `BETWEEN is just a shortcut. These two are identical:

WHERE total BETWEEN 100 AND 500
WHERE total >= 100 AND total <= 500

Key point: INCLUSIVE on both ends. 100 and 500 ARE included.

Common mistake: forgetting it's inclusive. If someone asks "orders between 100 and 500", BETWEEN is exactly right because it includes both endpoints.`,
  },
  {
    id: 11,
    priority: "extra",
    category: "BETWEEN",
    question: "What does NOT BETWEEN do?",
    answer: "Returns rows OUTSIDE the specified range (exclusive of both endpoints).",
    example: `SELECT * FROM orders
WHERE total NOT BETWEEN 100 AND 500;
-- Returns orders with total < 100 OR total > 500`,
    linqAnswer: "Negate the range check: < lower OR > upper.",
    linqExample: `var result = orders
    .Where(order => order.Total < 100
                 || order.Total > 500);`,
  },

  // === Aliases ===
  {
    id: 12,
    priority: "core",
    category: "Aliases",
    question: "What are aliases (AS) used for?",
    answer: "AS renames columns or tables in output. Column aliases make results clearer. Table aliases shorten long table names in JOINs (e.g., 'customers' becomes 'c'). AS keyword is optional but recommended.",
    example: `-- Column alias: rename output columns
SELECT
  name AS customer_name,
  SUM(total) AS total_spent
FROM customers
INNER JOIN orders
  ON customers.id = orders.customer_id
GROUP BY customers.id;

-- Table alias: shorten table references
-- (useful when queries get long)
SELECT customers.name, orders.total
FROM customers
INNER JOIN orders
  ON customers.id = orders.customer_id;`,
    linqAnswer: "In LINQ, anonymous object property names act as aliases. Name them whatever you want in the new { } projection.",
    linqExample: `// Property names = column aliases
var result = customers.Select(customer => new {
    CustomerName = customer.Name,
    Location = customer.City
});

// In joins, the lambda parameter names serve
// the same purpose as SQL table aliases`,
    readMore: `Aliases are just nicknames.

Column aliases rename what appears in your results:
SELECT name AS customer_name → the column header shows "customer_name" instead of "name"

Table aliases shorten table names in your query:
FROM customers AS c → now you can write c.name instead of customers.name

Why use table aliases? When queries get long with multiple JOINs, writing "customers.name" everywhere is tedious. Aliasing to "c" saves space. But for learning, using full table names is clearer.

Note: AS is optional. "FROM customers c" and "FROM customers AS c" do the same thing.`,
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
    FOREIGN KEY (customer_id)
      REFERENCES customers(id)
);`,
    linqAnswer: "In EF Core, foreign keys are represented by a FK property (CustomerId) + a navigation property (Customer). EF Core enforces relationships and generates the FK constraint in migrations.",
    linqExample: `public class Order
{
    public int Id { get; set; }
    public decimal Total { get; set; }

    // Foreign key property
    public int CustomerId { get; set; }

    // Navigation property (the actual related object)
    public Customer Customer { get; set; }
}`,
    readMore: `A foreign key is like a pointer from one table to another.

Real-world analogy: An order form has a "Customer ID" field. That ID MUST match a real customer in the customers table. You can't write a random number there.

Why is this important?
WITHOUT foreign keys: You could insert an order with customer_id = 9999, even if no customer 9999 exists. Now you have a "ghost" order pointing to nobody.

WITH foreign keys: The database BLOCKS the insert and says "Error! Customer 9999 doesn't exist!" This protection is called referential integrity.

How it works:
• orders.customer_id → points to → customers.id
• The database checks: "Does this customer_id actually exist in customers?"
• If no → ERROR. If yes → INSERT succeeds.`,
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
    linqExample: `// This throws DbUpdateException
var order = new Order {
    CustomerId = 99,  // doesn't exist!
    Total = 500
};
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
-- Same student can take same course
-- in different semesters`,
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
    .HasKey(enrollment => new {
        enrollment.StudentId,
        enrollment.CourseId,
        enrollment.Semester
    });`,
    readMore: `Normal primary key: ONE column uniquely identifies each row (like "id").
Composite key: MULTIPLE columns together uniquely identify each row.

Real example: University enrollments.
• student_id alone isn't unique (a student takes many courses)
• course_id alone isn't unique (many students take each course)
• semester alone isn't unique (many enrollments per semester)

But (student_id + course_id + semester) TOGETHER is unique:
Student 1 can only be enrolled in Course 101 in Fall 2024 ONCE.

If you try to insert (1, 101, 'Fall2024') again → ERROR: duplicate key.
But (1, 101, 'Spring2025') is fine — different semester!

When to use: Many-to-many relationships, or when your data is naturally identified by a combination of fields rather than a single auto-generated ID.`,
  },
  {
    id: 16,
    priority: "core",
    category: "Composite Keys",
    question: "Interview answer: Explain composite keys.",
    answer: "\"A composite key is a primary key made of multiple columns. Used when no single column is unique by itself, but a combination is. For example, in an enrollments table, (student_id, course_id, semester) together uniquely identify a student's grade in a specific course during a semester.\"",
    example: `-- This FAILS — combination already exists:
INSERT INTO enrollments
VALUES (1, 101, 'Fall2024', 'B');
-- (1, 101, 'Fall2024') already exists
-- → UNIQUE constraint violated`,
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
-- 1        | Laptop, Mouse, Keyboard  ← list!

-- GOOD (1NF):
-- order_id | product
-- 1        | Laptop
-- 1        | Mouse
-- 1        | Keyboard`,
    readMore: `1NF is the simplest rule: ONE value per cell.

Bad example (spreadsheet thinking):
| student | courses              |
|---------|----------------------|
| Ana     | Math, English, Art   |  ← THREE values in one cell!

Why is this bad? You can't easily:
• Count how many courses Ana takes
• Find all students taking "Math"
• Delete just one course from the list

Good example (1NF):
| student | course  |
|---------|---------|
| Ana     | Math    |
| Ana     | English |
| Ana     | Art     |

Now each cell has exactly ONE value. You can filter, count, and query normally.

Memory trick: "1NF = 1 value per cell"`,
  },
  {
    id: 18,
    priority: "core",
    category: "Normalization",
    question: "What is 2NF (Second Normal Form)?",
    answer: "Must be in 1NF + no partial dependencies. If you have a composite key, ALL non-key columns must depend on the ENTIRE key, not just part of it.",
    example: `-- BAD (violates 2NF):
-- Composite key: (order_id, product_id)
-- product_name depends ONLY on product_id, not on order_id!

-- GOOD: Split into two tables
CREATE TABLE products (
    product_id INTEGER PRIMARY KEY,
    name TEXT,
    price DECIMAL
);
CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id)
);`,
    readMore: `2NF only matters when you have a COMPOSITE key (multiple columns as primary key).

The rule: Every non-key column must depend on ALL parts of the key, not just some.

Bad example:
Table: order_items (order_id, product_id, quantity, product_name, product_price)
Composite key: (order_id, product_id)

Problem: product_name and product_price depend ONLY on product_id. They don't care what order_id is. That's a "partial dependency."

Why is this bad? If "Laptop" costs $999, that fact is repeated in EVERY order that includes a laptop. Change the price → you have to update hundreds of rows.

Fix: Move product_name and product_price to their own "products" table.

Memory trick: "2NF = every non-key column needs the WHOLE key, not just part of it"
(Only relevant with composite keys!)`,
  },
  {
    id: 19,
    priority: "core",
    category: "Normalization",
    question: "What is 3NF (Third Normal Form)?",
    answer: "Must be in 2NF + no transitive dependencies. Non-key columns should depend ONLY on the primary key, not on other non-key columns.",
    example: `-- BAD (violates 3NF):
-- customers: id | name | city | country
-- country depends on city, NOT on customer id!

-- GOOD: Split out the dependency
CREATE TABLE cities (
    city_id INTEGER PRIMARY KEY,
    city TEXT,
    country TEXT
);
CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT,
    city_id INTEGER REFERENCES cities(city_id)
);`,
    readMore: `3NF says: non-key columns can't depend on OTHER non-key columns. They must depend directly on the primary key.

Bad example:
| customer_id | name  | city    | country |
|-------------|-------|---------|---------|
| 1           | Ana   | Zagreb  | Croatia |
| 2           | Ivan  | Zagreb  | Croatia |
| 3           | Petra | Split   | Croatia |

Problem: "country" depends on "city" (Zagreb → Croatia, Split → Croatia). It does NOT depend on customer_id directly. That's a "transitive dependency": customer_id → city → country.

Why is this bad? "Zagreb, Croatia" is stored in EVERY row for Zagreb customers. If Croatia changes its name, you update dozens of rows and might miss some.

Fix: Create a cities table with (city, country), then customers just references city_id.

Memory trick: "3NF = non-key columns depend on the key, the WHOLE key, and NOTHING BUT the key"`,
  },
  {
    id: 20,
    priority: "core",
    category: "Normalization",
    question: "Interview answer: Why is normalization important?",
    answer: "\"It prevents data inconsistency and redundancy. If you repeat data in multiple places, updating it becomes error-prone. With normalization, you update in one place and it reflects everywhere through foreign keys.\"",
    example: `-- Without normalization:
-- "Zagreb, Croatia" repeated in 100 rows
-- Change it once? You must update 100 rows!

-- With normalization:
-- "Zagreb, Croatia" stored ONCE in cities table
-- Change it once → all 100 customers see the update`,
    readMore: `Normalization summary for the interview:

The goal: Eliminate repeated data and prevent inconsistencies.

The three forms (progressive):
1NF: One value per cell (no lists)
2NF: No partial dependencies (with composite keys)
3NF: No transitive dependencies (non-key → non-key)

Real-world benefit: Imagine a company database with 10,000 employees in "Zagreb, Croatia". Without normalization, "Croatia" appears 10,000 times. One typo during an update → some say "Croatia", others say "Kroatia". That's data inconsistency.

With normalization: "Croatia" is stored once in a countries table. Impossible to have inconsistencies.

Trade-off: More tables = more JOINs needed to query. But that's a small price for data integrity.

Interview tip: Mention the words "data redundancy" and "update anomalies" — they show you understand WHY, not just WHAT.`,
  },

  // === GROUP BY & Aggregates ===
  {
    id: 21,
    priority: "important",
    category: "Aggregates",
    question: "What are the 5 aggregate functions?",
    answer: "COUNT(*) — how many rows. SUM(col) — add up values. AVG(col) — average. MIN(col) — smallest. MAX(col) — largest. They collapse many rows into one result (or one per group).",
    example: `SELECT COUNT(*) FROM orders;
SELECT SUM(total) FROM orders;
SELECT AVG(total) FROM orders;
SELECT MIN(total), MAX(total) FROM orders;`,
    linqAnswer: "LINQ has .Count(), .Sum(), .Average(), .Min(), .Max() — same 5 aggregate operations, called as extension methods on collections.",
    linqExample: `int count = orders.Count();
decimal sum = orders.Sum(order => order.Total);
decimal avg = orders.Average(order => order.Total);
decimal min = orders.Min(order => order.Total);
decimal max = orders.Max(order => order.Total);

// With filter
int completed = orders.Count(
    order => order.Status == "completed"
);`,
    readMore: `Aggregate functions take MANY rows and return ONE value.

Think of it like Excel formulas:
• COUNT = how many cells have data
• SUM = add up all the numbers
• AVG = average of all numbers
• MIN = the smallest number
• MAX = the largest number

Important distinction:
• COUNT(*) counts ALL rows (including NULLs)
• COUNT(column_name) counts only rows where that column is NOT NULL

With GROUP BY, aggregates run per-group:
"COUNT(*) GROUP BY city" → how many customers in EACH city`,
  },
  {
    id: 22,
    priority: "important",
    category: "Aggregates",
    question: "How does GROUP BY work?",
    answer: "GROUP BY splits rows into groups based on a column's values, then applies aggregate functions to each group separately.",
    example: `SELECT
  customer_id,
  COUNT(*) AS order_count,
  SUM(total) AS total_spent
FROM orders
GROUP BY customer_id;`,
    linqAnswer: ".GroupBy() groups a collection by a key. Each group has a .Key property and is itself a collection you can aggregate with .Count(), .Sum(), etc.",
    linqExample: `var result = orders
    .GroupBy(order => order.CustomerId)
    .Select(group => new {
        CustomerId = group.Key,
        OrderCount = group.Count(),
        TotalSpent = group.Sum(order => order.Total)
    })
    .ToList();`,
    readMore: `GROUP BY is like sorting papers into piles.

Imagine you have 7 order receipts scattered on a table. GROUP BY customer_id means:
1. Sort them into piles — one pile per customer
2. For each pile, calculate something (count, sum, average, etc.)

Before GROUP BY:
| customer_id | total |
|-------------|-------|
| 1           | 150   |
| 1           | 200   |
| 2           | 300   |
| 2           | 230   |
| 3           | 999   |

After GROUP BY customer_id:
| customer_id | order_count | total_spent |
|-------------|-------------|-------------|
| 1           | 2           | 350         |
| 2           | 2           | 530         |
| 3           | 1           | 999         |

Important rule: In SELECT, you can only include:
1. Columns that are in GROUP BY
2. Aggregate functions (COUNT, SUM, etc.)

You CANNOT do: SELECT name, COUNT(*) FROM orders GROUP BY customer_id
(Because which "name" would it show for a group of multiple orders?)`,
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
    linqAnswer: "In LINQ you chain methods in logical order: source → .Where() → .GroupBy() → .Select() → .Where() (HAVING) → .OrderBy() → .Take().",
    linqExample: `var result = orders
    .Where(order => order.Status == "completed")
    .GroupBy(order => order.CustomerId)
    .Select(group => new {
        CustomerId = group.Key,
        TotalSpent = group.Sum(order => order.Total)
    })
    .Where(x => x.TotalSpent > 500)
    .OrderByDescending(x => x.TotalSpent)
    .Take(5);`,
    readMore: `The clause order is mandatory in SQL. You'll get a syntax error if you put them in the wrong order.

Memory trick — "S-F-W-G-H-O-L" or the sentence:
"Sweaty Feet Will Give Horrible Odors, Lol"

S - SELECT (what columns?)
F - FROM (which table?)
W - WHERE (filter rows)
G - GROUP BY (group rows)
H - HAVING (filter groups)
O - ORDER BY (sort results)
L - LIMIT (cap results)

Execution order is different! The database actually processes it:
FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT

This is why you can't use a column alias in WHERE (it hasn't been created yet in SELECT).`,
  },

  // === ORDER BY, DISTINCT, LIMIT ===
  {
    id: 24,
    priority: "extra",
    category: "Sorting & Limiting",
    question: "How do ORDER BY, DISTINCT, and LIMIT work?",
    answer: "ORDER BY sorts results (ASC default, DESC for reverse). DISTINCT removes duplicate rows. LIMIT restricts number of rows returned. OFFSET skips rows (for pagination).",
    example: `-- Unique cities only
SELECT DISTINCT city FROM customers;

-- Top 3 orders by total
SELECT * FROM orders
ORDER BY total DESC
LIMIT 3;

-- Page 2 (skip first 10, show next 10)
SELECT * FROM orders
ORDER BY total DESC
LIMIT 10 OFFSET 10;`,
    linqAnswer: ".OrderBy() / .OrderByDescending() for sorting. .Distinct() for unique values. .Take(n) for LIMIT. .Skip(n) for OFFSET.",
    linqExample: `// DISTINCT
var cities = customers
    .Select(customer => customer.City)
    .Distinct();

// ORDER BY DESC + LIMIT 3
var top3 = orders
    .OrderByDescending(order => order.Total)
    .Take(3);

// Pagination: page 2
var page2 = orders
    .OrderByDescending(order => order.Total)
    .Skip(10)
    .Take(10);`,
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
    public int Id { get; set; }         // PK + auto-increment
    [Required]
    public string Name { get; set; }    // NOT NULL
    public string? Email { get; set; }  // nullable
    public string? City { get; set; }   // nullable
}`,
  },

  // === INSERT ===
  {
    id: 26,
    priority: "extra",
    category: "DML",
    question: "How does INSERT INTO work?",
    answer: "INSERT INTO table (columns) VALUES (values). Column order in statement must match VALUES order. You can skip optional columns (they'll be NULL). You can insert multiple rows with commas.",
    example: `INSERT INTO customers (name, email, city)
VALUES
  ('Marino', 'marino@email.com', 'Zagreb'),
  ('Ana', 'ana@email.com', 'Split'),
  ('Ivan', 'ivan@email.com', 'Zagreb');`,
    linqAnswer: "In EF Core: create object, .Add() to DbSet, .SaveChangesAsync(). Id is auto-assigned.",
    linqExample: `var customer = new Customer {
    Name = "Marino",
    Email = "marino@email.com",
    City = "Zagreb"
};
_context.Customers.Add(customer);
await _context.SaveChangesAsync();
// customer.Id is now auto-assigned`,
  },

  // === Subqueries ===
  {
    id: 27,
    priority: "extra",
    category: "Subqueries",
    question: "What is a subquery?",
    answer: "A query inside another query, enclosed in parentheses. Can be used in WHERE (filtering), FROM (as a derived table), or SELECT (scalar subquery).",
    example: `-- Customers who have at least one order
SELECT name
FROM customers
WHERE id IN (
    SELECT DISTINCT customer_id
    FROM orders
);

-- Orders above average total
SELECT *
FROM orders
WHERE total > (SELECT AVG(total) FROM orders);`,
    linqAnswer: "In LINQ, subqueries are just nested expressions or variables. Use .Any()/.Contains() for IN/EXISTS, or compute a value and use it in .Where().",
    linqExample: `// IN subquery → .Contains()
var customerIds = orders
    .Select(order => order.CustomerId)
    .Distinct();
var result = customers
    .Where(customer => customerIds.Contains(customer.Id));

// Subquery for comparison
var avgTotal = orders.Average(order => order.Total);
var aboveAvg = orders
    .Where(order => order.Total > avgTotal);`,
  },

  // === NULL handling ===
  {
    id: 28,
    priority: "important",
    category: "WHERE",
    question: "How do you check for NULL values?",
    answer: "NEVER use = NULL. Always use IS NULL or IS NOT NULL. NULL means 'unknown/missing' — it's not equal to anything, not even itself.",
    example: `-- Correct:
SELECT * FROM customers
WHERE email IS NULL;

SELECT * FROM customers
WHERE email IS NOT NULL;

-- WRONG (always returns 0 rows!):
-- SELECT * FROM customers WHERE email = NULL;`,
    linqAnswer: "In C#, just use == null or != null. C# handles null comparison correctly (unlike SQL where = NULL fails).",
    linqExample: `// IS NULL
var noEmail = customers
    .Where(customer => customer.Email == null);

// IS NOT NULL
var hasEmail = customers
    .Where(customer => customer.Email != null);`,
    readMore: `NULL is one of SQL's biggest "gotchas."

NULL doesn't mean "" (empty string) or 0. It means "unknown" or "no data."

The problem: In SQL, NULL is not equal to ANYTHING — not even itself!
• NULL = NULL → this is FALSE (or actually "unknown")
• NULL != NULL → this is also FALSE

That's why = NULL never works. You MUST use IS NULL.

Think of it this way: If I ask "Is the color of an invisible thing equal to the color of another invisible thing?" — the answer isn't yes or no, it's "I don't know."

Common interview question: "What's wrong with WHERE email = NULL?"
Answer: "Nothing matches because NULL can't be compared with =. You must use IS NULL."`,
  },
];

export default flashcards;
