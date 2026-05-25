import { useRef, useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import type { CardView } from '@/contexts/ThemeContext'
import { usePrompts } from '@/contexts/PromptsContext'
import ThemePicker from '@/components/ThemePicker'
import { Button, ConfirmDialog, Input, Modal, Surface, Textarea, useToast } from '@/components/ui'
import { api } from '@/api'

export default function SettingsPage() {
  const { theme, cardView, setCardView } = useTheme()
  const { prompts, categories, refresh } = usePrompts()
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [apiKeyMasked, setApiKeyMasked] = useState('')
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)
  const [savedModel, setSavedModel] = useState('gpt-4o-mini')

  const [openaiEditing, setOpenaiEditing] = useState(false)
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [modelDraft, setModelDraft] = useState('gpt-4o-mini')
  const [openaiSaving, setOpenaiSaving] = useState(false)
  const [openaiError, setOpenaiError] = useState('')
  const [confirmRemoveKey, setConfirmRemoveKey] = useState(false)

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [refineContext, setRefineContext] = useState('')
  const [refineContextDefault, setRefineContextDefault] = useState(true)
  const [refineEditing, setRefineEditing] = useState(false)
  const [refineDraft, setRefineDraft] = useState('')
  const [refineSaving, setRefineSaving] = useState(false)

  useEffect(() => {
    api.getOpenAIKeyStatus().then(s => {
      setApiKeyConfigured(s.configured)
      setApiKeyMasked(s.masked)
      if (!s.configured) setOpenaiEditing(true)
    }).catch(() => {})
    api.getOpenAIModel().then(s => {
      setSavedModel(s.model)
      setModelDraft(s.model)
    }).catch(() => {})
    api.getRefineContext().then(s => {
      setRefineContext(s.context)
      setRefineContextDefault(s.isDefault)
      setRefineDraft(s.context)
    }).catch(() => {})
  }, [])

  const handleStartOpenaiEdit = () => {
    setApiKeyDraft('')
    setModelDraft(savedModel)
    setOpenaiError('')
    setOpenaiEditing(true)
  }

  const handleCancelOpenaiEdit = () => {
    setApiKeyDraft('')
    setModelDraft(savedModel)
    setOpenaiError('')
    setOpenaiEditing(false)
  }

  const handleSaveOpenai = async () => {
    const keyTrimmed = apiKeyDraft.trim()
    const modelTrimmed = modelDraft.trim()
    if (!modelTrimmed) return
    if (!apiKeyConfigured && !keyTrimmed) return

    setOpenaiSaving(true)
    setOpenaiError('')
    try {
      if (keyTrimmed) {
        await api.saveOpenAIKey(keyTrimmed)
        setApiKeyConfigured(true)
        setApiKeyMasked('***' + keyTrimmed.slice(-4))
        setTestResult(null)
      }
      if (modelTrimmed !== savedModel) {
        await api.saveOpenAIModel(modelTrimmed)
        setSavedModel(modelTrimmed)
        setTestResult(null)
      }
      setApiKeyDraft('')
      setOpenaiEditing(false)
      addToast('OpenAI settings saved', 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed'
      setOpenaiError(msg)
    } finally {
      setOpenaiSaving(false)
    }
  }

  const handleClearApiKey = async () => {
    setOpenaiError('')
    try {
      await api.saveOpenAIKey('')
      setApiKeyConfigured(false)
      setApiKeyMasked('')
      setTestResult(null)
      setOpenaiEditing(true)
      addToast('API key removed', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to remove key', 'error')
    }
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const result = await api.testOpenAI()
      setTestResult(result.ok
        ? { ok: true, message: `Connected. Model: ${result.model}` }
        : { ok: false, message: result.error ?? 'Failed' }
      )
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Request failed' })
    } finally {
      setTesting(false)
    }
  }

  const handleStartRefineEdit = () => {
    setRefineDraft(refineContext)
    setRefineEditing(true)
  }

  const handleSaveRefineContext = async () => {
    setRefineSaving(true)
    try {
      await api.saveRefineContext(refineDraft)
      setRefineContext(refineDraft)
      setRefineContextDefault(false)
      setRefineEditing(false)
      addToast('Refinement prompt saved', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setRefineSaving(false)
    }
  }

  const handleResetRefineContext = async () => {
    try {
      await api.resetRefineContext()
      const s = await api.getRefineContext()
      setRefineContext(s.context)
      setRefineContextDefault(true)
      setRefineDraft(s.context)
      setRefineEditing(false)
      addToast('Reset to default', 'success')
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Reset failed', 'error')
    }
  }

  const handleExport = () => {
    const cleanPrompts = prompts.map(p =>
      p.imagePath ? { ...p, imagePath: p.imagePath.split('?')[0] } : p
    )
    const data = { prompts: cleanPrompts, categories }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const today = new Date().toISOString().slice(0, 10)
    a.href = url
    a.download = `prompty-backup-${today}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      let data: { prompts?: unknown[]; categories?: unknown[] }
      try {
        data = JSON.parse(reader.result as string)
      } catch {
        addToast('Invalid JSON file', 'error')
        input.value = ''
        return
      }
      try {
        const promptsIn = Array.isArray(data.prompts) ? data.prompts : []
        const categoriesIn = Array.isArray(data.categories) ? data.categories : []
        const result = await api.importData({
          prompts: promptsIn as never,
          categories: categoriesIn as never,
        })
        await refresh()
        const skipped = result.promptsSkipped + result.categoriesSkipped
        const skippedNote = skipped > 0 ? ` ${skipped} skipped.` : ''
        addToast(
          `Imported ${result.promptsAdded} prompt${result.promptsAdded === 1 ? '' : 's'} and ${result.categoriesAdded} categor${result.categoriesAdded === 1 ? 'y' : 'ies'}.${skippedNote}`,
          'success',
        )
      } catch {
        addToast('Import failed. The server returned an error.', 'error')
      } finally {
        input.value = ''
      }
    }
    reader.readAsText(file)
  }

  const refineTeaser = refineContext.split('\n').find(l => l.trim()) ?? 'No prompt defined'

  const canSaveOpenai =
    modelDraft.trim().length > 0 &&
    (apiKeyConfigured || apiKeyDraft.trim().length > 0) &&
    (apiKeyDraft.trim().length > 0 || modelDraft.trim() !== savedModel)

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-text">Settings</h1>
        <p className="text-sm mt-0.5 text-text2">Customize your Prompty experience.</p>
      </div>

      <Surface className="p-6 mb-5">
        <h2 className="text-base font-bold mb-1 text-text">Themes</h2>
        <p className="text-xs mb-5 text-text2">Choose how Prompty looks to you.</p>
        <ThemePicker />
      </Surface>

      <Surface className="p-6 mb-5">
        <h2 className="text-base font-bold mb-1 text-text">Library view</h2>
        <p className="text-xs mb-5 text-text2">Choose how prompts are displayed in your library.</p>
        <div className="flex gap-3">
          {([
            {
              value: 'grouped' as CardView,
              label: 'Grouped',
              description: 'Organized by category',
              preview: (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-8 rounded-sm" style={{ background: theme.accent }} />
                    <div className="h-px flex-1" style={{ background: theme.border }} />
                  </div>
                  {[0.75, 1, 0.6].map((w, i) => (
                    <div key={i} className="h-2 rounded-sm" style={{ background: theme.surface2, width: `${w * 100}%` }} />
                  ))}
                </div>
              ),
            },
            {
              value: 'tagged' as CardView,
              label: 'Tagged',
              description: 'Category badge on each card',
              preview: (
                <div className="space-y-1.5">
                  <div className="h-3 w-10 rounded-md" style={{ background: `${theme.accent}25`, border: `1px solid ${theme.accent}40` }} />
                  {[0.75, 1, 0.6].map((w, i) => (
                    <div key={i} className="h-2 rounded-sm" style={{ background: theme.surface2, width: `${w * 100}%` }} />
                  ))}
                </div>
              ),
            },
          ] as const).map(({ value, label, description, preview }) => (
            <button
              key={value}
              onClick={() => setCardView(value)}
              className="flex-1 flex flex-col gap-3 p-4 rounded-xl text-left transition-all"
              style={{
                border: `2px solid ${cardView === value ? theme.accent : theme.border}`,
                background: cardView === value ? `${theme.accent}08` : theme.surface2,
                boxShadow: cardView === value ? `0 0 0 1px ${theme.accent}20` : 'none',
              }}
              aria-pressed={cardView === value}
            >
              <div className="w-full rounded-lg p-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                {preview}
              </div>
              <div>
                <p className="text-sm font-semibold text-text">{label}</p>
                <p className="text-xs mt-0.5 text-text2">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </Surface>

      <Surface className="p-6 mb-5">
        <h2 className="text-base font-bold mb-1 text-text">OpenAI</h2>
        <p className="text-xs mb-4 text-text2">
          Required for Prompt Refinement. Your key is stored locally on the server and never shared.
        </p>

        {apiKeyConfigured && !openaiEditing ? (
          <div
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-text">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" style={{ color: '#16a34a' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">API key set</span>
                <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: theme.surface, color: theme.text2 }}>{apiKeyMasked}</code>
              </div>
              <div className="text-xs mt-1 ml-6 text-text2">
                Model: <code className="text-text">{savedModel}</code>
              </div>
            </div>
            <Button size="sm" onClick={handleStartOpenaiEdit}>Edit</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5 text-text2">
                API key {apiKeyConfigured && <span className="normal-case font-normal opacity-60">(leave blank to keep current)</span>}
              </label>
              <Input
                type="password"
                value={apiKeyDraft}
                onChange={e => setApiKeyDraft(e.target.value)}
                placeholder={apiKeyConfigured ? apiKeyMasked : 'sk-...'}
                aria-label="OpenAI API key"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5 text-text2">Model</label>
              <Input
                type="text"
                value={modelDraft}
                onChange={e => setModelDraft(e.target.value)}
                placeholder="gpt-4o-mini"
                aria-label="OpenAI model name"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant="primary"
                onClick={handleSaveOpenai}
                disabled={!canSaveOpenai || openaiSaving}
              >
                {openaiSaving ? 'Saving…' : 'Save'}
              </Button>
              {apiKeyConfigured && (
                <Button onClick={handleCancelOpenaiEdit} disabled={openaiSaving}>Cancel</Button>
              )}
              {apiKeyConfigured && (
                <Button
                  variant="danger"
                  className="ml-auto"
                  onClick={() => setConfirmRemoveKey(true)}
                  disabled={openaiSaving}
                >
                  Remove key
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: `1px solid ${theme.border}` }}>
          <Button onClick={handleTest} disabled={testing || !apiKeyConfigured} title={!apiKeyConfigured ? 'Save an API key first' : undefined}>
            {testing ? 'Testing…' : 'Test connection'}
          </Button>
          {testResult && (
            <span className="text-xs font-medium" style={{ color: testResult.ok ? '#16a34a' : '#dc2626' }}>
              {testResult.ok ? '✓' : '✗'} {testResult.message}
            </span>
          )}
        </div>
        {openaiError && <p className="text-xs mt-3" style={{ color: '#dc2626' }}>{openaiError}</p>}
      </Surface>

      <Surface className="p-6 mb-5">
        <h2 className="text-base font-bold mb-1 text-text">Refinement prompt</h2>
        <p className="text-xs mb-4 text-text2">
          This guide is injected into every Prompt Refinement call as context for the AI.
        </p>

        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: theme.surface2, border: `1px solid ${theme.border}` }}
        >
          <div className="rounded-lg p-2 flex-shrink-0" style={{ background: `${theme.accent}18` }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor" style={{ color: theme.accent }}>
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-text">Refinement prompt</span>
              {!refineContextDefault && (
                <span className="text-xs px-1.5 py-px rounded-full font-medium" style={{ background: `${theme.accent}20`, color: theme.accent }}>
                  Custom
                </span>
              )}
            </div>
            <p className="text-xs truncate text-text2">{refineTeaser}</p>
          </div>
          <Button size="sm" onClick={handleStartRefineEdit}>Edit</Button>
        </div>
      </Surface>

      <Surface className="p-6">
        <h2 className="text-base font-bold mb-1 text-text">Data</h2>
        <p className="text-xs mb-5 text-text2">
          Export or import your library as a JSON backup. Settings (theme, API key, refinement context) are not included.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={handleExport}
            disabled={prompts.length === 0}
            title={prompts.length === 0 ? 'Nothing to export yet — add a prompt first.' : undefined}
            leadingIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            }
          >
            Export library
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            leadingIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            }
          >
            Import library
          </Button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </Surface>

      <ConfirmDialog
        open={confirmRemoveKey}
        title="Remove API key"
        message="Prompt Refinement will stop working until you add a new key."
        confirmLabel="Remove"
        destructive
        onConfirm={handleClearApiKey}
        onClose={() => setConfirmRemoveKey(false)}
      />

      <Modal open={refineEditing} onClose={() => !refineSaving && setRefineEditing(false)} title="Refinement prompt" maxWidth="680px">
        <p className="text-xs mb-3 text-text2">Injected into every Prompt Refinement call. Markdown supported.</p>
        <Textarea
          value={refineDraft}
          onChange={e => setRefineDraft(e.target.value)}
          aria-label="Refinement prompt"
          className="font-mono text-xs resize-none"
          style={{
            height: '380px',
            padding: '16px',
          }}
          autoFocus
        />
        <div className="flex items-center gap-2 pt-4">
          {!refineContextDefault && (
            <Button variant="ghost" onClick={handleResetRefineContext} disabled={refineSaving}>
              Reset to default
            </Button>
          )}
          <div className="flex-1" />
          <Button onClick={() => setRefineEditing(false)} disabled={refineSaving}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleSaveRefineContext}
            disabled={refineSaving || refineDraft === refineContext}
          >
            {refineSaving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
