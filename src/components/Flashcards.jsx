import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, Shuffle, Copy, Check, BookOpen } from 'lucide-react';

export default function Flashcards({ data = [], syntaxMode = 'sql', storagePrefix = 'fc' }) {
  const flashcards = data;
  const categories = useMemo(() => ['All', ...new Set(flashcards.map(f => f.category))], [flashcards]);
  const priorityConfig = useMemo(() => ({
    core: { count: flashcards.filter(f => f.priority === 'core').length },
    important: { count: flashcards.filter(f => f.priority === 'important').length },
    extra: { count: flashcards.filter(f => f.priority === 'extra').length },
  }), [flashcards]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(() => localStorage.getItem(`${storagePrefix}_category`) || 'All');
  const [selectedPriority, setSelectedPriority] = useState(() => localStorage.getItem(`${storagePrefix}_priority`) || 'core');
  const [shuffled, setShuffled] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([]);
  const [copied, setCopied] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const filtered = useMemo(() => {
    let base = flashcards;
    if (selectedCategory !== 'All') {
      base = base.filter(f => f.category === selectedCategory);
    }
    if (selectedPriority !== 'all') {
      const levels = selectedPriority === 'core' ? ['core']
        : selectedPriority === 'important' ? ['core', 'important']
        : ['core', 'important', 'extra'];
      base = base.filter(f => levels.includes(f.priority));
    }
    if (shuffled && shuffleOrder.length > 0) {
      return shuffleOrder.map(i => base[i]).filter(Boolean);
    }
    return base;
  }, [selectedCategory, selectedPriority, shuffled, shuffleOrder]);

  const card = filtered[currentIndex];

  const handleNext = () => {
    setShowAnswer(false);
    setShowReadMore(false);
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
  };

  const handlePrev = () => {
    setShowAnswer(false);
    setShowReadMore(false);
    setCurrentIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
  };

  const handleShuffle = () => {
    const indices = Array.from({ length: filtered.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setShuffleOrder(indices);
    setShuffled(true);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const handleReset = () => {
    setShuffled(false);
    setShuffleOrder([]);
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    localStorage.setItem(`${storagePrefix}_category`, cat);
    setCurrentIndex(0);
    setShowAnswer(false);
    setShuffled(false);
    setShuffleOrder([]);
  };

  const handlePriorityChange = (priority) => {
    setSelectedPriority(priority);
    localStorage.setItem(`${storagePrefix}_priority`, priority);
    setCurrentIndex(0);
    setShowAnswer(false);
    setShuffled(false);
    setShuffleOrder([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Priority filter — most prominent */}
      <div className="mb-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="text-gray-400 text-sm font-medium">Show:</span>
          <button
            onClick={() => handlePriorityChange('core')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              selectedPriority === 'core'
                ? 'bg-amber-600 text-white ring-2 ring-amber-400/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Core Only ({priorityConfig.core.count})
          </button>
          <button
            onClick={() => handlePriorityChange('important')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              selectedPriority === 'important'
                ? 'bg-sky-600 text-white ring-2 ring-sky-400/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            + Important ({priorityConfig.important.count})
          </button>
          <button
            onClick={() => handlePriorityChange('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              selectedPriority === 'all'
                ? 'bg-gray-500 text-white ring-2 ring-gray-400/50'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({flashcards.length})
          </button>
        </div>
        <p className="text-gray-500 text-xs">
          {selectedPriority === 'core' && "Core topics — most likely to be asked."}
          {selectedPriority === 'important' && "Core + important follow-ups. Study these if you have time."}
          {selectedPriority === 'all' && "Everything including extras. Only if you've nailed the core."}
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700/70 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Empty state — filters still visible above */}
      {!card && (
        <div className="text-center text-gray-400 py-16 bg-gray-800 rounded-xl border border-gray-700">
          <p className="text-lg mb-2">No cards match these filters.</p>
          <p className="text-sm text-gray-500">Try selecting a broader priority above, or switching to "All" categories.</p>
        </div>
      )}

      {/* Card + controls — only when there are results */}
      {card && (() => {
        const priorityBadge = card.priority === 'core' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/50'
          : card.priority === 'important' ? 'bg-sky-900/60 text-sky-300 border border-sky-700/50'
          : 'bg-gray-700/60 text-gray-400 border border-gray-600/50';

        return (
          <>
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">
                Card {currentIndex + 1} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded ${priorityBadge}`}>
                  {card.priority}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                  {card.category}
                </span>
              </div>
            </div>

            {/* Card */}
            <div
              className={`bg-gray-800 rounded-xl p-4 sm:p-8 min-h-[250px] sm:min-h-[320px] flex flex-col cursor-pointer select-none border ${
                card.priority === 'core' ? 'border-amber-800/50' : card.priority === 'important' ? 'border-sky-800/50' : 'border-gray-700'
              }`}
              onClick={() => setShowAnswer(!showAnswer)}
            >
              <h3 className="text-xl font-semibold text-white mb-4">{card.question}</h3>

              {showAnswer && (() => {
                const useLinq = syntaxMode === 'linq' && card.linqAnswer;
                const answer = useLinq ? card.linqAnswer : card.answer;
                const example = useLinq ? card.linqExample : card.example;
                const codeColor = useLinq ? 'text-purple-300' : 'text-emerald-300';
                const codeBg = useLinq ? 'bg-purple-950/50 border-purple-800/50' : 'bg-gray-900 border-gray-700';
                return (
                  <div className="mt-4 flex-1 animate-fade-in">
                    {useLinq && (
                      <span className="inline-block text-xs px-2 py-0.5 mb-3 rounded bg-purple-900/60 text-purple-300 border border-purple-700/50">
                        LINQ / C#
                      </span>
                    )}
                    {!useLinq && syntaxMode === 'linq' && !card.linqAnswer && (
                      <span className="inline-block text-xs px-2 py-0.5 mb-3 rounded bg-gray-700/60 text-gray-400">
                        No LINQ equivalent (theory)
                      </span>
                    )}
                    <div className="relative group/answer mb-4">
                      <p className="text-gray-200 leading-relaxed pr-10">{answer}</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleCopy(answer); }}
                        className="absolute top-0 right-0 p-1.5 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-300 opacity-0 group-hover/answer:opacity-100 transition-opacity cursor-pointer"
                        title="Copy answer"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                    {example && (
                      <div className="relative group">
                        <pre className={`border rounded-lg p-4 pr-12 text-sm ${codeColor} ${codeBg} overflow-x-auto whitespace-pre-wrap`}>
                          <code>{example}</code>
                        </pre>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCopy(example); }}
                          className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Copy code"
                        >
                          {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                    {card.readMore && (
                      <div className="mt-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowReadMore(!showReadMore); }}
                          className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                        >
                          <BookOpen size={14} />
                          {showReadMore ? 'Hide explanation' : 'Explain like I\'m a beginner'}
                        </button>
                        {showReadMore && (
                          <div className="relative group/readmore mt-3 p-4 pr-10 bg-blue-950/30 border border-blue-900/40 rounded-lg text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {card.readMore}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCopy(card.readMore); }}
                              className="absolute top-2 right-2 p-1.5 rounded-md bg-gray-700/80 hover:bg-gray-600 text-gray-300 opacity-0 group-hover/readmore:opacity-100 transition-opacity cursor-pointer"
                              title="Copy explanation"
                            >
                              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {!showAnswer && (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500 italic">Click to reveal answer</p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6">
              <button
                data-nav="prev"
                onClick={handlePrev}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer text-sm"
              >
                <ChevronLeft size={16} /> <span className="hidden sm:inline">Prev</span>
              </button>
              <div className="flex gap-1.5 sm:gap-2">
                <button
                  data-nav="flip"
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer text-sm"
                >
                  {showAnswer ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="hidden sm:inline">{showAnswer ? 'Hide' : 'Show'}</span>
                </button>
                <button
                  onClick={handleShuffle}
                  className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer text-sm"
                >
                  <Shuffle size={16} /> <span className="hidden sm:inline">Shuffle</span>
                </button>
                <button
                  onClick={handleReset}
                  className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer text-sm"
                >
                  <RotateCcw size={16} /> <span className="hidden sm:inline">Reset</span>
                </button>
              </div>
              <button
                data-nav="next"
                onClick={handleNext}
                className="flex items-center gap-1 px-3 sm:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer text-sm"
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight size={16} />
              </button>
            </div>

            <p className="text-center text-gray-500 text-xs mt-4">
              Tip: Use arrow keys (← →) to navigate, Space to flip
            </p>
          </>
        );
      })()}
    </div>
  );
}
