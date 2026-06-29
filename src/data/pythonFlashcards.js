// Python Flashcards — core language concepts for backend/general Python interviews
// Priority: "core" = very likely to be asked, "important" = good to know, "extra" = deeper knowledge

const pythonFlashcards = [
  // === Data Types ===
  {
    id: 1,
    priority: "core",
    category: "Data Types",
    question: "What is the difference between a list and a tuple in Python?",
    answer: "List = mutable (can be changed after creation), defined with []. Tuple = immutable (cannot be changed after creation), defined with (). Use a list when data needs to change; use a tuple for fixed collections (coordinates, function return values, dictionary keys).",
    example: `# List — mutable
fruits = ["apple", "banana", "cherry"]
fruits.append("mango")   # OK
fruits[0] = "avocado"    # OK

# Tuple — immutable
point = (10, 20)
# point[0] = 99          # TypeError: 'tuple' object does not support item assignment
# point.append(30)       # AttributeError: 'tuple' object has no attribute 'append'

# Tuples can be used as dictionary keys (lists cannot)
locations = {(48.8566, 2.3522): "Paris"}

# Unpacking works the same
x, y = point             # x=10, y=20`,
    readMore: `The short version for an interview:
• List → [1, 2, 3] → mutable → use when your data changes
• Tuple → (1, 2, 3) → immutable → use when your data is fixed

Why does immutability matter?
• Tuples are slightly faster than lists (Python can optimise them internally)
• Tuples can be used as dictionary keys or set members — lists cannot, because mutable objects can't be hashed reliably
• Tuples signal intent: "this data is not meant to change"

Common real-world uses of tuples:
• Returning multiple values from a function: return name, age
• (x, y) coordinates or (lat, lng) pairs
• Named tuples for lightweight data objects

Common real-world uses of lists:
• Any collection that grows/shrinks: shopping cart, query results
• When you need .append(), .remove(), .sort()`
  },
  {
    id: 2,
    priority: "core",
    category: "Data Types",
    question: "What are Python's main built-in data types?",
    answer: "str (text), int (integer), float (decimal), bool (True/False), list (ordered mutable sequence), tuple (ordered immutable sequence), dict (key-value pairs), set (unordered unique values), NoneType (the None value). Python is dynamically typed — you don't declare types.",
    example: `name = "Marino"          # str
age = 25                 # int
height = 1.85            # float
is_active = True         # bool

fruits = ["apple", "banana"]  # list
coords = (48.8, 2.35)         # tuple
user = {"id": 1, "name": "M"} # dict
tags = {"python", "backend"}  # set

nothing = None           # NoneType

# Check types
print(type(name))        # <class 'str'>
print(isinstance(age, int))  # True`,
    readMore: `Python is dynamically typed, which means you don't write int x = 5 like in C#.
You just write x = 5 and Python figures it out.

That said, Python 3.5+ supports type hints for readability:
  def greet(name: str) -> str:
      return f"Hello, {name}"

This doesn't enforce types at runtime, it's just a hint for your IDE and tools like mypy.

Coming from JavaScript:
• Python's list ≈ JS array
• Python's dict ≈ JS object/Map
• Python's set ≈ JS Set
• Python's None ≈ JS null (there's no undefined in Python)
• Python's tuple has no direct JS equivalent`
  },
  {
    id: 3,
    priority: "core",
    category: "Data Types",
    question: "What is the difference between mutable and immutable types?",
    answer: "Mutable types can be changed after creation (list, dict, set). Immutable types cannot (int, float, str, tuple, bool). This matters because mutable objects passed to functions can be modified inside the function; immutable ones cannot.",
    example: `# Immutable — reassigning creates a new object
x = "hello"
x += " world"   # creates a brand new string, doesn't modify the old one

# Mutable — modified in place
nums = [1, 2, 3]
nums.append(4)  # modifies the SAME list object

# Watch out — mutable default arguments!
def add_item(item, lst=[]):   # BAD: same list reused across calls
    lst.append(item)
    return lst

def add_item(item, lst=None): # GOOD
    if lst is None:
        lst = []
    lst.append(item)
    return lst`,
    readMore: `This is a common Python gotcha in interviews:

The mutable default argument trap:
If you write def foo(items=[]), Python creates that list ONCE when the function is defined,
not on every call. So calling foo() twice shares the same list!

This is one of the most famous Python interview tricks. Always use None as a default
and create a new list inside the function body.

Why strings are immutable:
In Python, even though you can do s = s + " world", this creates a NEW string.
The original is unchanged. This is why string concatenation in a loop is slow
(each + creates a new object) — use "".join(parts) instead for efficiency.`
  },
  {
    id: 4,
    priority: "important",
    category: "Data Types",
    question: "What is the difference between == and is in Python?",
    answer: "== checks value equality (do they have the same content?). is checks identity (are they the exact same object in memory?). Use == for value comparisons. Use is only for None checks (if x is None) or singleton comparisons.",
    example: `a = [1, 2, 3]
b = [1, 2, 3]

print(a == b)   # True  — same content
print(a is b)   # False — different objects in memory

c = a           # c points to the same object as a
print(a is c)   # True

# The correct way to check for None
x = None
if x is None:   # correct
    print("nothing")
if x == None:   # works but not idiomatic — avoid`,
    readMore: `Python caches small integers (-5 to 256) and interned strings for performance,
so this can be confusing:

a = 256; b = 256
print(a is b)   # True — same cached object!

a = 257; b = 257
print(a is b)   # False — outside the cache, different objects

This is why you should NEVER use 'is' for value comparisons.
It might work for small numbers by accident, but fail for larger ones.

Rule of thumb:
• Use == for comparing values (numbers, strings, lists, dicts)
• Use is only for None, True, False (singletons)`
  },
  {
    id: 5,
    priority: "important",
    category: "Data Types",
    question: "What is a dictionary in Python and when would you use it?",
    answer: "A dict stores key-value pairs. Keys must be unique and immutable (strings, numbers, tuples). Values can be anything. Use it when you need fast lookups by name/ID rather than position. dict.get(key) is safer than dict[key] because it returns None instead of raising a KeyError.",
    example: `user = {"id": 1, "name": "Marino", "role": "dev"}

# Access
print(user["name"])           # "Marino"
print(user.get("email"))      # None (no KeyError)
print(user.get("email", "")) # "" (with default)

# Modify
user["role"] = "senior dev"
user["city"] = "Zagreb"       # add new key

# Loop
for key, value in user.items():
    print(f"{key}: {value}")

# Check key existence
if "name" in user:
    print("has name")

# Dict comprehension
squares = {n: n**2 for n in range(1, 6)}
# {1: 1, 2: 4, 3: 9, 4: 16, 5: 25}`,
    readMore: `Python dicts preserve insertion order since Python 3.7+.
Before that, order was not guaranteed.

Common dict patterns:
• dict.get(key, default) — safe access without KeyError
• dict.setdefault(key, []).append(val) — append to list, create if missing
• {**dict1, **dict2} — merge two dicts (Python 3.5+)
• dict1 | dict2 — merge two dicts (Python 3.9+)

Difference from a list:
• List → access by index (position): items[0]
• Dict → access by key (name): user["name"]

If you need a dict with a default value for missing keys, use collections.defaultdict.`
  },
  {
    id: 6,
    priority: "extra",
    category: "Data Types",
    question: "What is a set in Python?",
    answer: "A set is an unordered collection of unique values. Use it when you need to remove duplicates, or check membership very fast (O(1)). Sets are mutable, but elements must be immutable (no lists or dicts as elements). Frozen sets are immutable sets.",
    example: `tags = {"python", "backend", "api"}
tags.add("python")   # no effect — already exists
print(tags)          # {'python', 'backend', 'api'} — order not guaranteed

# Fast membership check
if "python" in tags:
    print("found")  # O(1) lookup

# Remove duplicates from a list
nums = [1, 2, 2, 3, 3, 3]
unique = list(set(nums))   # [1, 2, 3] (order not guaranteed)

# Set operations
a = {1, 2, 3, 4}
b = {3, 4, 5, 6}
print(a & b)   # {3, 4}       — intersection
print(a | b)   # {1,2,3,4,5,6} — union
print(a - b)   # {1, 2}       — difference`,
    readMore: `Sets are backed by a hash table, same as dict keys.
That's why elements must be hashable (immutable).

When to use a set vs a list:
• Need unique items → set
• Need to check "is X in collection?" very often → set (O(1) vs O(n) for list)
• Need order / duplicates → list

Common interview use case:
Finding duplicates in a list:
  seen = set()
  duplicates = [x for x in nums if x in seen or seen.add(x)]`
  },

  // === Functions ===
  {
    id: 7,
    priority: "core",
    category: "Functions",
    question: "What are *args and **kwargs?",
    answer: "*args collects extra positional arguments into a tuple. **kwargs collects extra keyword arguments into a dictionary. They allow functions to accept a variable number of arguments. * and ** can also be used to unpack lists/dicts when calling functions.",
    example: `def greet(*args):
    for name in args:
        print(f"Hello, {name}")

greet("Alice", "Bob", "Marino")  # 3 names, one call

def describe(**kwargs):
    for key, val in kwargs.items():
        print(f"{key} = {val}")

describe(name="Marino", role="dev", city="Zagreb")

# Combined
def create_user(user_id, *roles, **metadata):
    print(user_id, roles, metadata)

create_user(1, "admin", "editor", city="Zagreb", active=True)
# 1, ('admin', 'editor'), {'city': 'Zagreb', 'active': True}

# Unpacking when calling
nums = [1, 2, 3]
print(max(*nums))        # same as max(1, 2, 3)

config = {"end": "!", "sep": ", "}
print("a", "b", **config)   # a, b!`,
    readMore: `The names *args and **kwargs are just convention. What matters is the * and **.

• *args → "give me any extra positional arguments as a tuple"
• **kwargs → "give me any extra keyword arguments as a dict"

You can name them anything:
  def foo(*values, **options): ...

Order must be: regular args → *args → keyword-only args → **kwargs

Real-world use:
• Wrapper/decorator functions that forward arguments
• Building flexible APIs where you don't want to lock in every parameter
• Merging configs: {**defaults, **overrides}`
  },
  {
    id: 8,
    priority: "core",
    category: "Functions",
    question: "What is a lambda function in Python?",
    answer: "A lambda is a small anonymous function defined in one line: lambda arguments: expression. It can only contain a single expression, not statements. Commonly used with sorted(), map(), filter() as a quick inline function.",
    example: `# Regular function
def double(x):
    return x * 2

# Equivalent lambda
double = lambda x: x * 2

print(double(5))   # 10

# Common uses
users = [{"name": "Zlatan", "age": 39}, {"name": "Marino", "age": 25}]

# Sort by age
sorted_users = sorted(users, key=lambda u: u["age"])

# Filter active items
nums = [1, 2, 3, 4, 5, 6]
evens = list(filter(lambda n: n % 2 == 0, nums))  # [2, 4, 6]

# Map — transform each item
doubled = list(map(lambda n: n * 2, nums))  # [2, 4, 6, 8, 10, 12]`,
    readMore: `Lambdas are great for short inline logic. For anything complex, write a proper def function.

PEP 8 (Python style guide) says: don't assign a lambda to a variable like double = lambda x: x * 2.
If you want a named function, just use def. The lambda form is less readable and gives worse tracebacks.

Lambdas are most useful as the key= or default argument in:
• sorted(items, key=lambda x: x.age)
• min(items, key=lambda x: x.price)
• dict.get with a callable default (less common)

In Python, list comprehensions are often cleaner than map/filter + lambda:
  evens = [n for n in nums if n % 2 == 0]   # preferred over filter + lambda`
  },
  {
    id: 9,
    priority: "important",
    category: "Functions",
    question: "What is a generator in Python?",
    answer: "A generator is a function that uses yield instead of return. It produces values one at a time (lazy evaluation) instead of building a whole list in memory. Use generators when dealing with large or infinite sequences. They implement the iterator protocol.",
    example: `# Regular function — builds entire list in memory
def get_squares(n):
    return [i**2 for i in range(n)]

# Generator — produces one value at a time
def get_squares_gen(n):
    for i in range(n):
        yield i**2

gen = get_squares_gen(1_000_000)  # barely uses any memory
print(next(gen))  # 0
print(next(gen))  # 1

for val in gen:   # iterate through the rest
    pass

# Generator expression (like list comprehension but lazy)
squares = (x**2 for x in range(10))  # () not []`,
    readMore: `Key difference: return vs yield
• return → run once, return value, function ends
• yield → pause here, give back value, resume next time

Why generators are powerful:
• Reading a huge file line by line: no need to load it all into memory
• Generating pagination results on demand
• Infinite sequences (like itertools.count())

def read_large_file(path):
    with open(path) as f:
        for line in f:
            yield line.strip()   # one line at a time

Once exhausted, a generator is done. You can't reuse it — create a new one.
List comprehension = eager (all at once). Generator expression = lazy (one at a time).`
  },
  {
    id: 10,
    priority: "important",
    category: "Functions",
    question: "What is a decorator in Python?",
    answer: "A decorator is a function that wraps another function to add behaviour without modifying it. Applied with @decorator_name above a function definition. Commonly used for logging, timing, authentication checks, caching.",
    example: `import functools

def log_call(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        result = func(*args, **kwargs)
        print(f"Done: {func.__name__}")
        return result
    return wrapper

@log_call
def greet(name):
    print(f"Hello, {name}")

greet("Marino")
# Calling greet
# Hello, Marino
# Done: greet

# Built-in decorators
class MyClass:
    @staticmethod
    def utility():     # no self/cls
        return 42

    @classmethod
    def create(cls):   # cls = the class itself
        return cls()

    @property
    def name(self):    # call as obj.name, not obj.name()
        return self._name`,
    readMore: `A decorator is just syntactic sugar:
  @log_call
  def greet(name): ...

is exactly the same as:
  def greet(name): ...
  greet = log_call(greet)

functools.wraps(func) is important — it preserves the original function's __name__ and __doc__.
Without it, greet.__name__ would return "wrapper", which breaks debugging and docs.

Common real-world decorators:
• @login_required (Django/Flask) — check authentication
• @cache / @lru_cache — memoize expensive function results
• @retry — retry on failure
• @property — turn a method into an attribute-style access`
  },

  // === Comprehensions ===
  {
    id: 11,
    priority: "core",
    category: "Comprehensions",
    question: "What is a list comprehension and when should you use it?",
    answer: "A list comprehension is a concise way to create a list from an iterable: [expression for item in iterable if condition]. It replaces simple for-loops that build a list. Use for simple, readable transformations — avoid if logic gets complex.",
    example: `# Traditional loop
squares = []
for n in range(1, 6):
    squares.append(n**2)

# List comprehension — same result
squares = [n**2 for n in range(1, 6)]
# [1, 4, 9, 16, 25]

# With filter
evens = [n for n in range(20) if n % 2 == 0]

# Transform strings
names = ["alice", "bob", "charlie"]
upper = [name.upper() for name in names]

# Nested (flatten a 2D list)
matrix = [[1, 2], [3, 4], [5, 6]]
flat = [num for row in matrix for num in row]
# [1, 2, 3, 4, 5, 6]

# Dict and set comprehensions
word_lengths = {word: len(word) for word in names}
unique_lengths = {len(word) for word in names}`,
    readMore: `List comprehensions are considered more Pythonic than explicit for-loops for simple cases.
They're also usually faster because Python can optimise them internally.

When to use a list comprehension:
✅ Simple transformations: [x*2 for x in items]
✅ Simple filters: [x for x in items if x > 0]
✅ Combining both: [x*2 for x in items if x > 0]

When NOT to use one:
❌ Complex logic that spans multiple lines (write a loop)
❌ Side effects — don't use comprehensions just for their side effect
❌ When you need the generator version ([...] vs (...)) to save memory`
  },

  // === OOP ===
  {
    id: 12,
    priority: "core",
    category: "OOP",
    question: "How do you define a class in Python? What is __init__?",
    answer: "__init__ is the constructor — it runs automatically when you create a new instance. self refers to the instance itself and must be the first parameter of every instance method. Python does not have access modifiers (public/private); use _ prefix by convention for 'private'.",
    example: `class User:
    # Class variable — shared across all instances
    user_count = 0

    def __init__(self, name, role="viewer"):
        self.name = name          # instance variable
        self.role = role
        User.user_count += 1

    def greet(self):
        return f"Hi, I'm {self.name} ({self.role})"

    def __str__(self):            # used by print() and str()
        return f"User({self.name})"

    def __repr__(self):           # used in debugger / repr()
        return f"User(name={self.name!r}, role={self.role!r})"

marino = User("Marino", "admin")
print(marino)           # User(Marino)
print(marino.greet())   # Hi, I'm Marino (admin)
print(User.user_count)  # 1`,
    readMore: `self is not a keyword in Python — it's just a strong convention.
The first parameter of an instance method always receives the instance.
You could technically name it this or me, but never do that.

__init__ vs __new__:
• __init__ = initialise a new instance (what you almost always want)
• __new__ = actually create the instance (used rarely, e.g. for singletons)

Access conventions:
• name → public (use freely)
• _name → protected (don't touch from outside, but not enforced)
• __name → name-mangled (Python renames it to _ClassName__name to prevent accidental overrides)

Coming from C#:
• Python has no private/public/protected keywords
• No method overloading (define one method with defaults or *args instead)
• No interfaces — use abstract base classes (abc module) or duck typing`
  },
  {
    id: 13,
    priority: "important",
    category: "OOP",
    question: "What is inheritance in Python and how does super() work?",
    answer: "A child class inherits all methods and attributes from a parent class. super() calls the parent class's method, used in __init__ to run the parent's initialisation before adding child-specific setup.",
    example: `class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return f"{self.name} makes a sound"

class Dog(Animal):
    def __init__(self, name, breed):
        super().__init__(name)    # run Animal.__init__ first
        self.breed = breed

    def speak(self):              # override parent method
        return f"{self.name} barks"

class GuideDog(Dog):
    def speak(self):
        parent = super().speak()  # Dog.speak()
        return f"{parent} (guide dog)"

rex = Dog("Rex", "Labrador")
print(rex.speak())   # Rex barks
print(isinstance(rex, Animal))  # True — Rex is also an Animal`,
    readMore: `Python supports multiple inheritance:
  class C(A, B): ...

Python resolves method order using MRO (Method Resolution Order) — the C3 linearisation.
You can inspect it: print(C.__mro__)

Multiple inheritance is powerful but can cause the "diamond problem".
Python solves it with MRO. super() always follows the MRO chain.

Abstract classes (like interfaces in C#):
  from abc import ABC, abstractmethod

  class Shape(ABC):
      @abstractmethod
      def area(self) -> float:
          ...

  class Circle(Shape):
      def area(self) -> float:
          return 3.14 * self.radius ** 2

You can't instantiate Shape directly — only concrete subclasses.`
  },
  {
    id: 14,
    priority: "extra",
    category: "OOP",
    question: "What are dunder (magic) methods in Python?",
    answer: "Dunder methods (double underscore) let you define how built-in operations work on your objects. __str__ = string representation for print(). __repr__ = debug representation. __len__ = len(). __eq__ = ==. __lt__ = <. __add__ = +. They're what makes Python's data model so consistent.",
    example: `class Vector:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __str__(self):
        return f"Vector({self.x}, {self.y})"

    def __repr__(self):
        return f"Vector(x={self.x}, y={self.y})"

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __eq__(self, other):
        return self.x == other.x and self.y == other.y

    def __len__(self):
        return 2   # a 2D vector has 2 components

v1 = Vector(1, 2)
v2 = Vector(3, 4)
print(v1 + v2)   # Vector(4, 6)
print(v1 == v2)  # False
print(len(v1))   # 2`
  },

  // === Error Handling ===
  {
    id: 15,
    priority: "core",
    category: "Error Handling",
    question: "How does exception handling work in Python?",
    answer: "Use try/except to catch exceptions. except ExceptionType catches specific types. else runs if no exception occurred. finally always runs (cleanup). raise re-raises or raises new exceptions. Be specific — never use bare except: without a type.",
    example: `try:
    result = 10 / 0
except ZeroDivisionError:
    print("can't divide by zero")
except (TypeError, ValueError) as e:
    print(f"bad input: {e}")
else:
    print("success!")   # only if no exception
finally:
    print("always runs") # cleanup: close files, DB connections

# Raising exceptions
def get_user(user_id):
    if user_id <= 0:
        raise ValueError(f"user_id must be positive, got {user_id}")
    return {"id": user_id}

# Custom exception
class NotFoundError(Exception):
    def __init__(self, resource, id_):
        super().__init__(f"{resource} with id {id_} not found")

raise NotFoundError("User", 42)`,
    readMore: `Exception hierarchy matters. Some common ones:
• Exception — base for most exceptions
• ValueError — wrong value type/range (e.g. int("abc"))
• TypeError — wrong type (e.g. "a" + 1)
• KeyError — dict key not found
• IndexError — list index out of range
• FileNotFoundError — file doesn't exist
• ZeroDivisionError — divide by zero
• AttributeError — object doesn't have that attribute

Best practices:
• Catch specific exceptions, not bare except:
• Don't use exceptions for normal control flow
• Use finally for cleanup (or use a context manager)
• Log the exception before re-raising it

The else block is underused but useful — it means "this code only runs when the try succeeded"`
  },

  // === Built-ins & Patterns ===
  {
    id: 16,
    priority: "core",
    category: "Built-ins",
    question: "What are some essential Python built-in functions you use regularly?",
    answer: "len(), range(), type(), isinstance(), print(), input(), int()/str()/float() for type conversion, enumerate() for index+value loops, zip() to pair iterables, sorted()/reversed(), min()/max(), sum(), any()/all(), map()/filter().",
    example: `# enumerate — index + value without manual counter
names = ["Alice", "Bob", "Charlie"]
for i, name in enumerate(names, start=1):
    print(f"{i}. {name}")

# zip — pair two lists
roles = ["admin", "editor", "viewer"]
pairs = list(zip(names, roles))
# [("Alice","admin"), ("Bob","editor"), ("Charlie","viewer")]

# any / all
scores = [85, 90, 72, 60]
print(any(s >= 90 for s in scores))   # True — at least one
print(all(s >= 60 for s in scores))   # True — all pass

# sorted with key
users = [{"name": "Zlatan", "age": 39}, {"name": "Marino", "age": 25}]
by_age = sorted(users, key=lambda u: u["age"])

# sum with generator
total = sum(s for s in scores if s >= 70)`,
    readMore: `enumerate is something beginners often overlook. Instead of:
  for i in range(len(names)):
      print(i, names[i])

Write:
  for i, name in enumerate(names):
      print(i, name)

zip stops at the shortest iterable. Use itertools.zip_longest if you need to pair unequal-length lists.

any()/all() short-circuit — they stop as soon as the answer is determined, just like and/or.

range() produces a lazy sequence. range(1_000_000) uses almost no memory because it doesn't create all 1M numbers at once.`
  },
  {
    id: 17,
    priority: "important",
    category: "Built-ins",
    question: "What is a context manager and how does 'with' work?",
    answer: "A context manager handles setup and teardown automatically. The with statement calls __enter__ on entry and __exit__ on exit (even if an exception occurs). Most commonly used for file handling, database connections, and locks.",
    example: `# Without context manager — risky
f = open("data.txt")
data = f.read()
f.close()   # might be skipped if an exception occurs

# With context manager — safe and clean
with open("data.txt") as f:
    data = f.read()
# f.close() called automatically, even if an error occurs

# Multiple context managers
with open("input.txt") as src, open("output.txt", "w") as dst:
    dst.write(src.read())

# Writing your own context manager
from contextlib import contextmanager

@contextmanager
def timer():
    import time
    start = time.time()
    yield
    print(f"Elapsed: {time.time() - start:.2f}s")

with timer():
    do_something_slow()`,
    readMore: `The with statement is Python's equivalent of C#'s using statement:
  using var conn = new SqlConnection(connStr); // C#
  with get_connection() as conn:               # Python

How it works:
1. Python calls __enter__ on the object → returns value bound to 'as' variable
2. Your code runs inside the with block
3. Python calls __exit__ whether or not an exception occurred
   — if there was an exception, __exit__ receives it and can suppress it

This guarantees cleanup happens, no matter what. It's the right way to manage resources.

Common built-in context managers:
• open() — files
• threading.Lock() — thread safety
• unittest.mock.patch() — testing mocks
• decimal.localcontext() — temporary decimal precision`
  },

  // === Python Specifics ===
  {
    id: 18,
    priority: "important",
    category: "Python Specifics",
    question: "How does Python handle scope? What is LEGB?",
    answer: "Python looks up variable names in this order: Local → Enclosing → Global → Built-in (LEGB). Local = current function. Enclosing = outer function (closures). Global = module level. Built-in = Python's built-ins (len, print, etc.). Use global or nonlocal to modify outer-scope variables.",
    example: `x = "global"

def outer():
    x = "enclosing"

    def inner():
        x = "local"
        print(x)   # "local" — Local scope wins

    inner()
    print(x)   # "enclosing"

outer()
print(x)   # "global"

# Modifying outer scope
count = 0
def increment():
    global count
    count += 1

# Modifying enclosing scope
def make_counter():
    count = 0
    def inc():
        nonlocal count
        count += 1
        return count
    return inc`,
    readMore: `Coming from JavaScript, Python scope works differently:
• No var/let/const — assignment creates a variable in the current scope
• No block scope (if/for/while don't create a new scope)
• Functions create a new scope

The nonlocal keyword is for closures — modifying a variable from the enclosing function.
Without it, assignment creates a new local variable instead of modifying the outer one.

Closures in Python:
  def multiplier(n):
      def multiply(x):
          return x * n    # 'n' is from the enclosing scope
      return multiply

  double = multiplier(2)
  triple = multiplier(3)
  print(double(5))  # 10
  print(triple(5))  # 15`
  },
  {
    id: 19,
    priority: "important",
    category: "Python Specifics",
    question: "What is duck typing in Python?",
    answer: "Duck typing means Python doesn't check an object's type — it checks if the object has the methods/attributes needed. If it walks like a duck and quacks like a duck, it's a duck. This enables flexible, polymorphic code without explicit interfaces.",
    example: `class Dog:
    def speak(self):
        return "Woof"

class Cat:
    def speak(self):
        return "Meow"

class Robot:
    def speak(self):
        return "BEEP BOOP"

def make_it_speak(thing):
    # No type check needed — just call speak()
    print(thing.speak())

make_it_speak(Dog())    # Woof
make_it_speak(Cat())    # Meow
make_it_speak(Robot())  # BEEP BOOP

# Works with any object that has a 'speak' method
# No inheritance or interface required`,
    readMore: `This is one of Python's biggest strengths for flexibility.
In C#/Java, you'd need an interface: ISpeakable with a speak() method,
and all classes would have to implement it.

In Python, you just call thing.speak() — if the object has it, great.
If not, you get an AttributeError at runtime.

Duck typing + EAFP (Easier to Ask Forgiveness than Permission):
Python culture prefers trying and catching exceptions over checking first.

LBYL (Look Before You Leap) — C# style:
  if (obj is ISomething s) { s.DoThing(); }

EAFP — Python style:
  try:
      obj.do_thing()
  except AttributeError:
      pass  # doesn't have it, move on`
  },
  {
    id: 20,
    priority: "extra",
    category: "Python Specifics",
    question: "What is the GIL in Python?",
    answer: "The GIL (Global Interpreter Lock) is a mutex in CPython that prevents multiple threads from executing Python bytecode simultaneously. This means Python threads don't achieve true parallelism for CPU-bound tasks. Use multiprocessing for CPU-bound parallelism, or asyncio for I/O-bound concurrency.",
    example: `# Threading — good for I/O-bound tasks (network, file)
import threading

def fetch(url):
    # waiting for network → thread can yield and let others run
    pass

threads = [threading.Thread(target=fetch, args=(u,)) for u in urls]
for t in threads: t.start()
for t in threads: t.join()

# Multiprocessing — good for CPU-bound tasks
from multiprocessing import Pool

def crunch(n):
    return sum(i**2 for i in range(n))

with Pool(processes=4) as pool:
    results = pool.map(crunch, [1_000_000, 2_000_000, 3_000_000])

# asyncio — good for many concurrent I/O tasks
import asyncio

async def fetch(session, url):
    async with session.get(url) as resp:
        return await resp.text()`,
    readMore: `The GIL is a CPython implementation detail (not in PyPy or Jython).

Why does it exist? CPython's memory management (reference counting) is not thread-safe.
The GIL is a simple way to prevent race conditions in the interpreter itself.

The practical impact:
• I/O-bound code (network, disk): threads work fine — GIL released while waiting for I/O
• CPU-bound code (math, parsing): threads don't help — use multiprocessing or C extensions

Python 3.13+ is working on making the GIL optional (experimental "free-threaded" mode).

Rule of thumb:
• Lots of waiting (API calls, DB queries) → asyncio or threads
• Heavy computation → multiprocessing
• Simple scripts → don't overthink it, just write sequential code`
  },
  {
    id: 21,
    priority: "extra",
    category: "Python Specifics",
    question: "What is PEP 8 and why does it matter?",
    answer: "PEP 8 is Python's official style guide. It defines conventions for code formatting: 4-space indentation, snake_case for variables/functions, PascalCase for classes, UPPER_CASE for constants, 79-character line limit, blank lines between functions/classes. Tools like flake8 and ruff enforce it automatically.",
    example: `# PEP 8 compliant
MAX_RETRIES = 3                     # constant

class UserProfile:                  # PascalCase class
    def __init__(self, first_name): # snake_case method/variable
        self.first_name = first_name

    def get_display_name(self):     # snake_case
        return self.first_name.title()

def fetch_user_by_id(user_id: int) -> dict:
    pass

# NOT PEP 8
class userProfile:   # should be UserProfile
    def GetName(self): # should be get_name
        pass

maxRetries = 3       # should be max_retries (camelCase is JS/C# style)`,
    readMore: `PEP = Python Enhancement Proposal. PEP 8 is the most important style PEP.

Key rules to remember for interviews:
• Indentation: 4 spaces (never tabs)
• snake_case for variables, functions, modules
• PascalCase (CapWords) for classes
• UPPER_SNAKE_CASE for constants
• Two blank lines between top-level definitions
• One blank line between methods inside a class
• Spaces around operators: x = a + b (not x=a+b)
• No trailing whitespace

Tools:
• ruff — very fast linter/formatter (replaces flake8 + black)
• black — opinionated auto-formatter
• isort — sorts imports automatically`
  },
]

export default pythonFlashcards
