import { useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import { usePrompts } from '@/contexts/PromptsContext'
import { api } from '@/api'

export default function RefinementPage() {
  const { theme } = useTheme()
  const { categories, addPrompt } = usePrompts()

  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [refinedPrompt, setRefinedPrompt] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(categories[0]?.name || 'General')
  const [saved, setSaved] = useState(false)

  const handleRefine = async () => {
    if (!idea.trim()) return
    setLoading(true)
    setError('')
    setRefinedPrompt('')
    setTitle('')
    setSaved(false)
    try {
      const result = await api.refinePrompt(idea.trim())
      setRefinedPrompt(result.refinedPrompt)
      setTitle(result.title)
      setCategory(categories[0]?.name || 'General')
    } catch (err: any) {
      const msg = err?.message ?? 'Something went wrong'
      // Try to extract server error message
      setError(msg.includes('API error:') ? 'Check your OpenAI API key in Settings.' : msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!refinedPrompt.trim() || !title.trim()) return
    await addPrompt(title.trim(), refinedPrompt.trim(), category)
    setSaved(true)
  }

  const inputStyle = {
    background: theme.surface2,
    border: `1px solid ${theme.border}`,
    color: theme.text,
    borderRadius: '12px',
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.text }}>Prompt refinement</h1>
        <p className="text-sm mt-0.5" style={{ color: theme.text2 }}>
          Describe your idea in plain language — AI will turn it into a polished, ready-to-use prompt.
        </p>
      </div>

      {/* Input area */}
      <div
        className="rounded-2xl p-6 mb-5"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
      >
        <label className="block text-sm font-semibold mb-2" style={{ color: theme.text2 }}>
          Describe what you need
        </label>
        <textarea
          value={idea}
          onChange={e => setIdea(e.target.value)}
          placeholder="e.g. something to help me write better emails, a prompt for summarizing meeting notes, a code review assistant..."
          rows={4}
          className="w-full p-4 text-sm resize-y outline-none placeholder:opacity-40"
          style={inputStyle}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleRefine()
          }}
        />
        <div className="flex justify-end mt-4">
          <button
            onClick={handleRefine}
            disabled={!idea.trim() || loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: theme.gradient }}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Refining...
              </>
            ) : (
              <>
                <SparkleIcon />
                Refine Prompt
              </>
            )}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
      </div>

      {/* Result area */}
      {refinedPrompt && (
        <div
          className="rounded-2xl p-6"
          style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold" style={{ color: theme.text }}>Refined prompt</h2>
            {saved && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: `${theme.accent}20`, color: theme.accent }}>
                Saved to library
              </span>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.text2 }}>
              Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Prompt title..."
              className="w-full px-4 py-3 text-sm outline-none placeholder:opacity-40"
              style={inputStyle}
            />
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.text2 }}>
              Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-4 py-3 text-sm outline-none"
              style={inputStyle}
            >
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Prompt text */}
          <div className="mb-5">
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.text2 }}>
              Prompt
            </label>
            <textarea
              value={refinedPrompt}
              onChange={e => setRefinedPrompt(e.target.value)}
              rows={8}
              className="w-full p-4 text-sm resize-y outline-none"
              style={inputStyle}
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => { setRefinedPrompt(''); setTitle(''); setSaved(false) }}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors hover:opacity-80"
              style={{ background: theme.surface2, color: theme.text2 }}
            >
              Discard
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim() || !refinedPrompt.trim() || saved}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: theme.gradient }}
            >
              {saved ? 'Saved!' : 'Save to Library'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function SparkleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
    </svg>
  )
}
