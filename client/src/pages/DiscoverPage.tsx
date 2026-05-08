import { useState, useMemo } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type { ThemeDefinition } from '@/contexts/ThemeContext'
import { usePrompts } from '@/contexts/PromptsContext'
import { PRESET_PROMPTS, PRESET_CATEGORIES } from '@/data/presetPrompts'

export default function DiscoverPage() {
  const { theme } = useTheme()
  const { addPrompt, categories: userCategories, addCategory, prompts } = usePrompts()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const filtered = useMemo(() => {
    let result = PRESET_PROMPTS
    if (activeCategory) result = result.filter(p => p.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))
    }
    return result
  }, [activeCategory, search])

  const grouped = useMemo(() => {
    if (activeCategory || search.trim()) return null
    const groups: Record<string, typeof PRESET_PROMPTS> = {}
    for (const p of filtered) {
      if (!groups[p.category]) groups[p.category] = []
      groups[p.category].push(p)
    }
    return groups
  }, [filtered, activeCategory, search])

  const handleAdd = (preset: typeof PRESET_PROMPTS[0]) => {
    if (!userCategories.some(c => c.name === preset.category)) {
      addCategory(preset.category)
    }
    addPrompt(preset.title, preset.text, preset.category)
    setAddedIds(prev => new Set(prev).add(preset.id))
  }

  const isAlreadyInLibrary = (preset: typeof PRESET_PROMPTS[0]) => {
    return prompts.some(p => p.title === preset.title && p.text === preset.text)
  }

  return (
    <div>
      {/* Page header */}
      <div className="mb-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight mb-1" style={{ color: theme.text }}>
              Discover Prompts
            </h1>
            <p className="text-sm" style={{ color: theme.text2 }}>
              Browse {PRESET_PROMPTS.length}+ hand-picked prompts. Add them instantly to your library.
            </p>
          </div>
          <span
            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full mt-1"
            style={{ background: `${theme.accent}18`, color: theme.accent }}
          >
            {filtered.length} results
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: theme.text2 }}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search preset prompts..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none placeholder:opacity-40"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            color: theme.text,
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded"
            style={{ color: theme.text2 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <button
          onClick={() => setActiveCategory(null)}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
          style={
            activeCategory === null
              ? { background: theme.accent, color: '#fff', boxShadow: `0 2px 8px ${theme.accent}50` }
              : { background: theme.surface, color: theme.text2, border: `1px solid ${theme.border}` }
          }
        >
          All
        </button>
        {PRESET_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat === activeCategory ? null : cat)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
            style={
              activeCategory === cat
                ? { background: theme.accent, color: '#fff', boxShadow: `0 2px 8px ${theme.accent}50` }
                : { background: theme.surface, color: theme.text2, border: `1px solid ${theme.border}` }
            }
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${theme.accent}15` }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: theme.accent }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold mb-1" style={{ color: theme.text }}>No results</h3>
          <p className="text-sm" style={{ color: theme.text2 }}>Try a different search term or category.</p>
        </div>
      ) : grouped ? (
        <div className="space-y-10">
          {Object.entries(grouped).map(([cat, presets]) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.text2 }}>
                  {cat}
                </h2>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${theme.accent}15`, color: theme.accent }}
                >
                  {presets.length}
                </span>
                <div className="flex-1 h-px" style={{ background: theme.border }} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {presets.map(preset => <DiscoverCard key={preset.id} preset={preset} added={addedIds.has(preset.id) || isAlreadyInLibrary(preset)} onAdd={handleAdd} theme={theme} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(preset => (
            <DiscoverCard key={preset.id} preset={preset} added={addedIds.has(preset.id) || isAlreadyInLibrary(preset)} onAdd={handleAdd} theme={theme} />
          ))}
        </div>
      )}
    </div>
  )
}

function DiscoverCard({
  preset,
  added,
  onAdd,
  theme,
}: {
  preset: typeof PRESET_PROMPTS[0]
  added: boolean
  onAdd: (preset: typeof PRESET_PROMPTS[0]) => void
  theme: ThemeDefinition
}) {
  return (
    <div
      className="card-hover rounded-xl p-5 flex flex-col"
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}
    >
      <h3 className="text-base font-bold mb-2 leading-snug" style={{ color: theme.text }}>
        {preset.title}
      </h3>
      <p className="text-sm leading-relaxed mb-4 line-clamp-3 flex-1" style={{ color: theme.text2 }}>
        {preset.text}
      </p>

      <button
        onClick={() => !added && onAdd(preset)}
        disabled={added}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors disabled:cursor-default"
        style={
          added
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
}
