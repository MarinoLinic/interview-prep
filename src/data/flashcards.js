// Priority levels:
// "core"      — Your friend said these WILL be asked. Study these first.
// "important" — Very likely to come up, know these well.
// "extra"     — Good to know, but don't stress if short on time.
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
  },
  {
    id: 11,
    priority: "extra",
    category: "BETWEEN",
    question: "What does NOT BETWEEN do?",
    answer: "Returns rows OUTSIDE the specified range (exclusive of both endpoints).",
    example: `SELECT * FROM orders WHERE total NOT BETWEEN 100 AND 500;
-- Returns orders with total < 100 OR total > 500`,
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

  // === Normalization ===
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
  },
];

export default flashcards;
