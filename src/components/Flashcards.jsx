import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, Shuffle } from 'lucide-react';
import flashcards from '../data/flashcards';

const categories = ['All', ...new Set(flashcards.map(f => f.category))];

const priorityConfig = {
  core: { label: 'Core', description: 'WILL be asked', color: 'bg-red-600', border: 'border-red-500', count: flashcards.filter(f => f.priority === 'core').length },
  important: { label: 'Important', description: 'Likely to come up', color: 'bg-yellow-600', border: 'border-yellow-500', count: flashcards.filter(f => f.priority === 'important').length },
  extra: { label: 'Extra', description: 'Nice to know', color: 'bg-gray-600', border: 'border-gray-500', count: flashcards.filter(f => f.priority === 'extra').length },
};

export default function Flashcards() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('core');
  const [shuffled, setShuffled] = useState(false);
  const [shuffleOrder, setShuffleOrder] = useState([]);

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
    setCurrentIndex((prev) => (prev + 1) % filtered.length);
  };

  const handlePrev = () => {
    setShowAnswer(false);
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
    setCurrentIndex(0);
    setShowAnswer(false);
    setShuffled(false);
    setShuffleOrder([]);
  };

  const handlePriorityChange = (priority) => {
    setSelectedPriority(priority);
    setCurrentIndex(0);
    setShowAnswer(false);
    setShuffled(false);
    setShuffleOrder([]);
  };

  if (!card) return <div className="text-center text-gray-400 p-8">No cards match your filters.</div>;

  const priorityBadge = card.priority === 'core' ? 'bg-red-900 text-red-300 border border-red-700'
    : card.priority === 'important' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700'
    : 'bg-gray-700 text-gray-400 border border-gray-600';

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Priority filter — most prominent */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-gray-400 text-sm font-medium">Show:</span>
          <button
            onClick={() => handlePriorityChange('core')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              selectedPriority === 'core'
                ? 'bg-red-600 text-white ring-2 ring-red-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Core Only ({priorityConfig.core.count})
          </button>
          <button
            onClick={() => handlePriorityChange('important')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              selectedPriority === 'important'
                ? 'bg-yellow-600 text-white ring-2 ring-yellow-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            + Important ({priorityConfig.important.count})
          </button>
          <button
            onClick={() => handlePriorityChange('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              selectedPriority === 'all'
                ? 'bg-gray-500 text-white ring-2 ring-gray-400'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            All ({flashcards.length})
          </button>
        </div>
        <p className="text-gray-500 text-xs">
          {selectedPriority === 'core' && "These are what your friend said they'll ask: JOINs, WHERE, BETWEEN, aliases, FK, composites, normalization."}
          {selectedPriority === 'important' && "Core + likely follow-up questions. Good if you have time."}
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
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

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
        className={`bg-gray-800 rounded-xl p-8 min-h-[320px] flex flex-col cursor-pointer select-none border ${
          card.priority === 'core' ? 'border-red-800' : card.priority === 'important' ? 'border-yellow-800' : 'border-gray-700'
        }`}
        onClick={() => setShowAnswer(!showAnswer)}
      >
        {/* Question */}
        <h3 className="text-xl font-semibold text-white mb-4">{card.question}</h3>

        {/* Answer */}
        {showAnswer && (
          <div className="mt-4 flex-1 animate-fade-in">
            <p className="text-gray-200 mb-4 leading-relaxed">{card.answer}</p>
            {card.example && (
              <pre className="bg-gray-900 border border-gray-600 rounded-lg p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap">
                <code>{card.example}</code>
              </pre>
            )}
          </div>
        )}

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
          className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} /> Prev
        </button>

        <div className="flex gap-2">
          <button
            data-nav="flip"
            onClick={() => setShowAnswer(!showAnswer)}
            className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            {showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
            {showAnswer ? 'Hide' : 'Show'}
          </button>
          <button
            onClick={handleShuffle}
            className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            <Shuffle size={18} /> Shuffle
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw size={18} /> Reset
          </button>
        </div>

        <button
          data-nav="next"
          onClick={handleNext}
          className="flex items-center gap-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors cursor-pointer"
        >
          Next <ChevronRight size={18} />
        </button>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-gray-500 text-xs mt-4">
        Tip: Use arrow keys (← →) to navigate, Space to flip
      </p>
    </div>
  );
}
