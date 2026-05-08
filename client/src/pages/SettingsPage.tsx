import { useRef, useState, useEffect } from 'react'
import { useTheme } from '@/contexts/ThemeContext'
import ThemePicker from '@/components/ThemePicker'
import type { CardView } from '@/contexts/ThemeContext'
import { usePrompts } from '@/contexts/PromptsContext'
import { api } from '@/api'

export default function SettingsPage() {
  const { theme, cardView, setCardView } = useTheme()
  const { prompts, categories, refresh } = usePrompts()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [apiKey, setApiKey] = useState('')
  const [apiKeyMasked, setApiKeyMasked] = useState('')
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false)
  const [apiKeySaving, setApiKeySaving] = useState(false)
  const [apiKeySaved, setApiKeySaved] = useState(false)

  const [model, setModel] = useState('gpt-4o-mini')
  const [modelSaving, setModelSaving] = useState(false)
  const [modelSaved, setModelSaved] = useState(false)

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [refineContext, setRefineContext] = useState('')
  const [refineContextDefault, setRefineContextDefault] = useState(true)
  const [refineContextSaving, setRefineContextSaving] = useState(false)
  const [refineContextSaved, setRefineContextSaved] = useState(false)

  useEffect(() => {
    api.getOpenAIKeyStatus().then(s => {
      setApiKeyConfigured(s.configured)
      setApiKeyMasked(s.masked)
    }).catch(() => {})
    api.getOpenAIModel().then(s => setModel(s.model)).catch(() => {})
    api.getRefineContext().then(s => {
      setRefineContext(s.context)
      setRefineContextDefault(s.isDefault)
    }).catch(() => {})
  }, [])

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return
    setApiKeySaving(true)
    try {
      await api.saveOpenAIKey(apiKey.trim())
      setApiKeyConfigured(true)
      setApiKeyMasked('***' + apiKey.trim().slice(-4))
      setApiKey('')
      setApiKeySaved(true)
      setTimeout(() => setApiKeySaved(false), 2000)
    } finally {
      setApiKeySaving(false)
    }
  }

  const handleSaveModel = async () => {
    if (!model.trim()) return
    setModelSaving(true)
    try {
      await api.saveOpenAIModel(model.trim())
      setModelSaved(true)
      setTimeout(() => setModelSaved(false), 2000)
    } finally {
      setModelSaving(false)
    }
  }

  const handleSaveRefineContext = async () => {
    setRefineContextSaving(true)
    try {
      await api.saveRefineContext(refineContext)
      setRefineContextDefault(false)
      setRefineContextSaved(true)
      setTimeout(() => setRefineContextSaved(false), 2000)
    } finally {
      setRefineContextSaving(false)
    }
  }

  const handleResetRefineContext = async () => {
    await api.resetRefineContext()
    const s = await api.getRefineContext()
    setRefineContext(s.context)
    setRefineContextDefault(true)
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
    } catch {
      setTestResult({ ok: false, message: 'Request failed. Check server logs.' })
    } finally {
      setTesting(false)
    }
  }

  const handleExport = () => {
    const data = { prompts, categories }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'prompty-backup.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result as string)
        await api.importData({
          prompts: data.prompts || [],
          categories: data.categories || [],
        })
        await refresh()
      } catch {
        alert('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const sectionStyle = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '20px',
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: theme.text }}>
          Settings
        </h1>
        <p className="text-sm mt-0.5" style={{ color: theme.text2 }}>
          Customize your Prompty experience.
        </p>
      </div>

      {/* Theme section */}
      <div style={sectionStyle}>
        <h2 className="text-base font-bold mb-1" style={{ color: theme.text }}>Theme</h2>
        <p className="text-xs mb-5" style={{ color: theme.text2 }}>
          Choose how Prompty looks to you.
        </p>
        <ThemePicker />
      </div>

      {/* Library View section */}
      <div style={sectionStyle}>
        <h2 className="text-base font-bold mb-1" style={{ color: theme.text }}>Library view</h2>
        <p className="text-xs mb-5" style={{ color: theme.text2 }}>
          Choose how prompts are displayed in your library.
        </p>
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
            >
              <div className="w-full rounded-lg p-3" style={{ background: theme.surface, border: `1px solid ${theme.border}` }}>
                {preview}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: theme.text }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: theme.text2 }}>{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* OpenAI section */}
      <div style={sectionStyle}>
        <h2 className="text-base font-bold mb-1" style={{ color: theme.text }}>OpenAI</h2>
        <p className="text-xs mb-5" style={{ color: theme.text2 }}>
          Required for Prompt Refinement. Your key is stored locally on the server and never shared.
          {apiKeyConfigured && <span> Current key: <code>{apiKeyMasked}</code></span>}
        </p>

        {/* API Key row */}
        <div className="flex gap-3 items-center mb-3">
          <input
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={apiKeyConfigured ? 'Enter new key to replace...' : 'sk-...'}
            className="flex-1 px-4 py-2.5 text-sm outline-none placeholder:opacity-40"
            style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: '10px' }}
            onKeyDown={e => e.key === 'Enter' && handleSaveApiKey()}
          />
          <button
            onClick={handleSaveApiKey}
            disabled={!apiKey.trim() || apiKeySaving}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40 transition-opacity hover:opacity-90 shrink-0"
            style={{ background: theme.gradient }}
          >
            {apiKeySaved ? 'Saved!' : apiKeySaving ? 'Saving...' : 'Save Key'}
          </button>
        </div>

        {/* Model row */}
        <div className="flex gap-3 items-center mb-4">
          <input
            type="text"
            value={model}
            onChange={e => setModel(e.target.value)}
            placeholder="gpt-4o-mini"
            className="flex-1 px-4 py-2.5 text-sm outline-none placeholder:opacity-40"
            style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: '10px' }}
            onKeyDown={e => e.key === 'Enter' && handleSaveModel()}
          />
          <button
            onClick={handleSaveModel}
            disabled={!model.trim() || modelSaving}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity hover:opacity-80 shrink-0"
            style={{ background: theme.surface2, color: theme.text, border: `1px solid ${theme.border}` }}
          >
            {modelSaved ? 'Saved!' : modelSaving ? 'Saving...' : 'Save Model'}
          </button>
        </div>

        {/* Test button + result */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl disabled:opacity-40 transition-opacity hover:opacity-80"
            style={{ background: theme.surface2, color: theme.text, border: `1px solid ${theme.border}` }}
          >
            {testing ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Testing...
              </>
            ) : 'Test Connection'}
          </button>
          {testResult && (
            <span className="text-xs font-medium" style={{ color: testResult.ok ? '#22c55e' : '#ef4444' }}>
              {testResult.ok ? '✓' : '✗'} {testResult.message}
            </span>
          )}
        </div>
      </div>

      {/* Refinement Context section */}
      <div style={sectionStyle}>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-bold" style={{ color: theme.text }}>Refinement context</h2>
          {!refineContextDefault && (
            <button
              onClick={handleResetRefineContext}
              className="text-xs px-2.5 py-1 rounded-lg hover:opacity-80 transition-opacity"
              style={{ background: theme.surface2, color: theme.text2, border: `1px solid ${theme.border}` }}
            >
              Reset to default
            </button>
          )}
        </div>
        <p className="text-xs mb-3" style={{ color: theme.text2 }}>
          This guide is injected into every Prompt Refinement call as context for the AI.
          {refineContextDefault && <span> Using built-in default.</span>}
        </p>
        <textarea
          value={refineContext}
          onChange={e => setRefineContext(e.target.value)}
          rows={12}
          className="w-full p-4 text-sm resize-y outline-none font-mono"
          style={{ background: theme.surface2, border: `1px solid ${theme.border}`, color: theme.text, borderRadius: '10px' }}
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSaveRefineContext}
            disabled={refineContextSaving}
            className="px-4 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: theme.gradient }}
          >
            {refineContextSaved ? 'Saved!' : refineContextSaving ? 'Saving...' : 'Save Context'}
          </button>
        </div>
      </div>

      {/* Data section */}
      <div style={sectionStyle}>
        <h2 className="text-base font-bold mb-1" style={{ color: theme.text }}>Data</h2>
        <p className="text-xs mb-5" style={{ color: theme.text2 }}>
          Data is stored on the server and syncs across devices. Export your prompts as JSON for backup.
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all hover:opacity-80"
            style={{ background: theme.surface2, color: theme.text, border: `1px solid ${theme.border}` }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Export Settings
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-all hover:opacity-80"
            style={{ background: theme.surface2, color: theme.text, border: `1px solid ${theme.border}` }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Import Settings
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>
    </div>
  )
}
