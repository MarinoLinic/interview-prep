// SQL to set up the practice database (runs once on load)
export const setupSQL = `
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    city TEXT
);

CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    total DECIMAL(10,2),
    status TEXT,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    price DECIMAL(10,2),
    category TEXT
);

CREATE TABLE order_items (
    order_id INTEGER,
    product_id INTEGER,
    quantity INTEGER,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE enrollments (
    student_id INTEGER,
    course_id INTEGER,
    semester TEXT,
    grade TEXT,
    PRIMARY KEY (student_id, course_id, semester)
);

INSERT INTO customers (name, email, city) VALUES
('Marino', 'marino@email.com', 'Zagreb'),
('Ana', 'ana@email.com', 'Split'),
('Ivan', 'ivan@email.com', 'Zagreb'),
('Petra', 'petra@email.com', 'Rijeka'),
('Luka', 'luka@email.com', 'Split'),
('Sara', NULL, 'Zagreb');

INSERT INTO orders (customer_id, total, status) VALUES
(1, 250.00, 'completed'),
(1, 100.00, 'completed'),
(2, 450.00, 'completed'),
(2, 80.00, 'pending'),
(3, 999.00, 'completed'),
(5, 320.00, 'pending'),
(5, 150.00, 'completed');

INSERT INTO products (name, price, category) VALUES
('Laptop', 999.00, 'Electronics'),
('Mouse', 25.00, 'Electronics'),
('Keyboard', 75.00, 'Electronics'),
('Desk', 450.00, 'Furniture'),
('Chair', 350.00, 'Furniture');

INSERT INTO order_items (order_id, product_id, quantity) VALUES
(1, 1, 1),
(1, 2, 2),
(2, 3, 1),
(3, 4, 1),
(5, 1, 1),
(6, 5, 2),
(7, 2, 3);

INSERT INTO enrollments (student_id, course_id, semester, grade) VALUES
(1, 101, 'Fall2024', 'A'),
(1, 102, 'Fall2024', 'B'),
(1, 101, 'Spring2025', 'A+'),
(2, 101, 'Fall2024', 'B+'),
(2, 102, 'Fall2024', 'A'),
(3, 101, 'Fall2024', 'C');
`;

// Challenges ordered by interview priority
const challenges = [
  // === JOINs ===
  {
    id: 1,
    category: "JOINs",
    difficulty: "Easy",
    title: "Basic INNER JOIN",
    description: "Get all customer names along with their order totals. Only show customers who have orders.",
    hint: "Use INNER JOIN on customers and orders, linking customer id to order's customer_id",
    linqHint: "Use .Join() with customers as outer, orders as inner, matching on Id/CustomerId",
    expectedQuery: `SELECT customers.name, orders.total\nFROM customers\nINNER JOIN orders ON customers.id = orders.customer_id;`,
    linqExpectedQuery: `customers.Join(orders,
    customer => customer.Id,
    order => order.CustomerId,
    (customer, order) => new {
        customer.Name,
        order.Total
    });`,
    explanation: `This is the most basic JOIN pattern.

SQL explanation:
• INNER JOIN combines rows from two tables where a match exists
• ON tells the database HOW to match: customers.id = orders.customer_id
• Only customers who actually have orders appear in the result

LINQ explanation:
• .Join() takes 4 arguments:
  1. The second collection (orders)
  2. Key from first collection (customer => customer.Id)
  3. Key from second collection (order => order.CustomerId)
  4. What to return when they match (the result selector)
• It's the LINQ equivalent of INNER JOIN`,
    validateResult: (rows) => rows.length === 7 && rows[0].name !== undefined && rows[0].total !== undefined,
  },
  {
    id: 2,
    category: "JOINs",
    difficulty: "Easy",
    title: "LEFT JOIN — Include customers with no orders",
    description: "Get ALL customer names and their order totals. Customers with no orders should still appear (with NULL total).",
    hint: "LEFT JOIN keeps all rows from the left table (customers)",
    linqHint: "Use .GroupJoin() + .SelectMany() with .DefaultIfEmpty() to keep all customers",
    expectedQuery: `SELECT customers.name, orders.total
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id;`,
    linqExpectedQuery: `customers.GroupJoin(orders,
    customer => customer.Id,
    order => order.CustomerId,
    (customer, orderGroup) => new { customer, orderGroup })
.SelectMany(
    temp => temp.orderGroup.DefaultIfEmpty(),
    (temp, order) => new {
        temp.customer.Name,
        Total = order?.Total
    });`,
    explanation: `LEFT JOIN keeps ALL rows from the left table, even without matches.

SQL explanation:
• LEFT JOIN = "give me everyone from the left table (customers)"
• If a customer has no orders, their order columns show NULL
• The "left" table is the one after FROM, "right" is after LEFT JOIN

LINQ explanation:
• .GroupJoin() groups all matching orders per customer (like LEFT JOIN)
• .SelectMany() flattens the groups back into individual rows
• .DefaultIfEmpty() is the key — it keeps customers with 0 orders
  (without it, you'd get INNER JOIN behavior)
• order?.Total uses ?. because order can be null (no match)`,
    validateResult: (rows) => rows.length === 9 && rows.some(r => r.total === null),
  },
  {
    id: 3,
    category: "JOINs",
    difficulty: "Medium",
    title: "JOIN with GROUP BY",
    description: "Get each customer's name, their order count, and total spent. Include customers with 0 orders.",
    hint: "LEFT JOIN + GROUP BY customer. Use COUNT(orders.id) not COUNT(*) to get 0 for customers without orders.",
    linqHint: "Use .GroupJoin() then project with .Count() and .Sum() on the order group",
    expectedQuery: `SELECT customers.name, COUNT(orders.id) AS order_count, SUM(orders.total) AS total_spent
FROM customers
LEFT JOIN orders ON customers.id = orders.customer_id
GROUP BY customers.id;`,
    linqExpectedQuery: `customers.GroupJoin(orders,
    customer => customer.Id,
    order => order.CustomerId,
    (customer, orderGroup) => new {
        customer.Name,
        OrderCount = orderGroup.Count(),
        TotalSpent = orderGroup.Sum(order => order.Total)
    });`,
    explanation: `Combines JOIN + GROUP BY — a very common interview pattern.

SQL explanation:
• LEFT JOIN so customers with 0 orders still appear
• GROUP BY customers.id collapses multiple orders per customer into one row
• COUNT(orders.id) counts only non-NULL values → gives 0 for no-order customers
  (COUNT(*) would give 1 even for customers with no orders — common mistake!)
• SUM(orders.total) adds up all order totals per customer

LINQ explanation:
• .GroupJoin() naturally groups — each customer gets a collection of their orders
• No need for a separate .GroupBy() because GroupJoin already creates groups
• .Count() on the order group = how many orders
• .Sum(order => order.Total) = total spending`,
    validateResult: (rows) => rows.length === 6 && rows.some(r => r.order_count === 0),
  },
  {
    id: 4,
    category: "JOINs",
    difficulty: "Medium",
    title: "Multiple JOINs",
    description: "Get customer name, product name, and quantity for all order items. (Join customers → orders → order_items → products)",
    hint: "Chain INNER JOINs: customers → orders (on customer_id) → order_items (on order_id) → products (on product_id)",
    linqHint: "Chain .Join() calls or use query syntax with multiple 'join' lines",
    expectedQuery: `SELECT customers.name, products.name AS product, order_items.quantity
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id
INNER JOIN order_items ON orders.id = order_items.order_id
INNER JOIN products ON order_items.product_id = products.id;`,
    linqExpectedQuery: `from customer in customers
join order in orders on customer.Id equals order.CustomerId
join item in orderItems on order.Id equals item.OrderId
join product in products on item.ProductId equals product.Id
select new {
    customer.Name,
    Product = product.Name,
    item.Quantity
};`,
    explanation: `Chaining multiple JOINs connects several tables in sequence.

SQL explanation:
• Start from customers, JOIN to orders (via customer_id)
• Then JOIN order_items to orders (via order_id)
• Then JOIN products to order_items (via product_id)
• Each JOIN adds columns from the next table
• Think of it as following the foreign key chain

LINQ explanation:
• Query syntax (from...join...select) is cleaner for multiple joins
• Each 'join' line matches two keys with 'equals'
• The 'select new' at the end picks which fields to include
• Query syntax is often preferred over .Join().Join() for readability`,
    validateResult: (rows) => rows.length === 7 && rows[0].name !== undefined && rows[0].product !== undefined,
  },

  // === WHERE / BETWEEN ===
  {
    id: 5,
    category: "WHERE",
    difficulty: "Easy",
    title: "Basic WHERE filter",
    description: "Get all customers from Zagreb.",
    hint: "WHERE city = 'Zagreb'",
    linqHint: ".Where(customer => customer.City == \"Zagreb\")",
    expectedQuery: `SELECT * FROM customers WHERE city = 'Zagreb';`,
    linqExpectedQuery: `customers
    .Where(customer => customer.City == "Zagreb")
    .ToList();`,
    explanation: `The simplest filter — keep only rows that match a condition.

SQL: WHERE checks each row. If city = 'Zagreb' is true → keep the row.
Note: SQL uses single quotes for text values: 'Zagreb' (not double quotes).

LINQ: .Where() takes a function that returns true/false for each item.
customer => customer.City == "Zagreb" means:
"for each customer, check if their City property equals Zagreb"`,
    validateResult: (rows) => rows.length === 3 && rows.every(r => r.city === 'Zagreb'),
  },
  {
    id: 6,
    category: "WHERE",
    difficulty: "Easy",
    title: "WHERE with AND",
    description: "Get all completed orders with a total greater than 200.",
    hint: "Use AND to combine two conditions",
    linqHint: "Use && in the .Where() lambda",
    expectedQuery: `SELECT * FROM orders
WHERE status = 'completed' AND total > 200;`,
    linqExpectedQuery: `orders
    .Where(order => order.Status == "completed"
                  && order.Total > 200)
    .ToList();`,
    explanation: `AND means BOTH conditions must be true for a row to be included.

SQL: AND combines conditions. The row must be 'completed' AND have total > 200.
If either condition is false, the row is excluded.

LINQ: && is C#'s AND operator. Same logic — both sides must be true.`,
    validateResult: (rows) => rows.length === 3 && rows.every(r => r.status === 'completed' && r.total > 200),
  },
  {
    id: 7,
    category: "BETWEEN",
    difficulty: "Easy",
    title: "BETWEEN range filter",
    description: "Get all orders where the total is between 100 and 500 (inclusive).",
    hint: "BETWEEN includes both endpoints",
    linqHint: "Use >= and <= in .Where()",
    expectedQuery: `SELECT * FROM orders
WHERE total BETWEEN 100 AND 500;`,
    linqExpectedQuery: `orders
    .Where(order => order.Total >= 100
                  && order.Total <= 500)
    .ToList();`,
    explanation: `BETWEEN is a shortcut for >= AND <=.

SQL: BETWEEN 100 AND 500 includes both 100 and 500 (inclusive on both ends).
It's identical to: WHERE total >= 100 AND total <= 500.

LINQ: No .Between() method exists in C#. Just use >= and <= explicitly.`,
    validateResult: (rows) => rows.length === 5 && rows.every(r => r.total >= 100 && r.total <= 500),
  },
  {
    id: 8,
    category: "WHERE",
    difficulty: "Easy",
    title: "LIKE pattern matching",
    description: "Get all customers whose name starts with the letter 'M' or 'L'.",
    hint: "Use LIKE with % wildcard, combined with OR",
    linqHint: "Use .StartsWith() with || in .Where()",
    expectedQuery: `SELECT * FROM customers
WHERE name LIKE 'M%' OR name LIKE 'L%';`,
    linqExpectedQuery: `customers
    .Where(customer => customer.Name.StartsWith("M")
                     || customer.Name.StartsWith("L"))
    .ToList();`,
    explanation: `LIKE lets you search for patterns in text.

SQL: % means "any characters after this". So 'M%' matches anything starting with M.
OR means either condition can be true (starts with M OR starts with L).

LINQ: .StartsWith("M") does the same as LIKE 'M%'.
|| is C#'s OR operator.
Other useful methods: .Contains("rin") = LIKE '%rin%', .EndsWith("com") = LIKE '%com'`,
    validateResult: (rows) => rows.length === 2 && rows.every(r => r.name.startsWith('M') || r.name.startsWith('L')),
  },
  {
    id: 9,
    category: "WHERE",
    difficulty: "Easy",
    title: "IS NULL check",
    description: "Find all customers who don't have an email address.",
    hint: "Use IS NULL, never = NULL",
    linqHint: "Use == null in C# (it works correctly unlike SQL)",
    expectedQuery: `SELECT * FROM customers
WHERE email IS NULL;`,
    linqExpectedQuery: `customers
    .Where(customer => customer.Email == null)
    .ToList();`,
    explanation: `NULL means "no data" — checking for it is a common gotcha.

SQL: You MUST use IS NULL, never = NULL.
Why? NULL isn't a value — it means "unknown". You can't compare unknowns with =.
WHERE email = NULL always returns 0 rows (a very common beginner bug!).

LINQ: In C#, == null works correctly. No special syntax needed.`,
    validateResult: (rows) => rows.length === 1 && rows[0].name === 'Sara',
  },

  // === Aliases ===
  {
    id: 10,
    category: "Aliases",
    difficulty: "Easy",
    title: "Column aliases",
    description: "Get customer names as 'customer_name' and their cities as 'location' from the customers table.",
    hint: "Use AS to rename columns in output",
    linqHint: "Use named properties: new { CustomerName = customer.Name, Location = customer.City }",
    expectedQuery: `SELECT name AS customer_name, city AS location
FROM customers;`,
    linqExpectedQuery: `customers.Select(customer => new {
    CustomerName = customer.Name,
    Location = customer.City
});`,
    explanation: `Aliases rename columns in your results — they don't change the actual table.

SQL: AS gives a column a different name in the output.
"name AS customer_name" means the result column is called "customer_name" instead of "name".

LINQ: When you create a new anonymous object (new { ... }), the property names
you choose ARE the aliases. CustomerName = customer.Name is like SQL's AS.`,
    validateResult: (rows) => rows.length === 6 && rows[0].customer_name !== undefined && rows[0].location !== undefined,
  },
  {
    id: 11,
    category: "Aliases",
    difficulty: "Medium",
    title: "Aggregate with alias",
    description: "Get each customer_id, their number of orders as 'order_count', and total spending as 'total_spent' from the orders table.",
    hint: "GROUP BY customer_id, use COUNT(*) AS order_count and SUM(total) AS total_spent",
    linqHint: ".GroupBy(order => order.CustomerId) then .Select() with group.Count() and group.Sum()",
    expectedQuery: `SELECT customer_id,
  COUNT(*) AS order_count,
  SUM(total) AS total_spent
FROM orders
GROUP BY customer_id;`,
    linqExpectedQuery: `orders
    .GroupBy(order => order.CustomerId)
    .Select(group => new {
        CustomerId = group.Key,
        OrderCount = group.Count(),
        TotalSpent = group.Sum(order => order.Total)
    });`,
    explanation: `GROUP BY + aggregates with aliases — names make results readable.

SQL:
• GROUP BY splits orders into piles by customer_id
• COUNT(*) counts rows in each pile, AS order_count names it
• SUM(total) adds up totals in each pile, AS total_spent names it

LINQ:
• .GroupBy() creates groups. Each group has a .Key (the customer_id)
• group.Count() = how many items in the group
• group.Sum(order => order.Total) = sum of Total for all items in group
• Property names in new { } act as the aliases`,
    validateResult: (rows) => rows.length === 4 && rows[0].order_count !== undefined && rows[0].total_spent !== undefined,
  },

  // === GROUP BY / HAVING ===
  {
    id: 12,
    category: "Aggregates",
    difficulty: "Medium",
    title: "HAVING filter on groups",
    description: "Find customers (by customer_id) who have spent more than 400 in total. Show customer_id and their total_spent.",
    hint: "GROUP BY customer_id, then HAVING SUM(total) > 400",
    linqHint: ".GroupBy() → .Select() → .Where() (the .Where after GroupBy acts as HAVING)",
    expectedQuery: `SELECT customer_id, SUM(total) AS total_spent
FROM orders
GROUP BY customer_id
HAVING SUM(total) > 400;`,
    linqExpectedQuery: `orders
    .GroupBy(order => order.CustomerId)
    .Select(group => new {
        CustomerId = group.Key,
        TotalSpent = group.Sum(order => order.Total)
    })
    .Where(result => result.TotalSpent > 400);`,
    explanation: `HAVING filters GROUPS (after aggregation). WHERE filters individual ROWS (before grouping).

SQL:
• First GROUP BY creates one row per customer
• SUM(total) calculates each customer's total spending
• HAVING then filters: only keep groups where SUM > 400
• You CAN'T use WHERE here because WHERE runs before GROUP BY

LINQ:
• .Where() AFTER .GroupBy().Select() acts like HAVING
• .Where() BEFORE .GroupBy() acts like WHERE
• The position of .Where() determines which SQL clause it maps to`,
    validateResult: (rows) => rows.length === 3 && rows.every(r => r.total_spent > 400),
  },
  {
    id: 13,
    category: "Aggregates",
    difficulty: "Medium",
    title: "COUNT with GROUP BY",
    description: "Count how many orders exist for each status. Show status and the count.",
    hint: "GROUP BY status, COUNT(*)",
    linqHint: ".GroupBy(order => order.Status) then .Select() with group.Key and group.Count()",
    expectedQuery: `SELECT status, COUNT(*) AS count
FROM orders
GROUP BY status;`,
    linqExpectedQuery: `orders
    .GroupBy(order => order.Status)
    .Select(group => new {
        Status = group.Key,
        Count = group.Count()
    });`,
    explanation: `GROUP BY a text column — works the same way as grouping by an ID.

SQL:
• GROUP BY status creates one pile for each unique status ('completed', 'pending')
• COUNT(*) counts how many orders are in each pile

LINQ:
• .GroupBy(order => order.Status) groups by the Status string
• group.Key is the status value (e.g., "completed")
• group.Count() is how many orders have that status`,
    validateResult: (rows) => rows.length === 2,
  },

  // === Composite Keys ===
  {
    id: 14,
    category: "Composite Keys",
    difficulty: "Medium",
    title: "Query a composite key table",
    description: "Find all enrollments for student_id 1. Show course_id, semester, and grade.",
    hint: "Simple WHERE filter on the enrollments table",
    linqHint: ".Where(enrollment => enrollment.StudentId == 1).Select(...)",
    expectedQuery: `SELECT course_id, semester, grade
FROM enrollments
WHERE student_id = 1;`,
    linqExpectedQuery: `enrollments
    .Where(enrollment => enrollment.StudentId == 1)
    .Select(enrollment => new {
        enrollment.CourseId,
        enrollment.Semester,
        enrollment.Grade
    });`,
    explanation: `Querying a composite key table works like any other table — just use WHERE.

SQL: The composite key (student_id, course_id, semester) doesn't change how you query.
You can still filter on any individual column with WHERE.

LINQ: Same — .Where() works normally. The composite key only matters for
inserts and updates (where uniqueness is enforced), not for reads.`,
    validateResult: (rows) => rows.length === 3 && rows.every(r => r.course_id !== undefined),
  },
  {
    id: 15,
    category: "Composite Keys",
    difficulty: "Medium",
    title: "Aggregate on composite key table",
    description: "Count how many students are enrolled in each course (by course_id). Show course_id and student_count.",
    hint: "GROUP BY course_id on enrollments table, use COUNT(DISTINCT student_id)",
    linqHint: ".GroupBy(enrollment => enrollment.CourseId) then count distinct students",
    expectedQuery: `SELECT course_id, COUNT(DISTINCT student_id) AS student_count
FROM enrollments
GROUP BY course_id;`,
    linqExpectedQuery: `enrollments
    .GroupBy(enrollment => enrollment.CourseId)
    .Select(group => new {
        CourseId = group.Key,
        StudentCount = group
            .Select(enrollment => enrollment.StudentId)
            .Distinct()
            .Count()
    });`,
    explanation: `COUNT(DISTINCT ...) counts unique values only — avoids double-counting.

SQL:
• GROUP BY course_id creates one pile per course
• COUNT(DISTINCT student_id) counts unique students per course
  (without DISTINCT, a student in the same course for 2 semesters would count as 2)

LINQ:
• After grouping, .Select(enrollment => enrollment.StudentId) gets all student IDs in the group
• .Distinct() removes duplicates
• .Count() counts what's left — unique students only`,
    validateResult: (rows) => rows.length === 2,
  },

  // === Combined / Interview-style ===
  {
    id: 16,
    category: "Combined",
    difficulty: "Hard",
    title: "Top spenders with names",
    description: "Get the top 2 customers by total spending. Show their name and total_spent, ordered highest first.",
    hint: "JOIN customers with orders, GROUP BY, ORDER BY DESC, LIMIT 2",
    linqHint: "GroupJoin → .Select() with .Sum() → .OrderByDescending() → .Take(2)",
    expectedQuery: `SELECT customers.name, SUM(orders.total) AS total_spent
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id
GROUP BY customers.id
ORDER BY total_spent DESC
LIMIT 2;`,
    linqExpectedQuery: `customers.GroupJoin(orders,
    customer => customer.Id,
    order => order.CustomerId,
    (customer, orderGroup) => new {
        customer.Name,
        TotalSpent = orderGroup.Sum(order => order.Total)
    })
    .Where(result => result.TotalSpent > 0)
    .OrderByDescending(result => result.TotalSpent)
    .Take(2);`,
    explanation: `This combines JOIN + GROUP BY + ORDER BY + LIMIT — a common interview question.

SQL step by step:
1. INNER JOIN connects customers to their orders
2. GROUP BY customers.id collapses multiple orders per customer
3. SUM(orders.total) calculates total spending per customer
4. ORDER BY total_spent DESC sorts highest spenders first
5. LIMIT 2 keeps only the top 2

LINQ step by step:
1. .GroupJoin() connects customers to their orders (keeps groups)
2. .Sum() in the Select calculates total per customer
3. .Where() removes customers with $0 spending
4. .OrderByDescending() sorts highest first
5. .Take(2) keeps only top 2`,
    validateResult: (rows) => rows.length === 2 && rows[0].total_spent >= rows[1].total_spent,
  },
  {
    id: 17,
    category: "Combined",
    difficulty: "Hard",
    title: "Customers with pending orders",
    description: "Get names of customers who have at least one pending order, along with their total pending amount.",
    hint: "JOIN + WHERE status = 'pending' + GROUP BY",
    linqHint: "Filter orders first with .Where(status == pending), then GroupJoin with customers",
    expectedQuery: `SELECT customers.name, SUM(orders.total) AS pending_total
FROM customers
INNER JOIN orders ON customers.id = orders.customer_id
WHERE orders.status = 'pending'
GROUP BY customers.id;`,
    linqExpectedQuery: `customers.GroupJoin(
    orders.Where(order => order.Status == "pending"),
    customer => customer.Id,
    order => order.CustomerId,
    (customer, orderGroup) => new {
        customer.Name,
        PendingTotal = orderGroup.Sum(order => order.Total)
    })
    .Where(result => result.PendingTotal > 0);`,
    explanation: `Filter first, then join and aggregate — important to get the order right.

SQL:
• JOIN connects customers to orders
• WHERE filters to only 'pending' orders BEFORE grouping
• GROUP BY collapses rows per customer
• SUM gives the total pending amount

LINQ:
• Filter orders FIRST: orders.Where(order => order.Status == "pending")
• Then GroupJoin with the already-filtered orders
• .Sum() calculates pending total per customer
• Final .Where() removes customers with $0 pending (they had no pending orders)`,
    validateResult: (rows) => rows.length === 2,
  },
  {
    id: 18,
    category: "Combined",
    difficulty: "Hard",
    title: "Full clause order",
    description: "Get customer_id and total_spent for completed orders only, grouped by customer, where total_spent > 200, ordered by total_spent descending, limited to 3 results.",
    hint: "Use the full clause order: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT",
    linqHint: ".Where() → .GroupBy() → .Select() → .Where() (HAVING) → .OrderByDescending() → .Take(3)",
    expectedQuery: `SELECT customer_id, SUM(total) AS total_spent
FROM orders
WHERE status = 'completed'
GROUP BY customer_id
HAVING SUM(total) > 200
ORDER BY total_spent DESC
LIMIT 3;`,
    linqExpectedQuery: `orders
    .Where(order => order.Status == "completed")
    .GroupBy(order => order.CustomerId)
    .Select(group => new {
        CustomerId = group.Key,
        TotalSpent = group.Sum(order => order.Total)
    })
    .Where(result => result.TotalSpent > 200)
    .OrderByDescending(result => result.TotalSpent)
    .Take(3);`,
    explanation: `The ultimate SQL clause order exercise: S-F-W-G-H-O-L.

SQL clause order (mandatory):
1. SELECT — what columns to show
2. FROM — which table
3. WHERE — filter individual rows (before grouping)
4. GROUP BY — group rows together
5. HAVING — filter groups (after grouping)
6. ORDER BY — sort the results
7. LIMIT — cap the number of results

LINQ equivalent chain:
1. orders (FROM)
2. .Where() before grouping (WHERE — filter rows)
3. .GroupBy() (GROUP BY)
4. .Select() (SELECT — project results)
5. .Where() after select (HAVING — filter groups)
6. .OrderByDescending() (ORDER BY DESC)
7. .Take(3) (LIMIT 3)`,
    validateResult: (rows) => rows.length === 3 && rows[0].total_spent >= rows[1].total_spent,
  },
];

export default challenges;
