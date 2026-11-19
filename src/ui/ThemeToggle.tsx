// The theme button (UX-LY-01, UX-US-06): sun in the dark theme, moon in the light theme.
import { Moon, Sun } from 'lucide-react'
import { useTheme } from './hooks/useTheme.ts'
import type { Theme } from './hooks/useTheme.ts'
import { IconButton } from './primitives/IconButton.tsx'
import { setThemeEverywhere } from './themeActions.ts'
import { blurAfterPointer } from './timelineGeometry.ts'

export function ThemeToggle() {
  const { theme } = useTheme()
  const next: Theme = theme === 'dark' ? 'light' : 'dark'
  return (
    <IconButton label={`Switch to ${next} theme`} shortcut="T" data-testid="theme-toggle" onClick={(e) => {
        setThemeEverywhere(next)
        blurAfterPointer(e)
      }}
    >
      {theme === 'dark' ? <Sun strokeWidth={1.75} aria-hidden="true" /> : <Moon strokeWidth={1.75} aria-hidden="true" />}
    </IconButton>
  )
}
