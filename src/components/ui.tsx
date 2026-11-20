import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export interface SheetAction {
  label: string
  onClick: () => void
  kind?: 'main' | 'ghost' | 'kakao'
  disabled?: boolean
}

interface SheetSpec {
  content: ReactNode
  actions: SheetAction[]
}

interface UI {
  toast: (msg: string) => void
  openSheet: (spec: SheetSpec) => void
  closeSheet: () => void
}

const UICtx = createContext<UI | null>(null)

export function useUI(): UI {
  const ui = useContext(UICtx)
  if (!ui) throw new Error('useUI must be used inside <UIProvider>')
  return ui
}

const btnClass = (k: SheetAction['kind']) => (k === 'main' ? 'btn-main sm' : k === 'kakao' ? 'btn-ghost btn-kakao' : 'btn-ghost')

export function UIProvider({ children }: { children: ReactNode }) {
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetSpec | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const firstBtn = useRef<HTMLButtonElement>(null)

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToastMsg(null), 2400)
  }, [])
  const closeSheet = useCallback(() => setSheet(null), [])
  const openSheet = useCallback((spec: SheetSpec) => setSheet(spec), [])

  useEffect(() => {
    if (!sheet) return
    firstBtn.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setSheet(null)
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [sheet])

  const mainIdx = sheet ? Math.max(0, sheet.actions.findIndex((a) => a.kind === 'main')) : 0

  return (
    <UICtx.Provider value={{ toast, openSheet, closeSheet }}>
      {children}
      {sheet && (
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && closeSheet()}>
          <div className="sheet" role="dialog" aria-modal="true">
            {sheet.content}
            <div className="btnrow" style={sheet.actions.length === 1 ? { gridTemplateColumns: '1fr' } : undefined}>
              {sheet.actions.map((a, i) => (
                <button
                  key={a.label}
                  ref={i === mainIdx ? firstBtn : undefined}
                  type="button"
                  className={btnClass(a.kind)}
                  disabled={a.disabled}
                  onClick={a.onClick}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {toastMsg && (
        <div className="toast" role="status">
          {toastMsg}
        </div>
      )}
    </UICtx.Provider>
  )
}

export function Chip({ pressed, onClick, children, label, disabled, title }: {
  pressed?: boolean
  onClick?: () => void
  children: ReactNode
  label?: string
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={disabled ? { opacity: 0.4 } : undefined}
    >
      {children}
    </button>
  )
}
