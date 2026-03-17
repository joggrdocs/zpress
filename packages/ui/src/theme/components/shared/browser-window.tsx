import type React from 'react'
import { match, P } from 'ts-pattern'

import './browser-window.css'

export interface BrowserWindowProps {
  readonly url?: string
  readonly children: React.ReactNode
}

/**
 * Fake browser window chrome that wraps content in a title bar
 * with traffic-light dots and an optional URL pill.
 *
 * @param props - Props with an optional URL string and children to render inside the window
 * @returns React element with browser window chrome
 */
export function BrowserWindow({ url, children }: BrowserWindowProps): React.ReactElement {
  return (
    <div className="browser-window">
      <div className="browser-window__titlebar">
        <div className="browser-window__dots">
          <span className="browser-window__dot browser-window__dot--close" />
          <span className="browser-window__dot browser-window__dot--minimize" />
          <span className="browser-window__dot browser-window__dot--maximize" />
        </div>
        {match(url)
          .with(P.nonNullable, (u) => <span className="browser-window__url">{u}</span>)
          .otherwise(() => null)}
      </div>
      <div className="browser-window__content">{children}</div>
    </div>
  )
}
