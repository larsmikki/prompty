import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { useTheme, THEMES } from '../contexts/ThemeContext'
import { usePrompts } from '../contexts/PromptsContext'
import { api } from '../api'
import './settings.css'

export default function SettingsPage() {
  const { theme, setThemeByName } = useTheme()
  const { prompts, categories, refresh } = usePrompts()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = { prompts, categories }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'promptly-backup.json'
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

  return (
    <div className="settings-page">
      <div className="settings-container">
        <div className="settings-header">
          <Link to="/" className="settings-back-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Back
          </Link>
          <h1>Settings</h1>
        </div>

        <section className="settings-section">
          <h2>Theme</h2>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.name}
                className={`theme-card ${theme.name === t.name ? 'active' : ''}`}
                onClick={() => setThemeByName(t.name)}
              >
                <div className="theme-preview" style={{ background: t.bg }}>
                  {t.previewColors.map((c, i) => (
                    <div key={i} className="theme-preview-bar" style={{ background: c }} />
                  ))}
                </div>
                <span className="theme-name">{t.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h2>Data</h2>
          <p style={{ fontSize: '13px', color: 'var(--settings-text2, #555)', marginBottom: '12px' }}>
            Data is stored on the server and syncs across devices. Export your prompts as JSON for backup.
          </p>
          <div className="settings-buttons">
            <button className="btn btn-secondary" onClick={handleExport}>Export Backup</button>
            <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>Import Backup</button>
            <input ref={fileInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
          </div>
        </section>
      </div>
    </div>
  )
}
