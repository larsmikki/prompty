import { useState } from 'react'
import { usePrompts } from '../contexts/PromptsContext'
import { useTheme } from '../contexts/ThemeContext'

export default function NewPromptForm({ onClose }: { onClose: () => void }) {
  const { categories, addPrompt } = usePrompts()
  const { theme } = useTheme()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [category, setCategory] = useState(categories[0]?.name || 'General')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !text.trim()) return
    addPrompt(title.trim(), text.trim(), category)
    setTitle('')
    setText('')
    onClose()
  }

  const inputStyle = { background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="rounded-xl shadow-xl w-full max-w-lg"
        style={{ background: theme.surface, border: `1px solid ${theme.border}` }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
          <h2 className="text-lg font-semibold" style={{ color: theme.text }}>New Prompt</h2>
          <button onClick={onClose} className="p-1 rounded-md transition-colors" style={{ color: theme.text2 }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.text2 }}>Title</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your prompt a name..."
              autoFocus
              className="w-full rounded-md px-3 py-2 text-sm outline-none placeholder:text-gray-400"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.text2 }}>Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full rounded-md px-3 py-2 text-sm outline-none"
              style={inputStyle}
            >
              {categories.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.text2 }}>Prompt</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste or type your prompt here..."
              rows={6}
              className="w-full rounded-md p-3 text-sm resize-y outline-none placeholder:text-gray-400"
              style={inputStyle}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{ background: theme.surface2, color: theme.text }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !text.trim()}
              className="px-4 py-2 text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ background: theme.accent }}
            >
              Save Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
