import { useState, useMemo } from 'react'
import { usePrompts } from '@/contexts/PromptsContext'
import { useTheme } from '@/contexts/ThemeContext'
import PromptCard from '@/components/PromptCard'
import NewPromptForm from '@/components/NewPromptForm'

function SkeletonCard({ theme }: { theme: { surface: string; border: string } }) {
  return (
    <div className="rounded-xl p-5" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
      <div className="skeleton h-5 w-20 mb-4" />
      <div className="skeleton h-5 w-3/4 mb-2" />
      <div className="skeleton h-4 w-full mb-1.5" />
      <div className="skeleton h-4 w-5/6 mb-1.5" />
      <div className="skeleton h-4 w-2/3 mb-4" />
      <div className="skeleton h-9 w-full" />
    </div>
  )
}

export default function FrontPage() {
  const { prompts, categories, loading, addCategory, deleteCategory, renameCategory } = usePrompts()
  const { theme, cardView } = useTheme()
  const [showNew, setShowNew] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [managingCategories, setManagingCategories] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [addCatError, setAddCatError] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')

  const filtered = useMemo(() => {
    let result = prompts
    if (activeCategory) result = result.filter(p => p.category === activeCategory)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))
    }
    return result
  }, [prompts, activeCategory, search])

  const grouped = useMemo(() => {
    if (cardView !== 'grouped' || activeCategory || search.trim()) return null
    const groups: Record<string, typeof prompts> = {}
    for (const p of filtered) {
      if (!groups[p.category]) groups[p.category] = []
      groups[p.category].push(p)
    }
    return groups
  }, [filtered, cardView, activeCategory, search])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setAddCatError('')
    const result = await addCategory(newCatName.trim())
    if (result) {
      setNewCatName('')
    } else {
      setAddCatError('Failed to add category. Is the server running?')
    }
  }

  const handleRename = (id: string) => {
    if (editCatName.trim()) renameCategory(id, editCatName.trim())
    setEditingCatId(null)
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.text }}>
            Your Library
          </h1>
          {!loading && (
            <p className="text-sm mt-0.5" style={{ color: theme.text2 }}>
              {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} saved
            </p>
          )}
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 shadow-lg"
          style={{ background: theme.gradient, boxShadow: `0 4px 14px ${theme.accent}40` }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Prompt
        </button>
      </div>

      {/* Search + category filter row */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Search bar */}
        <div className="relative">
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
            placeholder="Search prompts..."
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
        <div className="flex items-center gap-2 flex-wrap">
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
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.name === activeCategory ? null : c.name)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all"
              style={
                activeCategory === c.name
                  ? { background: theme.accent, color: '#fff', boxShadow: `0 2px 8px ${theme.accent}50` }
                  : { background: theme.surface, color: theme.text2, border: `1px solid ${theme.border}` }
              }
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={() => setManagingCategories(!managingCategories)}
            className="p-1.5 rounded-lg transition-all"
            style={{
              color: managingCategories ? theme.accent : theme.text2,
              background: managingCategories ? `${theme.accent}15` : 'transparent',
            }}
            title="Manage categories"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Category management panel */}
      {managingCategories && (
        <div
          className="mb-6 rounded-xl overflow-hidden"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text2 }}>
              Manage Categories
            </p>
          </div>
          {categories.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-3"
              style={i > 0 ? { borderTop: `1px solid ${theme.border}` } : {}}
            >
              {editingCatId === c.id ? (
                <input
                  value={editCatName}
                  onChange={e => setEditCatName(e.target.value)}
                  onBlur={() => handleRename(c.id)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(c.id)}
                  autoFocus
                  className="text-sm px-3 py-1.5 rounded-lg outline-none"
                  style={{
                    border: `1px solid ${theme.accent}`,
                    background: theme.surface2,
                    color: theme.text,
                  }}
                />
              ) : (
                <span className="text-sm font-medium" style={{ color: theme.text }}>{c.name}</span>
              )}
              <div className="flex items-center gap-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-md font-medium"
                  style={{ background: theme.surface2, color: theme.text2 }}
                >
                  {prompts.filter(p => p.category === c.name).length}
                </span>
                <button
                  onClick={() => { setEditingCatId(c.id); setEditCatName(c.name) }}
                  className="p-1.5 rounded-md transition-colors hover:opacity-80"
                  style={{ color: theme.text2 }}
                  title="Rename"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                {categories.length > 1 && (
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="p-1.5 rounded-md transition-colors hover:text-red-500"
                    style={{ color: theme.text2 }}
                    title="Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
          <form
            onSubmit={handleAddCategory}
            className="flex flex-col gap-1.5 px-4 py-3"
            style={{ borderTop: `1px solid ${theme.border}` }}
          >
            <div className="flex items-center gap-2">
              <input
                value={newCatName}
                onChange={e => { setNewCatName(e.target.value); setAddCatError('') }}
                placeholder="New category name..."
                className="flex-1 text-sm px-3 py-2 rounded-lg outline-none placeholder:opacity-40"
                style={{
                  background: theme.surface2,
                  border: `1px solid ${addCatError ? '#ef4444' : theme.border}`,
                  color: theme.text,
                }}
              />
              <button
                type="submit"
                disabled={!newCatName.trim()}
                className="px-4 py-2 text-sm font-semibold rounded-lg text-white disabled:opacity-40 transition-opacity"
                style={{ background: theme.gradient }}
              >
                Add
              </button>
            </div>
            {addCatError && <p className="text-xs text-red-500">{addCatError}</p>}
          </form>
        </div>
      )}

      {/* Prompt cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <SkeletonCard key={i} theme={theme} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${theme.accent}15` }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: theme.accent }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-base font-bold mb-2" style={{ color: theme.text }}>
            {prompts.length === 0 ? 'Your library is empty' : 'No prompts found'}
          </h3>
          <p className="text-sm mb-6" style={{ color: theme.text2 }}>
            {prompts.length === 0
              ? 'Add your first prompt to get started'
              : 'Try a different search or category'}
          </p>
          {prompts.length === 0 && (
            <button
              onClick={() => setShowNew(true)}
              className="px-6 py-3 text-sm font-semibold rounded-xl text-white transition-opacity hover:opacity-90 shadow-lg"
              style={{ background: theme.gradient, boxShadow: `0 4px 14px ${theme.accent}40` }}
            >
              Add Your First Prompt
            </button>
          )}
        </div>
      ) : grouped ? (
        <div className="space-y-10">
          {Object.entries(grouped).map(([cat, prompts]) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.text2 }}>
                  {cat}
                </h2>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${theme.accent}15`, color: theme.accent }}
                >
                  {prompts.length}
                </span>
                <div className="flex-1 h-px" style={{ background: theme.border }} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {prompts.map(p => (
                  <PromptCard key={p.id} prompt={p} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}

      {showNew && <NewPromptForm onClose={() => setShowNew(false)} />}
    </div>
  )
}
