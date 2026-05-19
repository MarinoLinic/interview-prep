import { useState, useEffect } from 'react'
import { BookOpen, Terminal, ToggleLeft, ToggleRight, Database, Code2, Globe, HelpCircle } from 'lucide-react'
import Flashcards from './components/Flashcards'
import SqlSimulator from './components/SqlSimulator'
import sqlFlashcards from './data/flashcards'
import csharpFlashcards from './data/csharpFlashcards'
import dotnetFlashcards from './data/dotnetFlashcards'
import generalFlashcards from './data/generalFlashcards'
import './App.css'

const tabs = [
  { id: 'sql',       label: 'SQL & LINQ',     icon: Database,   isFlashcard: true },
  { id: 'simulator', label: 'SQL Simulator',   icon: Terminal,   isFlashcard: false },
  { id: 'csharp',    label: 'C#',             icon: Code2,      isFlashcard: true },
  { id: 'dotnet',    label: '.NET',            icon: Globe,      isFlashcard: true },
  { id: 'general',   label: 'Interview',       icon: HelpCircle, isFlashcard: true },
]

function App() {
  const [tab, setTab] = useState(() => localStorage.getItem('app_tab') || 'sql')
  const [syntaxMode, setSyntaxMode] = useState(() => localStorage.getItem('app_syntaxMode') || 'sql')

  const handleSetTab = (t) => { setTab(t); localStorage.setItem('app_tab', t); }
  const handleSetSyntaxMode = (m) => { setSyntaxMode(m); localStorage.setItem('app_syntaxMode', m); }

  const currentTab = tabs.find(t => t.id === tab) || tabs[0]
  const isFlashcardTab = currentTab.isFlashcard

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isFlashcardTab) {
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
  }, [isFlashcardTab])

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3 sm:mb-0">
            <h1 className="text-lg font-bold text-white whitespace-nowrap">
              Interview Prep
            </h1>

            {/* SQL / LINQ toggle — only show on SQL-related tabs */}
            {(tab === 'sql' || tab === 'simulator') && (
              <button
                onClick={() => handleSetSyntaxMode(syntaxMode === 'sql' ? 'linq' : 'sql')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer border sm:ml-4 ${
                  syntaxMode === 'linq'
                    ? 'bg-purple-900/70 border-purple-600/60 text-purple-200'
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500'
                }`}
              >
                {syntaxMode === 'linq' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                <span className="hidden sm:inline">{syntaxMode === 'sql' ? 'SQL' : 'LINQ (C#)'}</span>
                <span className="sm:hidden">{syntaxMode === 'sql' ? 'SQL' : 'LINQ'}</span>
              </button>
            )}
          </div>

          {/* Tab buttons — scrollable on mobile */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mb-1 scrollbar-hide">
            {tabs.map(t => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => handleSetTab(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    tab === t.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-6 sm:py-8">
        {tab === 'sql' && <Flashcards data={sqlFlashcards} syntaxMode={syntaxMode} storagePrefix="fc_sql" />}
        {tab === 'simulator' && <SqlSimulator syntaxMode={syntaxMode} />}
        {tab === 'csharp' && <Flashcards data={csharpFlashcards} storagePrefix="fc_cs" />}
        {tab === 'dotnet' && <Flashcards data={dotnetFlashcards} storagePrefix="fc_net" />}
        {tab === 'general' && <Flashcards data={generalFlashcards} storagePrefix="fc_gen" />}
      </main>
    </div>
  )
}

export default App
