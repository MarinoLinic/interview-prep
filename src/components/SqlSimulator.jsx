import { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, ChevronLeft, ChevronRight, Lightbulb, CheckCircle, XCircle, Database, Sparkles } from 'lucide-react';
import initSqlJs from 'sql.js';
import challenges, { setupSQL } from '../data/challenges';
import { convertLinqToSql } from '../utils/linqToSql';

const categories = ['All', ...new Set(challenges.map(c => c.category))];

export default function SqlSimulator({ syntaxMode = 'sql' }) {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [linqDraft, setLinqDraft] = useState('');
  const [results, setResults] = useState(null);
  const [queryError, setQueryError] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [passed, setPassed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [completedChallenges, setCompletedChallenges] = useState(new Set());
  const [freeMode, setFreeMode] = useState(false);
  const textareaRef = useRef(null);

  const filtered = selectedCategory === 'All'
    ? challenges
    : challenges.filter(c => c.category === selectedCategory);

  const challenge = filtered[currentChallenge];

  // Initialize sql.js
  useEffect(() => {
    async function initDb() {
      try {
        const SQL = await initSqlJs({
          locateFile: () => '/sql-wasm.wasm'
        });
        const database = new SQL.Database();
        database.run(setupSQL);
        setDb(database);
        setLoading(false);
      } catch (err) {
        setError(`Failed to load SQL engine: ${err.message}`);
        setLoading(false);
      }
    }
    initDb();
  }, []);

  // Reset DB
  const resetDb = async () => {
    if (db) db.close();
    try {
      const SQL = await initSqlJs({
        locateFile: () => '/sql-wasm.wasm'
      });
      const database = new SQL.Database();
      database.run(setupSQL);
      setDb(database);
      setResults(null);
      setQueryError(null);
      setPassed(false);
    } catch (err) {
      setError(`Failed to reset: ${err.message}`);
    }
  };

  const runQuery = () => {
    if (!db || !query.trim()) return;
    setQueryError(null);
    setResults(null);
    setPassed(false);

    try {
      const res = db.exec(query);
      if (res.length > 0) {
        const columns = res[0].columns;
        const rows = res[0].values.map(row => {
          const obj = {};
          columns.forEach((col, i) => { obj[col] = row[i]; });
          return obj;
        });
        setResults({ columns, rows });

        // Validate if in challenge mode
        if (!freeMode && challenge && challenge.validateResult) {
          const isCorrect = challenge.validateResult(rows);
          setPassed(isCorrect);
          if (isCorrect) {
            setCompletedChallenges(prev => new Set([...prev, challenge.id]));
          }
        }
      } else {
        setResults({ columns: [], rows: [] });
      }
    } catch (err) {
      setQueryError(err.message);
    }
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      runQuery();
    }
  };

  const goToChallenge = (direction) => {
    const next = direction === 'next'
      ? (currentChallenge + 1) % filtered.length
      : (currentChallenge - 1 + filtered.length) % filtered.length;
    setCurrentChallenge(next);
    setQuery('');
    setLinqDraft('');
    setResults(null);
    setQueryError(null);
    setShowHint(false);
    setShowSolution(false);
    setPassed(false);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentChallenge(0);
    setQuery('');
    setLinqDraft('');
    setResults(null);
    setQueryError(null);
    setShowHint(false);
    setShowSolution(false);
    setPassed(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400 flex items-center gap-2">
          <Database className="animate-pulse" size={20} />
          Loading SQL engine (sql.js WASM)...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center p-8">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      {/* Mode toggle */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFreeMode(false)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              !freeMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Challenges ({completedChallenges.size}/{challenges.length})
          </button>
          <button
            onClick={() => setFreeMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              freeMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Free Mode
          </button>
        </div>
        <button
          onClick={resetDb}
          className="flex items-center gap-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
        >
          <RotateCcw size={14} /> Reset DB
        </button>
      </div>

      {/* Challenge mode */}
      {!freeMode && (
        <>
          {/* Category filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleCategoryChange(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Challenge info */}
          {challenge && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                    challenge.difficulty === 'Easy' ? 'bg-green-900 text-green-300' :
                    challenge.difficulty === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-red-900 text-red-300'
                  }`}>
                    {challenge.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">{challenge.category}</span>
                  {syntaxMode === 'linq' && (
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-900 text-purple-300 border border-purple-700">
                      LINQ mode
                    </span>
                  )}
                  {completedChallenges.has(challenge.id) && (
                    <CheckCircle size={16} className="text-green-400" />
                  )}
                </div>
                <span className="text-gray-400 text-sm">
                  {currentChallenge + 1} / {filtered.length}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{challenge.title}</h3>
              <p className="text-gray-300">{challenge.description}</p>

              {/* Hint & Solution */}
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-yellow-400 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  <Lightbulb size={14} /> {showHint ? 'Hide Hint' : 'Show Hint'}
                </button>
                <button
                  onClick={() => setShowSolution(!showSolution)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-orange-400 rounded-lg text-sm transition-colors cursor-pointer"
                >
                  {showSolution ? 'Hide Solution' : 'Show Solution'}
                </button>
              </div>

              {showHint && (
                <p className="mt-3 text-yellow-300 text-sm bg-yellow-950 border border-yellow-800 rounded-lg p-3">
                  {syntaxMode === 'linq' && challenge.linqHint ? challenge.linqHint : challenge.hint}
                </p>
              )}
              {showSolution && (
                <pre className={`mt-3 text-sm rounded-lg p-3 overflow-x-auto whitespace-pre-wrap ${
                  syntaxMode === 'linq' ? 'text-purple-300 bg-purple-950 border border-purple-800' : 'text-orange-300 bg-orange-950 border border-orange-800'
                }`}>
                  <code>{syntaxMode === 'linq' && challenge.linqExpectedQuery ? challenge.linqExpectedQuery : challenge.expectedQuery}</code>
                </pre>
              )}

              {/* Schema reference (collapsible) */}
              <details className="mt-4">
                <summary className="text-gray-400 text-xs cursor-pointer hover:text-gray-300 select-none">
                  Available tables & columns
                </summary>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-300 mt-2">
                  <div className="bg-gray-900 rounded-lg p-2">
                    <span className="text-blue-400 font-medium text-xs">customers</span>
                    <p className="text-gray-500 text-xs">id, name, email, city</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-2">
                    <span className="text-blue-400 font-medium text-xs">orders</span>
                    <p className="text-gray-500 text-xs">id, customer_id (FK), total, status</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-2">
                    <span className="text-blue-400 font-medium text-xs">products</span>
                    <p className="text-gray-500 text-xs">id, name, price, category</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-2">
                    <span className="text-blue-400 font-medium text-xs">order_items</span>
                    <p className="text-gray-500 text-xs">order_id, product_id (PK), quantity</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-2">
                    <span className="text-blue-400 font-medium text-xs">enrollments</span>
                    <p className="text-gray-500 text-xs">student_id, course_id, semester (PK), grade</p>
                  </div>
                </div>
              </details>

              {/* Navigation */}
              <div className="flex justify-between mt-4">
                <button
                  onClick={() => goToChallenge('prev')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  onClick={() => goToChallenge('next')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors cursor-pointer"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Free mode schema info */}
      {freeMode && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
          <h3 className="text-white font-medium mb-2">Available Tables</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-gray-300">
            <div className="bg-gray-900 rounded-lg p-3">
              <span className="text-blue-400 font-medium">customers</span>
              <p className="text-gray-500 text-xs mt-1">id, name, email, city</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <span className="text-blue-400 font-medium">orders</span>
              <p className="text-gray-500 text-xs mt-1">id, customer_id (FK), total, status</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <span className="text-blue-400 font-medium">products</span>
              <p className="text-gray-500 text-xs mt-1">id, name, price, category</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <span className="text-blue-400 font-medium">order_items</span>
              <p className="text-gray-500 text-xs mt-1">order_id, product_id (composite PK), quantity</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <span className="text-blue-400 font-medium">enrollments</span>
              <p className="text-gray-500 text-xs mt-1">student_id, course_id, semester (composite PK), grade</p>
            </div>
          </div>
        </div>
      )}

      {/* LINQ Scratchpad — only shown in LINQ mode */}
      {syntaxMode === 'linq' && (
        <div className="bg-gray-900 border border-purple-800/60 rounded-xl overflow-hidden mb-4">
          <div className="px-4 py-3 bg-purple-950/70 border-b border-purple-800/60">
            <div className="flex items-center justify-between">
              <span className="text-purple-300 text-sm font-medium">① Write LINQ here (C#)</span>
              <span className="text-purple-500 text-xs">practice only — not executed</span>
            </div>
            <p className="text-purple-400/80 text-xs mt-1">
              Write LINQ, then click "Convert to SQL" or translate manually below.
            </p>
          </div>
          <textarea
            value={linqDraft}
            onChange={(e) => setLinqDraft(e.target.value)}
            placeholder="e.g. customers.Join(orders, customer => customer.Id, order => order.CustomerId, (customer, order) => new { customer.Name, order.Total });"
            className="w-full bg-gray-900 text-purple-300 font-mono text-sm p-4 min-h-[100px] resize-y focus:outline-none placeholder-gray-600"
            spellCheck={false}
          />
          <div className="px-4 py-2 bg-purple-950/40 border-t border-purple-800/40 flex items-center gap-3">
            <button
              onClick={() => {
                const sql = convertLinqToSql(linqDraft);
                if (sql) setQuery(sql);
                else setQueryError('Could not convert — try translating manually. This converter only handles simple patterns.');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-700/60 hover:bg-purple-600/60 text-purple-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles size={13} /> Convert to SQL
            </button>
            <span className="text-purple-600 text-xs">Approximate — may need manual fixes</span>
          </div>
        </div>
      )}

      {/* SQL Editor */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-gray-400 text-sm font-medium">
            {syntaxMode === 'linq' ? '② Verify with SQL (runs here)' : 'SQL Query'}
          </span>
          <span className="text-gray-500 text-xs">
            {syntaxMode === 'linq' ? 'Translate your LINQ to SQL — Ctrl+Enter to run' : 'Ctrl+Enter to run'}
          </span>
        </div>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your SQL query here..."
          className="w-full bg-gray-900 text-green-400 font-mono text-sm p-4 min-h-[120px] resize-y focus:outline-none placeholder-gray-600"
          spellCheck={false}
        />
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 border-t border-gray-700">
          <button
            onClick={runQuery}
            className="flex items-center gap-1 px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors cursor-pointer"
          >
            <Play size={14} /> Run SQL
          </button>
          {passed && (
            <span className="flex items-center gap-1 text-green-400 text-sm font-medium">
              <CheckCircle size={16} /> Correct!
            </span>
          )}
        </div>
      </div>

      {/* Results */}
      {queryError && (
        <div className="mt-4 bg-red-950 border border-red-800 rounded-xl p-4 flex items-start gap-2">
          <XCircle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <pre className="text-red-300 text-sm whitespace-pre-wrap">{queryError}</pre>
        </div>
      )}

      {results && (
        <div className="mt-4 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
          <div className="px-4 py-2 bg-gray-750 border-b border-gray-700">
            <span className="text-gray-400 text-sm">
              {results.rows.length} row{results.rows.length !== 1 ? 's' : ''} returned
            </span>
          </div>
          {results.rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    {results.columns.map((col, i) => (
                      <th key={i} className="px-4 py-2 text-left text-gray-300 font-medium bg-gray-800">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.rows.map((row, i) => (
                    <tr key={i} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                      {results.columns.map((col, j) => (
                        <td key={j} className="px-4 py-2 text-gray-200 font-mono">
                          {row[col] === null ? <span className="text-gray-500 italic">NULL</span> : String(row[col])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm p-4">Query executed successfully (no rows returned).</p>
          )}
        </div>
      )}
    </div>
  );
}
