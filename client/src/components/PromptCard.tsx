import { useEffect, useState } from 'react'
import type { Prompt } from '@/types'
import { usePrompts } from '@/contexts/PromptsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { ConfirmDialog, useToast } from '@/components/ui'
import EditPromptForm from '@/components/EditPromptForm'

export default function PromptCard({ prompt }: { prompt: Prompt }) {
  const { deletePrompt } = usePrompts()
  const { theme, cardView } = useTheme()
  const { addToast } = useToast()
  const [copied, setCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [lightbox, setLightbox] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!lightbox) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightbox])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      addToast('Copy failed. Clipboard access is unavailable.', 'error')
    }
  }

  const handleDelete = async () => {
    try {
      await deletePrompt(prompt.id)
      addToast('Prompt deleted', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to delete prompt', 'error')
    }
  }

  return (
    <>
      {editing && <EditPromptForm prompt={prompt} onClose={() => setEditing(false)} />}
      <ConfirmDialog
        open={confirmDelete}
        title="Delete prompt"
        message={`"${prompt.title || 'this prompt'}" will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Image for "${prompt.title || 'prompt'}"`}
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
          border: `1px solid ${theme.border}`,
          boxShadow: 'var(--shadow-card-soft)',
        }}
      >
        <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
          <button
            onClick={() => setEditing(true)}
            aria-label={`Edit prompt "${prompt.title || 'untitled'}"`}
            className="p-1.5 rounded-md transition-colors hover:opacity-80 text-text2"
            title="Edit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            aria-label={`Delete prompt "${prompt.title || 'untitled'}"`}
            className="p-1.5 rounded-md transition-colors hover:opacity-80 text-text2"
            title="Delete"
            style={{ color: theme.text2 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {prompt.imagePath && (
          <img
            src={prompt.imagePath}
            alt=""
            className="w-full rounded-lg mb-3 object-cover cursor-zoom-in"
            style={{ maxHeight: '120px' }}
            onClick={e => { e.stopPropagation(); setLightbox(true) }}
          />
        )}

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

        <h3 className="text-base font-bold mb-2 leading-snug text-text">
          {prompt.title}
        </h3>

        <p className="text-sm leading-relaxed mb-4 line-clamp-3 flex-1 text-text2">
          {prompt.text}
        </p>

        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-150"
          style={
            copied
              ? { background: 'rgba(22,163,74,0.15)', color: '#16a34a', border: '1px solid rgba(22,163,74,0.30)' }
              : { background: theme.surface2, color: theme.text2 }
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
