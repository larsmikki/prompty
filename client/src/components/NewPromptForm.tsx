import { useState, useRef, useEffect, useMemo } from 'react'
import { usePrompts } from '@/contexts/PromptsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button, ConfirmDialog, Input, Modal, Select, Textarea, useToast } from '@/components/ui'

export default function NewPromptForm({ onClose }: { onClose: () => void }) {
  const { categories, addPrompt, addCategory, setPromptImage } = usePrompts()
  const { theme } = useTheme()
  const { addToast } = useToast()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [category, setCategory] = useState(categories[0]?.name || 'General')
  const [creatingCat, setCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatError, setNewCatError] = useState('')
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [submitError, setSubmitError] = useState('')
  const [confirmDiscard, setConfirmDiscard] = useState(false)
  const [createdPromptId, setCreatedPromptId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const imagePreview = useMemo(
    () => pendingImage ? URL.createObjectURL(pendingImage) : null,
    [pendingImage],
  )

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const hasUnsavedContent = () => Boolean(title.trim() || text.trim() || pendingImage)

  const requestClose = () => {
    if (hasUnsavedContent()) {
      setConfirmDiscard(true)
      return
    }
    onClose()
  }

  // Server caps image payloads at 10 MB (express.raw limit). Reject earlier.
  const MAX_IMAGE_BYTES = 10 * 1024 * 1024

  const acceptImage = (file: File): boolean => {
    if (file.size > MAX_IMAGE_BYTES) {
      setSubmitError(`Image is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is 10 MB.`)
      return false
    }
    setSubmitError('')
    setPendingImage(file)
    return true
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) acceptImage(file)
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'))
    if (!imageItem) return
    e.preventDefault()
    const file = imageItem.getAsFile()
    if (file) acceptImage(file)
  }

  const handleRemoveImage = () => {
    setPendingImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !text.trim()) return
    setSubmitError('')
    try {
      let promptId = createdPromptId
      if (!promptId) {
        const newPrompt = await addPrompt(title.trim(), text.trim(), category)
        promptId = newPrompt.id
        setCreatedPromptId(promptId)
      }
      if (pendingImage) {
        await setPromptImage(promptId, pendingImage)
      }
      addToast('Prompt saved', 'success')
      onClose()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save prompt')
    }
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    setNewCatError('')
    try {
      const newCat = await addCategory(newCatName.trim())
      setCategory(newCat.name)
      setNewCatName('')
      setCreatingCat(false)
    } catch (err) {
      setNewCatError(err instanceof Error ? err.message : 'Failed to create category')
    }
  }

  return (
    <>
      <ConfirmDialog
        open={confirmDiscard}
        title="Discard this prompt?"
        message="Your changes will be lost."
        confirmLabel="Discard"
        destructive
        onConfirm={onClose}
        onClose={() => setConfirmDiscard(false)}
      />
      <Modal open onClose={requestClose} title="New prompt" maxWidth="560px">
        <form onSubmit={handleSubmit} className="space-y-5" onPaste={handlePaste}>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-text2">Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your prompt a name..."
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-text2">Category</label>
            {creatingCat ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={newCatName}
                    onChange={e => { setNewCatName(e.target.value); setNewCatError('') }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                    placeholder="New category name..."
                    autoFocus
                    invalid={!!newCatError}
                  />
                  <Button type="button" variant="primary" disabled={!newCatName.trim()} onClick={handleCreateCategory}>
                    Create
                  </Button>
                  <Button type="button" onClick={() => { setCreatingCat(false); setNewCatName(''); setNewCatError('') }}>
                    Cancel
                  </Button>
                </div>
                {newCatError && <p className="text-xs" style={{ color: '#dc2626' }}>{newCatError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Select value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => setCreatingCat(true)}
                  className="p-2.5 rounded-lg shrink-0 hover:opacity-80 transition-opacity"
                  style={{ background: theme.surface2, color: theme.text2 }}
                  title="Create new category"
                  aria-label="Create new category"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-text2">Prompt</label>
            <Textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste or type your prompt here..."
              rows={6}
              className="resize-y"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-text2">
              Image <span className="normal-case font-normal opacity-60">(optional)</span>
            </label>
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Attached"
                  className="max-h-48 rounded-xl object-contain"
                  style={{ border: `1px solid ${theme.border}` }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  aria-label="Remove image"
                  className="absolute top-1.5 right-1.5 p-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <label
                className="flex items-center gap-2.5 px-4 py-3 text-sm rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                style={{ background: theme.surface2, color: theme.text2, border: `1px dashed ${theme.border}` }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Browse or paste image from clipboard</span>
              </label>
            )}
          </div>

          {submitError && <p className="text-xs" style={{ color: '#dc2626' }}>{submitError}</p>}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" onClick={requestClose}>Cancel</Button>
            <Button type="submit" variant="primary" disabled={!title.trim() || !text.trim()}>
              Save prompt
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
