import type React from 'react'

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

function resolveIconId(icon: SidebarLinkItem['icon']): string | undefined {
  if (icon === undefined || icon === null) {
    return undefined
  }
  if (typeof icon === 'string') {
    return icon
  }
  return icon.id
}

function isExternal(link: string): boolean {
  return link.startsWith('http://') || link.startsWith('https://')
}

function externalProps(link: string): { target?: string; rel?: string } {
  if (isExternal(link)) {
    return { target: '_blank', rel: 'noopener noreferrer' }
  }
  return {}
}

function renderIcon(icon: SidebarLinkItem['icon']): React.ReactElement | null {
  const iconId = resolveIconId(icon)
  if (iconId) {
    return <Icon icon={iconId} className="zp-sidebar-link-icon" />
  }
  return null
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
  if (props.items.length === 0) {
    return null
  }

  return (
    <nav className={`zp-sidebar-links zp-sidebar-links--${props.position}`}>
      {props.items.map((item) => (
        <SidebarLinkEntry key={item.link} item={item} />
      ))}
    </nav>
  )
}
