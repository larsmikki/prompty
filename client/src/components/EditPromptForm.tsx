import { useState, useRef, useEffect } from 'react'
import type { Prompt } from '@/types'
import { usePrompts } from '@/contexts/PromptsContext'
import { useTheme } from '@/contexts/ThemeContext'
import { api } from '@/api'

export default function EditPromptForm({ prompt, onClose }: { prompt: Prompt; onClose: () => void }) {
  const { categories, editPrompt, addCategory, setPromptImage, removePromptImage } = usePrompts()
  const { theme } = useTheme()
  const [title, setTitle] = useState(prompt.title)
  const [text, setText] = useState(prompt.text)
  const [category, setCategory] = useState(prompt.category)
  const [creatingCat, setCreatingCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [newCatError, setNewCatError] = useState('')
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState('')
  const [pendingImage, setPendingImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(prompt.imagePath || null)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!pendingImage) return
    const url = URL.createObjectURL(pendingImage)
    setImagePreview(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingImage])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setPendingImage(file)
      setRemoveExistingImage(false)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const imageItem = Array.from(e.clipboardData.items).find(item => item.type.startsWith('image/'))
    if (!imageItem) return
    e.preventDefault()
    const file = imageItem.getAsFile()
    if (file) {
      setPendingImage(file)
      setRemoveExistingImage(false)
    }
  }

  const handleRemoveImage = () => {
    if (prompt.imagePath) setRemoveExistingImage(true)
    setPendingImage(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRefine = async () => {
    if (!text.trim()) return
    setRefining(true)
    setRefineError('')
    try {
      const result = await api.refinePrompt(text.trim())
      setText(result.refinedPrompt)
      if (result.title && !title.trim()) setTitle(result.title)
    } catch {
      setRefineError('Refinement failed. Check your API key in Settings.')
    } finally {
      setRefining(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !text.trim()) return
    await editPrompt(prompt.id, title.trim(), text.trim(), category)
    if (removeExistingImage && !pendingImage) {
      await removePromptImage(prompt.id)
    } else if (pendingImage) {
      await setPromptImage(prompt.id, pendingImage)
    }
    onClose()
  }

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return
    setNewCatError('')
    const newCat = await addCategory(newCatName.trim())
    if (newCat) {
      setCategory(newCat.name)
      setNewCatName('')
      setCreatingCat(false)
    } else {
      setNewCatError('Failed to create category')
    }
  }

  const inputStyle = {
    background: theme.surface2,
    border: `1px solid ${theme.border}`,
    color: theme.text,
    borderRadius: '10px',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          background: theme.surface,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px ${theme.border}`,
        }}
        onClick={e => e.stopPropagation()}
        onPaste={handlePaste}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <h2 className="text-lg font-bold gradient-text">Edit Prompt</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:opacity-80"
            style={{ color: theme.text2, background: theme.surface2 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.text2 }}>
              Title
            </label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Give your prompt a name..."
              autoFocus
              className="w-full px-4 py-3 text-sm outline-none placeholder:opacity-40"
              style={inputStyle}
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.text2 }}>
              Category
            </label>
            {creatingCat ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    value={newCatName}
                    onChange={e => { setNewCatName(e.target.value); setNewCatError('') }}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleCreateCategory())}
                    placeholder="New category name..."
                    autoFocus
                    className="flex-1 px-4 py-3 text-sm outline-none placeholder:opacity-40"
                    style={{
                      ...inputStyle,
                      border: `1px solid ${newCatError ? '#ef4444' : theme.border}`,
                    }}
                  />
                  <button
                    type="button"
                    disabled={!newCatName.trim()}
                    onClick={handleCreateCategory}
                    className="px-4 py-3 text-sm font-semibold rounded-xl text-white disabled:opacity-40 transition-opacity shrink-0"
                    style={{ background: theme.gradient }}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => { setCreatingCat(false); setNewCatName(''); setNewCatError('') }}
                    className="px-4 py-3 text-sm rounded-xl transition-colors shrink-0"
                    style={{ background: theme.surface2, color: theme.text2 }}
                  >
                    Cancel
                  </button>
                </div>
                {newCatError && <p className="text-xs text-red-500">{newCatError}</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="flex-1 px-4 py-3 text-sm outline-none"
                  style={inputStyle}
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setCreatingCat(true)}
                  className="p-3 rounded-xl transition-colors shrink-0 hover:opacity-80"
                  style={{ background: theme.surface2, color: theme.text2 }}
                  title="Create new category"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Prompt text */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: theme.text2 }}>
                Prompt
              </label>
              <button
                type="button"
                onClick={handleRefine}
                disabled={!text.trim() || refining}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg disabled:opacity-40 transition-opacity hover:opacity-80"
                style={{ background: `${theme.accent}20`, color: theme.accent }}
              >
                {refining ? (
                  <>
                    <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Refining...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                    </svg>
                    Refine
                  </>
                )}
              </button>
            </div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Paste or type your prompt here..."
              rows={6}
              className="w-full p-4 text-sm resize-y outline-none placeholder:opacity-40"
              style={inputStyle}
            />
            {refineError && <p className="mt-1 text-xs text-red-500">{refineError}</p>}
          </div>

          {/* Image attachment */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: theme.text2 }}>
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
                  className="absolute top-1.5 right-1.5 p-1 rounded-full"
                  style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
                  title="Remove image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ) : (
              <label
                className="flex items-center gap-2.5 px-4 py-3 text-sm rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
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

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium rounded-xl transition-colors"
              style={{ background: theme.surface2, color: theme.text2 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !text.trim()}
              className="px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40 transition-opacity hover:opacity-90"
              style={{ background: theme.gradient }}
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
