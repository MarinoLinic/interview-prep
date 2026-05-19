import { useState, useEffect } from 'react'
import { BookOpen, Terminal, ToggleLeft, ToggleRight } from 'lucide-react'
import Flashcards from './components/Flashcards'
import SqlSimulator from './components/SqlSimulator'
import './App.css'

function App() {
  const [tab, setTab] = useState('flashcards')
  const [syntaxMode, setSyntaxMode] = useState('sql') // 'sql' or 'linq'

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (tab === 'flashcards') {
        if (e.key === 'ArrowRight') {
          document.querySelector('[data-nav="next"]')?.click()
        } else if (e.key === 'ArrowLeft') {
          document.querySelector('[data-nav="prev"]')?.click()
        } else if (e.key === ' ' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
          e.preventDefault()
          document.querySelector('[data-nav="flip"]')?.click()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [tab])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">
            SQL Interview Prep
          </h1>
          <div className="flex items-center gap-4">
            {/* SQL / LINQ toggle */}
            <button
              onClick={() => setSyntaxMode(syntaxMode === 'sql' ? 'linq' : 'sql')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border ${
                syntaxMode === 'linq'
                  ? 'bg-purple-900 border-purple-500 text-purple-200'
                  : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
              }`}
            >
              {syntaxMode === 'linq' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              {syntaxMode === 'sql' ? 'SQL' : 'LINQ (C#)'}
            </button>

            {/* Tab buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setTab('flashcards')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  tab === 'flashcards'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <BookOpen size={16} />
                Flashcards
              </button>
              <button
                onClick={() => setTab('simulator')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  tab === 'simulator'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Terminal size={16} />
                SQL Simulator
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-8">
        {tab === 'flashcards' && <Flashcards syntaxMode={syntaxMode} />}
        {tab === 'simulator' && <SqlSimulator />}
      </main>
    </div>
  )
}

export default App
