import { useState, useMemo } from 'react'
import { usePrompts } from '@/contexts/PromptsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button, ConfirmDialog, Input, Pill, useToast } from '@/components/ui'
import PromptCard from '@/components/PromptCard'
import NewPromptForm from '@/components/NewPromptForm'

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--theme-surface)',
        border: '1px solid var(--theme-border)',
        boxShadow: 'var(--shadow-card-soft)',
      }}
    >
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
  const { addToast } = useToast()
  const [showNew, setShowNew] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [managingCategories, setManagingCategories] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [addCatError, setAddCatError] = useState('')
  const [editingCatId, setEditingCatId] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')
  const [pendingDeleteCatId, setPendingDeleteCatId] = useState<string | null>(null)

  const visibleActiveCategory = activeCategory && categories.some(c => c.name === activeCategory)
    ? activeCategory
    : null

  const filtered = useMemo(() => {
    let result = prompts
    if (visibleActiveCategory) result = result.filter(p => p.category === visibleActiveCategory)
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.text.toLowerCase().includes(q))
    }
    return result
  }, [prompts, visibleActiveCategory, search])

  const grouped = useMemo(() => {
    if (cardView !== 'grouped' || visibleActiveCategory || search.trim()) return null
    const groups: Record<string, typeof prompts> = {}
    for (const p of filtered) {
      if (!groups[p.category]) groups[p.category] = []
      groups[p.category].push(p)
    }
    return groups
  }, [filtered, cardView, visibleActiveCategory, search])

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCatName.trim()) return
    setAddCatError('')
    try {
      await addCategory(newCatName.trim())
      setNewCatName('')
    } catch (err) {
      setAddCatError(err instanceof Error ? err.message : 'Failed to add category')
    }
  }

  const handleRename = async (id: string) => {
    const newName = editCatName.trim()
    setEditingCatId(null)
    if (!newName) return
    try {
      await renameCategory(id, newName)
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to rename category', 'error')
    }
  }

  const pendingDeleteCat = categories.find(c => c.id === pendingDeleteCatId)
  const pendingDeleteCount = pendingDeleteCat
    ? prompts.filter(p => p.category === pendingDeleteCat.name).length
    : 0
  const pendingDeleteFallback = pendingDeleteCat
    ? categories.find(other => other.id !== pendingDeleteCat.id)?.name ?? 'another category'
    : ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-text">Your library</h1>
          {!loading && (
            <p className="text-sm mt-0.5 text-text2">
              {prompts.length} {prompts.length === 1 ? 'prompt' : 'prompts'} saved
            </p>
          )}
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowNew(true)}
          leadingIcon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          }
        >
          New prompt
        </Button>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        <div className="relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-text2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <Input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search prompts..."
            aria-label="Search prompts"
            className="pl-10 pr-10"
            style={{ background: theme.surface }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded text-text2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Pill active={visibleActiveCategory === null} onClick={() => setActiveCategory(null)}>All</Pill>
          {categories.map(c => (
            <Pill
              key={c.id}
              active={visibleActiveCategory === c.name}
              onClick={() => setActiveCategory(c.name === visibleActiveCategory ? null : c.name)}
            >
              {c.name}
            </Pill>
          ))}
          <button
            onClick={() => setManagingCategories(!managingCategories)}
            aria-label="Manage categories"
            aria-expanded={managingCategories}
            className="p-1.5 rounded-lg transition-colors"
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

      {managingCategories && (
        <div
          className="mb-6 rounded-xl overflow-hidden"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <div className="px-4 py-3" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-text2">
              Manage categories
            </p>
          </div>
          {categories.map((c, i) => (
            <div
              key={c.id}
              className="flex items-center justify-between px-4 py-3"
              style={i > 0 ? { borderTop: `1px solid ${theme.border}` } : {}}
            >
              {editingCatId === c.id ? (
                <Input
                  value={editCatName}
                  onChange={e => setEditCatName(e.target.value)}
                  onBlur={() => handleRename(c.id)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRename(c.id)
                    else if (e.key === 'Escape') {
                      setEditCatName(c.name)
                      setEditingCatId(null)
                    }
                  }}
                  aria-label={`Rename category ${c.name}`}
                  autoFocus
                  highlighted
                  className="max-w-xs"
                />
              ) : (
                <span className="text-sm font-medium text-text">{c.name}</span>
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
                  className="p-1.5 rounded-md transition-opacity hover:opacity-80 text-text2"
                  title="Rename"
                  aria-label={`Rename ${c.name}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                {categories.length > 1 && (
                  <button
                    onClick={() => setPendingDeleteCatId(c.id)}
                    className="p-1.5 rounded-md transition-opacity hover:opacity-80"
                    style={{ color: '#dc2626' }}
                    title="Delete"
                    aria-label={`Delete ${c.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
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
              <Input
                value={newCatName}
                onChange={e => { setNewCatName(e.target.value); setAddCatError('') }}
                placeholder="New category name..."
                invalid={!!addCatError}
              />
              <Button type="submit" variant="primary" disabled={!newCatName.trim()}>Add</Button>
            </div>
            {addCatError && <p className="text-xs" style={{ color: '#dc2626' }}>{addCatError}</p>}
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!pendingDeleteCat}
        title="Delete category"
        message={
          pendingDeleteCount > 0
            ? `"${pendingDeleteCat?.name}" will be removed. Its ${pendingDeleteCount} prompt${pendingDeleteCount === 1 ? '' : 's'} will be moved to "${pendingDeleteFallback}".`
            : `"${pendingDeleteCat?.name}" will be removed.`
        }
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!pendingDeleteCat) return
          try {
            await deleteCategory(pendingDeleteCat.id)
            addToast('Category deleted', 'success')
          } catch (err) {
            addToast(err instanceof Error ? err.message : 'Failed to delete category', 'error')
          }
        }}
        onClose={() => setPendingDeleteCatId(null)}
      />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
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
          <h3 className="text-base font-bold mb-2 text-text">
            {prompts.length === 0 ? 'Your library is empty' : 'No prompts found'}
          </h3>
          <p className="text-sm mb-6 text-text2">
            {prompts.length === 0
              ? 'Add your first prompt to get started.'
              : 'Try a different search or category.'}
          </p>
          {prompts.length === 0 && (
            <Button variant="primary" size="lg" onClick={() => setShowNew(true)}>
              Add your first prompt
            </Button>
          )}
        </div>
      ) : grouped ? (
        <div className="space-y-10">
          {Object.entries(grouped).map(([cat, list]) => (
            <div key={cat}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xs font-bold uppercase tracking-widest text-text2">{cat}</h2>
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: `${theme.accent}15`, color: theme.accent }}
                >
                  {list.length}
                </span>
                <div className="flex-1 h-px" style={{ background: theme.border }} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {list.map(p => <PromptCard key={p.id} prompt={p} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(p => <PromptCard key={p.id} prompt={p} />)}
        </div>
      )}

      {showNew && <NewPromptForm onClose={() => setShowNew(false)} />}
    </div>
  )
}
