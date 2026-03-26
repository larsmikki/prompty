import { useState, useMemo } from 'react'
import { usePrompts } from '../contexts/PromptsContext'
import { useTheme } from '../contexts/ThemeContext'
import PromptCard from '../components/PromptCard'
import NewPromptForm from '../components/NewPromptForm'

export default function HomePage() {
  const { prompts, categories, loading, addCategory, deleteCategory, renameCategory } = usePrompts()
  const { theme } = useTheme()
  const [showNew, setShowNew] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [managingCategories, setManagingCategories] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')

  const filtered = useMemo(() => {
    let result = prompts
    if (activeCategory) {
      result = result.filter(p => p.category === activeCategory)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))
    }
    return result
  }, [prompts, activeCategory, search])

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    addCategory(newCatName.trim())
    setNewCatName('')
  }

  const handleRename = (id: string) => {
    if (editCatName.trim()) renameCategory(id, editCatName.trim())
    setEditingCatId(null)
  }

  const pillStyle = (active: boolean) => active
    ? { background: theme.accent, color: '#fff' }
    : { background: theme.surface, color: theme.text2, border: `1px solid ${theme.border}` }

  return (
    <div>
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
          {categories.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.name === activeCategory ? null : c.name)}
              className="px-3 py-1.5 text-sm font-medium rounded-full transition-colors"
              style={pillStyle(activeCategory === c.name)}
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={() => setManagingCategories(!managingCategories)}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: managingCategories ? theme.accent : theme.text2 }}
            title="Manage categories"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: theme.text2 }} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search prompts..."
              className="w-full sm:w-56 pl-9 pr-3 py-2 text-sm rounded-md outline-none placeholder:text-gray-400"
              style={{ background: theme.surface, border: `1px solid ${theme.border}`, color: theme.text }}
            />
          </div>
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md text-white transition-colors shrink-0"
            style={{ background: theme.accent }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            New
          </button>
        </div>
      </div>

      {/* Category management panel */}
      {managingCategories && (
        <div className="mb-6 rounded-lg" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
          {categories.map((c, i) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-2.5" style={i > 0 ? { borderTop: `1px solid ${theme.border}` } : {}}>
              {editingCatId === c.id ? (
                <input
                  value={editCatName}
                  onChange={e => setEditCatName(e.target.value)}
                  onBlur={() => handleRename(c.id)}
                  onKeyDown={e => e.key === 'Enter' && handleRename(c.id)}
                  autoFocus
                  className="text-sm rounded-md px-2 py-1 outline-none"
                  style={{ border: `1px solid ${theme.accent}`, background: theme.surface2, color: theme.text }}
                />
              ) : (
                <span className="text-sm" style={{ color: theme.text }}>{c.name}</span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: theme.text2 }}>{prompts.filter(p => p.category === c.name).length}</span>
                <button
                  onClick={() => { setEditingCatId(c.id); setEditCatName(c.name) }}
                  className="p-1 rounded transition-colors"
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
                    className="p-1 rounded hover:text-red-500 transition-colors"
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
          <form onSubmit={handleAddCategory} className="flex items-center gap-2 px-4 py-2.5" style={{ borderTop: `1px solid ${theme.border}` }}>
            <input
              value={newCatName}
              onChange={e => setNewCatName(e.target.value)}
              placeholder="New category..."
              className="flex-1 text-sm rounded-md px-3 py-1.5 outline-none placeholder:text-gray-400"
              style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
            />
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-3 py-1.5 text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ background: theme.accent }}
            >
              Add
            </button>
          </form>
        </div>
      )}

      {/* Prompt cards */}
      {loading ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: theme.text2 }}>Loading...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-2" style={{ color: theme.text2 }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-sm" style={{ color: theme.text2 }}>
            {prompts.length === 0 ? 'Your prompt library is empty. Add your first prompt!' : 'No prompts match your filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map(p => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}

      {showNew && <NewPromptForm onClose={() => setShowNew(false)} />}
    </div>
  )
}
