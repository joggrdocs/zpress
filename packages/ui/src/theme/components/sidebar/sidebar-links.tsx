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

function renderIcon(icon: SidebarLinkItem['icon']): React.ReactElement | null {
  return match(icon)
    .with(P.string, (id) => <Icon icon={id} className="zp-sidebar-link-icon" />)
    .with({ id: P.string }, (i) => <Icon icon={i.id} className="zp-sidebar-link-icon" />)
    .otherwise(() => null)
}

function externalProps(link: string): { target?: string; rel?: string } {
  return match(link.startsWith('http://') || link.startsWith('https://'))
    .with(true, () => ({ target: '_blank' as const, rel: 'noopener noreferrer' }))
    .otherwise(() => ({}))
}

function SidebarLinkEntry({ item }: { readonly item: SidebarLinkItem }): React.ReactElement {
  return (
    <a href={item.link} className="zp-sidebar-link" {...externalProps(item.link)}>
      {renderIcon(item.icon)}
      <span className="zp-sidebar-link-text">{item.text}</span>
    </a>
  )
}

export function SidebarLinks(props: SidebarLinksProps): React.ReactElement | null {
  return match(props.items.length > 0)
    .with(true, () => (
      <nav className={`zp-sidebar-links zp-sidebar-links--${props.position}`}>
        {props.items.map((item) => (
          <SidebarLinkEntry key={item.link} item={item} />
        ))}
      </nav>
    ))
    .otherwise(() => null)
}
