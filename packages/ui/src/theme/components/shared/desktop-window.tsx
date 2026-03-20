import { CodeBlockRuntime } from '@rspress/core/theme'
import type React from 'react'
import { match, P } from 'ts-pattern'

import './desktop-window.css'

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

export interface WindowTab {
  /** Tab label text. */
  readonly name: string
  /** Whether this tab is the active/selected tab. */
  readonly active?: boolean
}

// ---------------------------------------------------------------------------
// DesktopWindow — base window chrome
// ---------------------------------------------------------------------------

export interface DesktopWindowProps {
  /** Optional title text displayed in the title bar (12px mono, muted by default). */
  readonly title?: string
  /** Optional tabs rendered in the title bar after the dots. */
  readonly tabs?: readonly WindowTab[]
  /** Optional CSS class name for the window variant (e.g. `zp-window--browser`). */
  readonly variant?: string
  /** Content rendered inside the window body. */
  readonly children: React.ReactNode
}

/**
 * Base macOS-style window chrome with traffic-light dots.
 * All other window components (BrowserWindow, IDEWindow, TerminalWindow)
 * compose this component.
 *
 * @param props - Window configuration
 * @returns React element with desktop window chrome
 */
export function DesktopWindow({
  title,
  tabs,
  variant,
  children,
}: DesktopWindowProps): React.ReactElement {
  const className = match(variant)
    .with(P.nonNullable, (v) => `zp-window ${v}`)
    .otherwise(() => 'zp-window')

  const titlebarCenter = match(tabs)
    .with(P.nonNullable, (t) => (
      <div className="zp-window__tabs">
        {t.map((tab) => {
          const tabClass = match(tab.active)
            .with(true, () => 'zp-window__tab zp-window__tab--active')
            .otherwise(() => 'zp-window__tab')

          return (
            <span key={tab.name} className={tabClass}>
              <span className="zp-window__tab-dot" />
              {tab.name}
            </span>
          )
        })}
      </div>
    ))
    .otherwise(() =>
      match(title)
        .with(P.nonNullable, (t) => <span className="zp-window__title">{t}</span>)
        .otherwise(() => null),
    )

  return (
    <div className={className}>
      <div className="zp-window__titlebar">
        <div className="zp-window__dots">
          <span className="zp-window__dot zp-window__dot--close" />
          <span className="zp-window__dot zp-window__dot--minimize" />
          <span className="zp-window__dot zp-window__dot--maximize" />
        </div>
        {titlebarCenter}
      </div>
      <div className="zp-window__content">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BrowserWindow
// ---------------------------------------------------------------------------

export interface BrowserWindowProps {
  /** URL displayed in the address bar below the title bar. */
  readonly url?: string
  /** Optional tabs rendered in the title bar. */
  readonly tabs?: readonly WindowTab[]
  /** Content rendered inside the window body. */
  readonly children: React.ReactNode
}

/**
 * Browser-style window with traffic-light dots, optional tabs in the
 * title bar, and an optional URL bar below the header.
 *
 * @param props - Props with optional URL, tabs, and children
 * @returns React element with browser window chrome
 */
export function BrowserWindow({ url, tabs, children }: BrowserWindowProps): React.ReactElement {
  return (
    <div className="zp-window zp-window--browser">
      <div className="zp-window__titlebar">
        <div className="zp-window__dots">
          <span className="zp-window__dot zp-window__dot--close" />
          <span className="zp-window__dot zp-window__dot--minimize" />
          <span className="zp-window__dot zp-window__dot--maximize" />
        </div>
        {match(tabs)
          .with(P.nonNullable, (t) => (
            <div className="zp-window__tabs">
              {t.map((tab) => {
                const tabClass = match(tab.active)
                  .with(true, () => 'zp-window__tab zp-window__tab--active')
                  .otherwise(() => 'zp-window__tab')

                return (
                  <span key={tab.name} className={tabClass}>
                    <span className="zp-window__tab-dot" />
                    {tab.name}
                  </span>
                )
              })}
            </div>
          ))
          .otherwise(() => null)}
      </div>
      {match(url)
        .with(P.nonNullable, (u) => (
          <div className="zp-window__url-bar">
            <span className="zp-window__url">{u}</span>
          </div>
        ))
        .otherwise(() => null)}
      <div className="zp-window__content">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// IDEWindow
// ---------------------------------------------------------------------------

export interface IDEFileTab {
  /** Filename displayed in the tab. */
  readonly name: string
  /** Whether this tab is the active/selected tab. */
  readonly active?: boolean
}

export interface IDEWindowProps {
  /** File tabs displayed in the title bar. At least one should be `active`. */
  readonly files: readonly IDEFileTab[]
  /** Raw code string to display. Define as an `export const` in MDX to preserve indentation. */
  readonly code?: string
  /** Language identifier for the code block (e.g. `'ts'`, `'json'`). Only used with `code`. */
  readonly lang?: string
  /** Content rendered inside the window body. Ignored when `code` is provided. */
  readonly children?: React.ReactNode
}

/**
 * IDE-style window with file tabs in the title bar.
 * When using `code`, define it as an `export const` in MDX — inline template
 * literals in JSX attributes are dedented by the MDX compiler.
 *
 * @param props - Props with file tabs and code or children
 * @returns React element with IDE window chrome
 */
export function IDEWindow({ files, code, lang, children }: IDEWindowProps): React.ReactElement {
  const tabs = files.map((file) => ({ name: file.name, active: file.active }))

  const body = match(code)
    .with(P.nonNullable, (c) => (
      <div className="zp-window__code">
        <CodeBlockRuntime lang={match(lang).with(P.nonNullable, (l) => l).otherwise(() => 'text')} code={c} />
      </div>
    ))
    .otherwise(() => children)

  return (
    <DesktopWindow variant="zp-window--ide" tabs={tabs}>
      {body}
    </DesktopWindow>
  )
}

// ---------------------------------------------------------------------------
// TerminalWindow
// ---------------------------------------------------------------------------

export type TerminalColor =
  | 'red'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'cyan'
  | 'magenta'
  | 'white'
  | 'gray'
  | 'success'
  | 'error'
  | 'warn'
  | 'info'
  | 'muted'
  | 'bar'
  | 'step'

export interface TerminalLineConfig {
  /** The text content of this line. */
  readonly text: string
  /** Whether this is a command (prefixed with `$`) or output. Defaults to `'output'`. */
  readonly type?: 'command' | 'output'
}

export interface TerminalWindowProps {
  /** Optional title displayed in the center of the title bar (e.g. `"zsh"`, `"bash"`). */
  readonly title?: string
  /** Lines to render in the terminal. */
  readonly children: React.ReactNode
}

/**
 * Terminal-style window with dark background and monospace text.
 * Use `<Command>` and `<Output>` children to compose the terminal content,
 * or use `<Line>` for colored inline text.
 *
 * @param props - Props with optional title and children
 * @returns React element with terminal window chrome
 */
export function TerminalWindow({ title, children }: TerminalWindowProps): React.ReactElement {
  return (
    <DesktopWindow variant="zp-window--terminal" title={title ?? 'Terminal'}>
      {children}
    </DesktopWindow>
  )
}

// ---------------------------------------------------------------------------
// Terminal child components
// ---------------------------------------------------------------------------

export interface CommandProps {
  /** The command text (rendered after a `$` prompt). */
  readonly children: React.ReactNode
}

/**
 * A terminal command line prefixed with `$`.
 *
 * @param props - Props with command text
 * @returns React element for a terminal command line
 */
export function Command({ children }: CommandProps): React.ReactElement {
  return <span className="zp-term-line zp-term-line--command">{children}</span>
}

export interface OutputProps {
  /** The output text. */
  readonly children: React.ReactNode
}

/**
 * Terminal output text (no prompt prefix).
 *
 * @param props - Props with output text
 * @returns React element for terminal output
 */
export function Output({ children }: OutputProps): React.ReactElement {
  return <span className="zp-term-line zp-term-line--output">{children}</span>
}

export interface LineProps {
  /** Text color. Accepts terminal colors or semantic colors. */
  readonly color?: TerminalColor
  /** Whether the text is bold. */
  readonly bold?: boolean
  /** Whether the text is dimmed. */
  readonly dim?: boolean
  /** The text content. */
  readonly children: React.ReactNode
}

/**
 * Inline colored text for terminal output formatting.
 * Combine multiple `<Line>` elements within `<Output>` for rich formatting.
 *
 * @param props - Props with color, bold, dim, and text content
 * @returns React element with colored terminal text
 */
export function Line({ color, bold, dim, children }: LineProps): React.ReactElement {
  const classes = [
    match(color)
      .with(P.nonNullable, (c) => `zp-term-text--${c}`)
      .otherwise(() => ''),
    match(bold)
      .with(true, () => 'zp-term-text--bold')
      .otherwise(() => ''),
    match(dim)
      .with(true, () => 'zp-term-text--dim')
      .otherwise(() => ''),
  ]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{children}</span>
}
