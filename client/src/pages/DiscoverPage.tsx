import { useState, useMemo } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { usePrompts } from '../contexts/PromptsContext'
import { PRESET_PROMPTS, PRESET_CATEGORIES } from '../data/presetPrompts'

export default function DiscoverPage() {
  const { theme } = useTheme()
  const { addPrompt, categories: userCategories, addCategory, prompts } = usePrompts()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = PRESET_PROMPTS
    if (activeCategory) {
      result = result.filter(p => p.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))
    }
    return result
  }, [activeCategory, search])

  const handleAdd = (preset: typeof PRESET_PROMPTS[0]) => {
    // Ensure category exists in user's library
    if (!userCategories.some(c => c.name === preset.category)) {
      addCategory(preset.category)
    }
    addPrompt(preset.title, preset.text, preset.category)
    setAddedIds(prev => new Set(prev).add(preset.id))
  }

  const isAlreadyInLibrary = (preset: typeof PRESET_PROMPTS[0]) => {
    return prompts.some(p => p.title === preset.title && p.text === preset.text)
  }

  const pillStyle = (active: boolean) => active
    ? { background: theme.accent, color: '#fff' }
    : { background: theme.surface, color: theme.text2, border: `1px solid ${theme.border}` }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-1" style={{ color: theme.text }}>Discover Prompts</h1>
        <p className="text-sm" style={{ color: theme.text2 }}>Browse pre-made prompts and add them to your library.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
            style={pillStyle(activeCategory === null)}
          >
            All
          </button>
          {PRESET_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
              className="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
              style={pillStyle(activeCategory === cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.text2 }} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search presets..."
            className="w-full sm:w-56 pl-9 pr-3 py-2 text-sm rounded-md outline-none placeholder:text-gray-400"
            style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
          />
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs mb-4" style={{ color: theme.text2 }}>
        {filtered.length} {filtered.length === 1 ? 'prompt' : 'prompts'} {activeCategory ? `in ${activeCategory}` : 'available'}
      </p>

      {/* Prompt cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: theme.text2 }}>No prompts match your search.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(preset => {
            const added = addedIds.has(preset.id) || isAlreadyInLibrary(preset)
            return (
              <div
                key={preset.id}
                className="rounded-lg p-4 shadow-sm"
                style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${theme.accent}18`, color: theme.accent }}>
                    {preset.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: theme.text }}>{preset.title}</h3>
                <p className="text-sm whitespace-pre-wrap break-words mb-3 line-clamp-3" style={{ color: theme.text2 }}>
                  {preset.text}
                </p>
                <button
                  onClick={() => !added && handleAdd(preset)}
                  disabled={added}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:cursor-default"
                  style={added
                    ? { background: '#dcfce7', color: '#15803d' }
                    : { background: theme.surface2, color: theme.text2 }
                  }
                >
                  {added ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Added
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Add to Library
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
