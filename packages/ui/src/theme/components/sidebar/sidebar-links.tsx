import type React from 'react'
import { match, P } from 'ts-pattern'

import { Icon } from '../shared/icon'

import './sidebar-links.css'

interface SidebarLinkItem {
  readonly text: string
  readonly link: string
  readonly icon?: string | { readonly id: string; readonly color: string }
}

interface SidebarLinksProps {
  readonly items: readonly SidebarLinkItem[]
  readonly position: 'above' | 'below'
}

/**
 * Render a group of sidebar navigation links above or below the main sidebar.
 *
 * @param props - Sidebar links props with items and position
 * @returns React element with sidebar links or null
 */
export function SidebarLinks(props: SidebarLinksProps): React.ReactElement | null {
  return match(props.items.length > 0)
    .with(true, () => (
      <nav
        className={`zp-sidebar-links zp-sidebar-links--${props.position}`}
        aria-label={`Sidebar links ${props.position}`}
      >
        {props.items.map((item) => (
          <SidebarLinkEntry key={item.link} item={item} />
        ))}
      </nav>
    ))
    .otherwise(() => null)
}

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Render an icon from a sidebar link item's icon configuration.
 *
 * @private
 * @param icon - Icon string or object with id/color
 * @returns Icon element or null
 */
function renderIcon(icon: SidebarLinkItem['icon']): React.ReactElement | null {
  return match(icon)
    .with(P.string, (id) => <Icon icon={id} className="zp-sidebar-link-icon" />)
    .with({ id: P.string, color: P.string }, (i) => (
      <Icon icon={i.id} className="zp-sidebar-link-icon" style={{ color: i.color }} />
    ))
    .otherwise(() => null)
}

/**
 * Determine target/rel props for external links.
 *
 * @private
 * @param link - Link URL to check
 * @returns Object with target and rel for external links, empty object otherwise
 */
function externalProps(link: string): { target?: string; rel?: string } {
  return match(link.startsWith('http://') || link.startsWith('https://'))
    .with(true, () => ({ target: '_blank' as const, rel: 'noopener noreferrer' }))
    .otherwise(() => ({}))
}

/**
 * Render a single sidebar link entry with optional icon.
 *
 * @private
 * @param props - Props with sidebar link item
 * @returns Sidebar link element
 */
function SidebarLinkEntry({ item }: { readonly item: SidebarLinkItem }): React.ReactElement {
  return (
    <a href={item.link} className="zp-sidebar-link" {...externalProps(item.link)}>
      {renderIcon(item.icon)}
      <span className="zp-sidebar-link-text">{item.text}</span>
    </a>
  )
}
