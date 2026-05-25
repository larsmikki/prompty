import { useTheme, THEMES } from '@/contexts/ThemeContext'

export default function ThemePicker({ onSelect }: { onSelect?: (name: string) => void } = {}) {
  const { theme, setThemeByName } = useTheme()
  return (
    <div className="grid grid-cols-5 gap-2">
      {THEMES.map(t => {
        const isActive = t.name === theme.name
        return (
          <button
            key={t.name}
            onClick={() => { setThemeByName(t.name); onSelect?.(t.name) }}
            className="flex flex-col items-center p-1.5 rounded-xl transition-all"
            style={{
              border: `2px solid ${isActive ? theme.accent : 'transparent'}`,
              background: isActive ? `${theme.accent}12` : 'transparent',
              boxShadow: isActive ? `0 0 0 3px ${theme.accent}15` : 'none',
            }}
            aria-pressed={isActive}
            aria-label={t.name}
          >
            <div className="relative w-full aspect-square rounded-lg overflow-hidden flex">
              {t.previewColors.map((c, i) => (
                <div key={i} className="flex-1" style={{ background: c }} />
              ))}
              <div
                className="absolute bottom-0 left-0 right-0 text-center"
                style={{ padding: '4px 5px', background: 'rgba(0,0,0,0.38)' }}
              >
                <span className="text-[10px] font-semibold text-text2" style={{ color: '#fff' }}>{t.name}</span>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
