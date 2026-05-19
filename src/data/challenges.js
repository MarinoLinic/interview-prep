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
    expectedQuery: `SELECT c.name, o.total FROM customers c INNER JOIN orders o ON c.id = o.customer_id;`,
    validateResult: (rows) => rows.length === 7 && rows[0].name !== undefined && rows[0].total !== undefined,
  },
  {
    id: 2,
    category: "JOINs",
    difficulty: "Easy",
    title: "LEFT JOIN — Include customers with no orders",
    description: "Get ALL customer names and their order totals. Customers with no orders should still appear (with NULL total).",
    hint: "LEFT JOIN keeps all rows from the left table (customers)",
    expectedQuery: `SELECT c.name, o.total FROM customers c LEFT JOIN orders o ON c.id = o.customer_id;`,
    validateResult: (rows) => rows.length === 9 && rows.some(r => r.total === null),
  },
  {
    id: 3,
    category: "JOINs",
    difficulty: "Medium",
    title: "JOIN with GROUP BY",
    description: "Get each customer's name, their order count, and total spent. Include customers with 0 orders.",
    hint: "LEFT JOIN + GROUP BY customer. Use COUNT(o.id) not COUNT(*) to get 0 for customers without orders.",
    expectedQuery: `SELECT c.name, COUNT(o.id) AS order_count, SUM(o.total) AS total_spent FROM customers c LEFT JOIN orders o ON c.id = o.customer_id GROUP BY c.id;`,
    validateResult: (rows) => rows.length === 6 && rows.some(r => r.order_count === 0),
  },
  {
    id: 4,
    category: "JOINs",
    difficulty: "Medium",
    title: "Multiple JOINs",
    description: "Get customer name, product name, and quantity for all order items. (Join customers → orders → order_items → products)",
    hint: "Chain INNER JOINs: customers → orders (on customer_id) → order_items (on order_id) → products (on product_id)",
    expectedQuery: `SELECT c.name, p.name AS product, oi.quantity FROM customers c INNER JOIN orders o ON c.id = o.customer_id INNER JOIN order_items oi ON o.id = oi.order_id INNER JOIN products p ON oi.product_id = p.id;`,
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
    expectedQuery: `SELECT * FROM customers WHERE city = 'Zagreb';`,
    validateResult: (rows) => rows.length === 3 && rows.every(r => r.city === 'Zagreb'),
  },
  {
    id: 6,
    category: "WHERE",
    difficulty: "Easy",
    title: "WHERE with AND",
    description: "Get all completed orders with a total greater than 200.",
    hint: "Use AND to combine two conditions",
    expectedQuery: `SELECT * FROM orders WHERE status = 'completed' AND total > 200;`,
    validateResult: (rows) => rows.length === 3 && rows.every(r => r.status === 'completed' && r.total > 200),
  },
  {
    id: 7,
    category: "BETWEEN",
    difficulty: "Easy",
    title: "BETWEEN range filter",
    description: "Get all orders where the total is between 100 and 500 (inclusive).",
    hint: "BETWEEN includes both endpoints",
    expectedQuery: `SELECT * FROM orders WHERE total BETWEEN 100 AND 500;`,
    validateResult: (rows) => rows.length === 5 && rows.every(r => r.total >= 100 && r.total <= 500),
  },
  {
    id: 8,
    category: "WHERE",
    difficulty: "Easy",
    title: "LIKE pattern matching",
    description: "Get all customers whose name starts with the letter 'M' or 'L'.",
    hint: "Use LIKE with % wildcard, combined with OR",
    expectedQuery: `SELECT * FROM customers WHERE name LIKE 'M%' OR name LIKE 'L%';`,
    validateResult: (rows) => rows.length === 2 && rows.every(r => r.name.startsWith('M') || r.name.startsWith('L')),
  },
  {
    id: 9,
    category: "WHERE",
    difficulty: "Easy",
    title: "IS NULL check",
    description: "Find all customers who don't have an email address.",
    hint: "Use IS NULL, never = NULL",
    expectedQuery: `SELECT * FROM customers WHERE email IS NULL;`,
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
    expectedQuery: `SELECT name AS customer_name, city AS location FROM customers;`,
    validateResult: (rows) => rows.length === 6 && rows[0].customer_name !== undefined && rows[0].location !== undefined,
  },
  {
    id: 11,
    category: "Aliases",
    difficulty: "Medium",
    title: "Aggregate with alias",
    description: "Get each customer_id, their number of orders as 'order_count', and total spending as 'total_spent' from the orders table.",
    hint: "GROUP BY customer_id, use COUNT(*) AS order_count and SUM(total) AS total_spent",
    expectedQuery: `SELECT customer_id, COUNT(*) AS order_count, SUM(total) AS total_spent FROM orders GROUP BY customer_id;`,
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
    expectedQuery: `SELECT customer_id, SUM(total) AS total_spent FROM orders GROUP BY customer_id HAVING SUM(total) > 400;`,
    validateResult: (rows) => rows.length === 3 && rows.every(r => r.total_spent > 400),
  },
  {
    id: 13,
    category: "Aggregates",
    difficulty: "Medium",
    title: "COUNT with GROUP BY",
    description: "Count how many orders exist for each status. Show status and the count.",
    hint: "GROUP BY status, COUNT(*)",
    expectedQuery: `SELECT status, COUNT(*) AS count FROM orders GROUP BY status;`,
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
    expectedQuery: `SELECT course_id, semester, grade FROM enrollments WHERE student_id = 1;`,
    validateResult: (rows) => rows.length === 3 && rows.every(r => r.course_id !== undefined),
  },
  {
    id: 15,
    category: "Composite Keys",
    difficulty: "Medium",
    title: "Aggregate on composite key table",
    description: "Count how many students are enrolled in each course (by course_id). Show course_id and student_count.",
    hint: "GROUP BY course_id on enrollments table, use COUNT(DISTINCT student_id)",
    expectedQuery: `SELECT course_id, COUNT(DISTINCT student_id) AS student_count FROM enrollments GROUP BY course_id;`,
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
    expectedQuery: `SELECT c.name, SUM(o.total) AS total_spent FROM customers c INNER JOIN orders o ON c.id = o.customer_id GROUP BY c.id ORDER BY total_spent DESC LIMIT 2;`,
    validateResult: (rows) => rows.length === 2 && rows[0].total_spent >= rows[1].total_spent,
  },
  {
    id: 17,
    category: "Combined",
    difficulty: "Hard",
    title: "Customers with pending orders",
    description: "Get names of customers who have at least one pending order, along with their total pending amount.",
    hint: "JOIN + WHERE status = 'pending' + GROUP BY",
    expectedQuery: `SELECT c.name, SUM(o.total) AS pending_total FROM customers c INNER JOIN orders o ON c.id = o.customer_id WHERE o.status = 'pending' GROUP BY c.id;`,
    validateResult: (rows) => rows.length === 2,
  },
  {
    id: 18,
    category: "Combined",
    difficulty: "Hard",
    title: "Full clause order",
    description: "Get customer_id and total_spent for completed orders only, grouped by customer, where total_spent > 200, ordered by total_spent descending, limited to 3 results.",
    hint: "Use the full clause order: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT",
    expectedQuery: `SELECT customer_id, SUM(total) AS total_spent FROM orders WHERE status = 'completed' GROUP BY customer_id HAVING SUM(total) > 200 ORDER BY total_spent DESC LIMIT 3;`,
    validateResult: (rows) => rows.length === 3 && rows[0].total_spent >= rows[1].total_spent,
  },
];

export default challenges;
