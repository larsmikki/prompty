import { useState } from 'react'
import type { Prompt } from '@/types'
import { usePrompts } from '@/contexts/PromptsContext'
import { useTheme } from '@/contexts/ThemeContext'
import EditPromptForm from '@/components/EditPromptForm'

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const { deletePrompt } = usePrompts()
  const { theme, cardView } = useTheme()
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.text)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = prompt.text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <>
      {editing && <EditPromptForm prompt={prompt} onClose={() => setEditing(false)} />}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.88)' }}
          onClick={() => setLightbox(false)}
        >
          <img
            src={prompt.imagePath}
            alt=""
            className="max-w-full max-h-full rounded-xl object-contain"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
          />
        </div>
      )}
      <div
        className="card-hover group relative rounded-xl p-5 flex flex-col"
        style={{
          background: theme.surface,
          border: `1px solid ${hovered ? theme.accent + '50' : theme.border}`,
          boxShadow: hovered
            ? `0 4px 20px rgba(0,0,0,0.12), 0 0 0 1px ${theme.accent}20`
            : '0 1px 4px rgba(0,0,0,0.06)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
      {/* Actions: absolute top-right, no layout impact */}
      <div
        className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-md transition-colors hover:opacity-100"
            style={{ color: theme.text2 }}
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => deletePrompt(prompt.id)}
            className="p-1.5 rounded-md transition-colors hover:text-red-500"
            style={{ color: theme.text2 }}
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
      </div>

      {/* Image thumbnail */}
      {prompt.imagePath && (
        <img
          src={prompt.imagePath}
          alt=""
          className="w-full rounded-lg mb-3 object-cover cursor-zoom-in"
          style={{ maxHeight: '120px' }}
          onClick={e => { e.stopPropagation(); setLightbox(true) }}
        />
      )}

      {/* Category tag — only in tagged view */}
      {cardView === 'tagged' && (
        <div className="mb-3">
          <span
            className="inline-block text-xs font-semibold px-2.5 py-1 rounded-lg tracking-wide"
            style={{
              background: `${theme.accent}15`,
              color: theme.accent,
              border: `1px solid ${theme.accent}25`,
            }}
          >
            {prompt.category}
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="text-base font-bold mb-2 leading-snug" style={{ color: theme.text }}>
        {prompt.title}
      </h3>

      {/* Text preview */}
      <p
        className="text-sm leading-relaxed mb-4 line-clamp-3 flex-1"
        style={{ color: theme.text2 }}
      >
        {prompt.text}
      </p>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150"
        style={
          copied
            ? { background: '#16a34a18', color: '#16a34a', border: '1px solid #16a34a30' }
            : {
                background: theme.surface2,
                color: theme.text2,
              }
        }
      >
        {copied ? (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
              <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
            </svg>
            Copy Prompt
          </>
        )}
      </button>
      </div>
    </>
  )
}
