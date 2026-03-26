import { useState } from 'react'
import type { Prompt } from '../types'
import { usePrompts } from '../contexts/PromptsContext'
import { useTheme } from '../contexts/ThemeContext'

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const { deletePrompt, editPrompt, categories } = usePrompts()
  const { theme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(prompt.title)
  const [editText, setEditText] = useState(prompt.text)
  const [editCategory, setEditCategory] = useState(prompt.category)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt.text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const handleSaveEdit = () => {
    if (editTitle.trim() && editText.trim()) {
      editPrompt(prompt.id, editTitle.trim(), editText.trim(), editCategory)
      setEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditTitle(prompt.title)
    setEditText(prompt.text)
    setEditCategory(prompt.category)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="rounded-lg p-4 shadow-sm" style={{ background: theme.surface, border: `1px solid ${theme.accent}` }}>
        <div className="flex items-center gap-2 mb-3">
          <input
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            className="flex-1 text-sm font-semibold rounded-md px-2 py-1 outline-none"
            style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
            placeholder="Title"
          />
          <select
            value={editCategory}
            onChange={e => setEditCategory(e.target.value)}
            className="text-sm rounded-md px-2 py-1"
            style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
          >
            {categories.map(c => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <textarea
          value={editText}
          onChange={e => setEditText(e.target.value)}
          rows={4}
          className="w-full rounded-md p-3 text-sm resize-y outline-none"
          style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text }}
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleSaveEdit}
            className="px-3 py-1.5 text-sm font-medium rounded-md text-white transition-colors"
            style={{ background: theme.accent }}
          >
            Save
          </button>
          <button
            onClick={handleCancelEdit}
            className="px-3 py-1.5 text-sm font-medium rounded-md transition-colors"
            style={{ background: theme.surface2, color: theme.text }}
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: `${theme.accent}18`, color: theme.accent }}>
            {prompt.category}
          </span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: theme.text2 }}
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => deletePrompt(prompt.id)}
            className="p-1.5 rounded-md hover:text-red-500 transition-colors"
            style={{ color: theme.text2 }}
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: theme.text }}>{prompt.title}</h3>
      <p className="text-sm whitespace-pre-wrap break-words mb-3 line-clamp-3" style={{ color: theme.text2 }}>
        {prompt.text}
      </p>
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
        style={copied
          ? { background: '#dcfce7', color: '#15803d' }
          : { background: theme.surface2, color: theme.text2 }
        }
      >
        {copied ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            Copy
          </>
        )}
      </button>
    </div>
  )
}
