// oxlint-disable no-ternary
import fs from 'node:fs'
import path from 'node:path'

import type {
  Disposable,
  Event,
  EventEmitter,
  FileSystemWatcher,
  GlobPattern,
  RelativePattern,
  ThemeColor,
  ThemeIcon,
  TreeDataProvider,
  TreeItem,
} from 'vscode'

interface SidebarJsonItem {
  readonly text: string
  readonly link?: string
  readonly collapsed?: boolean
  readonly items?: readonly SidebarJsonItem[]
}

type SidebarJson = Readonly<Record<string, readonly SidebarJsonItem[]>>

interface SidebarNode {
  readonly label: string
  readonly link: string | undefined
  readonly children: readonly SidebarNode[]
  readonly collapsed: boolean
}

interface SidebarSection {
  readonly key: string
  readonly title: string
  readonly items: readonly SidebarNode[]
}

interface SectionView extends Disposable {
  readonly viewId: string
  readonly title: string
  readonly treeDataProvider: TreeDataProvider<SidebarNode>
}

interface SidebarDeps {
  readonly workspaceRoot: string
  readonly createWatcher: (pattern: GlobPattern) => FileSystemWatcher
  readonly EventEmitter: new <T>() => EventEmitter<T>
  readonly ThemeIcon: new (id: string, color?: ThemeColor) => ThemeIcon
  readonly ThemeColor: new (id: string) => ThemeColor
  readonly RelativePattern: new (base: string, pattern: string) => RelativePattern
}

interface SidebarMatch {
  readonly sectionIndex: number
  readonly node: SidebarNode
}

interface Sidebar extends Disposable {
  readonly sections: readonly SectionView[]
  readonly activeSectionCount: () => number
  readonly onDidReload: Event<void>
  readonly setBaseUrl: (url: string) => void
  readonly findNodeByPath: (path: string) => SidebarMatch | null
  readonly refreshSections: (exclude: number) => void
}

/**
 * Maximum number of sidebar section views registered in package.json.
 */
const MAX_SECTIONS = 8

const SIDEBAR_RELATIVE = path.join('.zpress', 'content', '.generated', 'sidebar.json')

const HTTP_METHODS: ReadonlySet<string> = new Set([
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'HEAD',
  'OPTIONS',
  'TRACE',
])

/**
 * VS Code theme color IDs mapped to HTTP methods.
 *
 * Uses `charts.*` colors which are available across all VS Code themes
 * and closely match the zpress OpenAPI palette:
 *   GET → green, POST → blue, PUT/PATCH → yellow, DELETE → red
 */
const METHOD_COLORS: Readonly<Record<string, string>> = {
  get: 'charts.green',
  post: 'charts.blue',
  put: 'charts.yellow',
  patch: 'charts.yellow',
  delete: 'charts.red',
  head: 'descriptionForeground',
  options: 'descriptionForeground',
  trace: 'descriptionForeground',
}

/**
 * Detect whether a sidebar label contains HTML (from OpenAPI sidebar entries).
 *
 * @param label - Sidebar label text
 * @returns True if the label contains HTML tags
 */
function containsHtml(label: string): boolean {
  return /<[^>]+>/.test(label)
}

/**
 * Strip HTML tags from a sidebar label, returning plain text.
 * Inserts a space between adjacent closing/opening tags for readability.
 *
 * @param html - HTML sidebar label (e.g. `<span class="...">GET</span><code class="...">/pets</code>`)
 * @returns Plain text label (e.g. `GET /pets`)
 */
function stripHtmlLabel(html: string): string {
  return html
    .replaceAll(/<\/[^>]+>\s*<[^>]+>/g, ' ')
    .replaceAll(/<[^>]+>/g, '')
    .trim()
}

/**
 * Parse an OpenAPI HTML sidebar label into a method + path pair.
 *
 * @param html - HTML sidebar label
 * @returns Parsed method and path, or null if not recognized
 */
function parseOpenApiLabel(
  html: string
): { readonly method: string; readonly path: string } | null {
  const text = stripHtmlLabel(html)
  const spaceIndex = text.indexOf(' ')
  if (spaceIndex === -1) {
    return null
  }
  const method = text.slice(0, spaceIndex)
  const apiPath = text.slice(spaceIndex + 1)
  if (!HTTP_METHODS.has(method)) {
    return null
  }
  return { method, path: apiPath }
}

/**
 * Normalize a URL path for comparison: strip trailing slash, default empty to '/'.
 *
 * @param p - URL path string
 * @returns Normalized path
 */
function normalizePath(p: string): string {
  if (p === '' || p === '/') {
    return '/'
  }
  if (p.endsWith('/')) {
    return p.slice(0, -1)
  }
  return p
}

/**
 * Search a tree of sidebar nodes for one whose link matches the given path.
 *
 * @param nodes - Nodes to search
 * @param targetPath - Normalized URL path to match
 * @returns Matching node or null
 */
function findInNodes(nodes: readonly SidebarNode[], targetPath: string): SidebarNode | null {
  return nodes.reduce<SidebarNode | null>((found, node) => {
    if (found) {
      return found
    }
    if (node.link && normalizePath(node.link) === targetPath) {
      return node
    }
    return findInNodes(node.children, targetPath)
  }, null)
}

/**
 * Build a map from child node to parent node for a tree.
 *
 * @param nodes - Root nodes
 * @param parentMap - Map to populate (mutated for performance)
 * @returns The populated parent map
 */
function buildParentMap(
  nodes: readonly SidebarNode[],
  parentMap: Map<SidebarNode, SidebarNode>
): Map<SidebarNode, SidebarNode> {
  // oxlint-disable-next-line no-unused-expressions -- .map() used for side-effect (populating parent map)
  nodes.map((node) => {
    // oxlint-disable-next-line no-unused-expressions -- .map() used for side-effect (populating parent map)
    node.children.map((child) => {
      parentMap.set(child, node)
      return null
    })
    buildParentMap(node.children, parentMap)
    return null
  })
  return parentMap
}

function getIconId(node: SidebarNode): string {
  if (node.children.length > 0) {
    return 'folder'
  }
  return 'file-text'
}

function titleCase(str: string): string {
  return str
    .split('-')
    .map((word) => {
      if (word.length > 0) {
        return word[0].toUpperCase() + word.slice(1)
      }
      return ''
    })
    .join(' ')
}

function sectionTitle(key: string): string {
  if (key === '/') {
    return 'Pages'
  }
  const segment =
    key
      .replaceAll(/^\/|\/$/g, '')
      .split('/')
      .at(-1) ?? ''
  return titleCase(segment)
}

function readSidebarJson(workspaceRoot: string): SidebarJson | null {
  const filePath = path.join(workspaceRoot, SIDEBAR_RELATIVE)
  // oxlint-disable-next-line security/detect-non-literal-fs-filename
  if (!fs.existsSync(filePath)) {
    return null
  }
  try {
    // oxlint-disable-next-line security/detect-non-literal-fs-filename
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as SidebarJson
  } catch {
    return null
  }
}

function jsonItemToNode(item: SidebarJsonItem): SidebarNode {
  return {
    label: item.text,
    link: item.link,
    collapsed: item.collapsed ?? false,
    children: (item.items ?? []).map(jsonItemToNode),
  }
}

/**
 * Parse sidebar.json keys into deduplicated sections.
 *
 * Keys like `/apps` and `/apps/` are duplicates (Rspress routing).
 * We keep only the canonical form (without trailing slash, except `/`).
 * Order: `/` first, then `/apps`, `/packages`, then the rest alphabetically.
 */
const SECTION_ORDER: readonly string[] = ['/', '/apps', '/packages']

function sectionSortKey(key: string): string {
  const index = SECTION_ORDER.indexOf(key)
  if (index !== -1) {
    return String(index).padStart(4, '0')
  }
  return `9999${key}`
}

function parseSidebarSections(sidebar: SidebarJson): readonly SidebarSection[] {
  return (
    Object.entries(sidebar)
      .map(([key, items]) => {
        if (key.endsWith('/') && key.length > 1) {
          return { key: key.slice(0, -1), items }
        }
        return { key, items }
      })
      /* Deduplicate by keeping only the first entry per normalized key */
      .filter((entry, i, arr) => arr.findIndex((e) => e.key === entry.key) === i)
      .map(({ key, items }) => {
        const nodes = items.map(jsonItemToNode)
        /* For isolated sections, drop the landing-page item whose link matches the section key */
        if (key === '/') {
          return { key, title: sectionTitle(key), items: nodes }
        }
        const filtered = nodes.filter((n) => n.link !== key)
        return { key, title: sectionTitle(key), items: filtered }
      })
      // oxlint-disable-next-line no-array-sort -- intermediate array from .map(), not mutating original
      .sort((a, b) => sectionSortKey(a.key).localeCompare(sectionSortKey(b.key)))
  )
}

/**
 * Creates the sidebar tree view data providers for all documentation sections.
 */
function createSidebar(deps: SidebarDeps): Sidebar {
  const state = {
    sections: [] as readonly SidebarSection[],
    baseUrl: null as string | null,
    parentMap: new Map<SidebarNode, SidebarNode>(),
  }

  const sectionEmitters = Array.from(
    { length: MAX_SECTIONS },
    () => new deps.EventEmitter<SidebarNode | undefined>()
  )

  const reloadEmitter = new deps.EventEmitter<void>()

  function reload(): void {
    const json = readSidebarJson(deps.workspaceRoot)
    if (json) {
      state.sections = parseSidebarSections(json)
    } else {
      state.sections = []
    }
    state.parentMap = new Map()
    // oxlint-disable-next-line no-unused-expressions -- .map() used for side-effect (building parent map)
    state.sections.map((section) => {
      buildParentMap(section.items, state.parentMap)
      return null
    })
    if (state.sections.length > MAX_SECTIONS) {
      console.warn(
        `[zpress] sidebar has ${String(state.sections.length)} sections but only ${String(MAX_SECTIONS)} are supported`
      )
    }
    // oxlint-disable-next-line no-unused-expressions, no-useless-undefined -- EventEmitter.fire requires explicit undefined argument
    sectionEmitters.map((e) => e.fire(undefined))
    reloadEmitter.fire()
  }

  reload()

  const sidebarGlob = new deps.RelativePattern(
    deps.workspaceRoot,
    '.zpress/content/.generated/sidebar.json'
  )
  const watcher = deps.createWatcher(sidebarGlob)
  watcher.onDidChange(reload)
  watcher.onDidCreate(reload)
  watcher.onDidDelete(reload)

  function createSectionProvider(index: number): TreeDataProvider<SidebarNode> {
    return {
      onDidChangeTreeData: sectionEmitters[index].event,

      getTreeItem: (node: SidebarNode): TreeItem => {
        const hasChildren = node.children.length > 0
        const collapsibleState = (() => {
          if (!hasChildren) {
            return 0 /* TreeItemCollapsibleState.None */
          }
          if (node.collapsed) {
            return 1 /* TreeItemCollapsibleState.Collapsed */
          }
          return 2 /* TreeItemCollapsibleState.Expanded */
        })()

        /*
         * OpenAPI items arrive as HTML (e.g. `<span>GET</span><code>/pets</code>`).
         * Strip the HTML and show: colored dot icon, path as label, method as description.
         */
        const openApiParsed = containsHtml(node.label) ? parseOpenApiLabel(node.label) : null

        const label = openApiParsed ? openApiParsed.path : node.label

        const iconPath = (() => {
          if (openApiParsed) {
            const colorId = METHOD_COLORS[openApiParsed.method.toLowerCase()]
            if (colorId) {
              return new deps.ThemeIcon('circle-filled', new deps.ThemeColor(colorId))
            }
            return new deps.ThemeIcon('circle-filled')
          }
          return new deps.ThemeIcon(getIconId(node))
        })()

        const description = openApiParsed ? openApiParsed.method : undefined

        const item: TreeItem = {
          label,
          description,
          collapsibleState,
          iconPath,
        }

        /*
         * Only leaf nodes get a click command — parent nodes expand/collapse on click.
         * This is intentional: clicking a parent expands its children rather than navigating.
         */
        if (node.link && state.baseUrl && !hasChildren) {
          const base = state.baseUrl.replace(/\/$/, '')
          const segment = (() => {
            if (node.link.startsWith('/')) {
              return node.link
            }
            return `/${node.link}`
          })()
          item.command = {
            title: 'Open in zpress',
            command: 'zpress.openPage',
            arguments: [`${base}${segment}`],
          }
        }

        return item
      },

      getParent: (node: SidebarNode): SidebarNode | undefined => state.parentMap.get(node),

      getChildren: (node?: SidebarNode): SidebarNode[] => {
        if (node) {
          return [...node.children]
        }
        const section = state.sections[index]
        if (!section) {
          return []
        }
        return [...section.items]
      },
    }
  }

  const sections: readonly SectionView[] = Array.from({ length: MAX_SECTIONS }, (_, i) => ({
    viewId: `zpress.section.${String(i)}`,
    get title(): string {
      const section = state.sections[i]
      if (section) {
        return section.title
      }
      return ''
    },
    treeDataProvider: createSectionProvider(i),
    dispose: (): void => {
      sectionEmitters[i].dispose()
    },
  }))

  return {
    sections,
    activeSectionCount: () => state.sections.length,
    onDidReload: reloadEmitter.event,
    findNodeByPath: (urlPath: string): SidebarMatch | null => {
      const target = normalizePath(urlPath)
      return state.sections.reduce<SidebarMatch | null>((found, section, i) => {
        if (found) {
          return found
        }
        const node = findInNodes(section.items, target)
        if (node) {
          return { sectionIndex: i, node }
        }
        return null
      }, null)
    },
    refreshSections: (exclude: number): void => {
      // oxlint-disable-next-line no-unused-expressions -- .map() used for side-effect (clearing selection in other sections)
      sectionEmitters.map((e, i) => {
        if (i !== exclude) {
          // oxlint-disable-next-line no-useless-undefined -- EventEmitter.fire requires explicit undefined argument
          e.fire(undefined)
        }
        return null
      })
    },
    setBaseUrl: (url: string): void => {
      state.baseUrl = url
      // oxlint-disable-next-line no-unused-expressions, no-useless-undefined -- EventEmitter.fire requires explicit undefined argument
      sectionEmitters.map((e) => e.fire(undefined))
    },
    dispose: (): void => {
      watcher.dispose()
      reloadEmitter.dispose()
      // oxlint-disable-next-line no-unused-expressions -- dispose all section emitters
      sectionEmitters.map((e) => e.dispose())
    },
  }
}

export { createSidebar, MAX_SECTIONS }
export type { Sidebar, SidebarMatch, SidebarNode }
