import fs from 'node:fs'
import path from 'node:path'

import type * as vscode from 'vscode'

import { BASE_URL } from './server'

interface ManifestFileEntry {
  readonly source: string
  readonly sourceMtime: number
  readonly contentHash: string
  readonly outputPath: string
}

interface Manifest {
  readonly files: Record<string, ManifestFileEntry>
  readonly timestamp: number
}

interface ManifestReader extends vscode.Disposable {
  readonly getUrl: (fsPath: string) => string | undefined
  readonly isTracked: (fsPath: string) => boolean
  readonly reload: () => void
  readonly onDidChange: vscode.Event<void>
}

const MANIFEST_RELATIVE = path.join('.zpress', 'content', '.generated', 'manifest.json')

const readManifest = (workspaceRoot: string): Manifest | null => {
  const manifestPath = path.join(workspaceRoot, MANIFEST_RELATIVE)
  if (!fs.existsSync(manifestPath)) return null
  try {
    const raw = fs.readFileSync(manifestPath, 'utf8')
    return JSON.parse(raw) as Manifest
  } catch {
    return null
  }
}

const buildSourceMap = (
  manifest: Manifest | null,
  workspaceRoot: string,
): ReadonlyMap<string, string> => {
  if (!manifest) return new Map()

  return new Map(
    Object.values(manifest.files)
      .filter((entry): entry is ManifestFileEntry & { source: string } => !!entry.source)
      .map((entry) => {
        const absoluteSource = path.resolve(workspaceRoot, entry.source)
        const urlPath = entry.outputPath.replace(/\.md$/, '')
        const url = `${BASE_URL}/${urlPath}`
        return [absoluteSource, url] as const
      }),
  )
}

const createManifestReader = (
  workspaceRoot: string,
  createWatcher: (pattern: vscode.GlobPattern) => vscode.FileSystemWatcher,
  EventEmitter: new () => vscode.EventEmitter<void>,
): ManifestReader => {
  const emitter = new EventEmitter()
  const state = { sourceMap: buildSourceMap(readManifest(workspaceRoot), workspaceRoot) }

  const reload = (): void => {
    state.sourceMap = buildSourceMap(readManifest(workspaceRoot), workspaceRoot)
    emitter.fire()
  }

  const manifestGlob = path.join(workspaceRoot, MANIFEST_RELATIVE)
  const watcher = createWatcher(manifestGlob)
  watcher.onDidChange(reload)
  watcher.onDidCreate(reload)
  watcher.onDidDelete(reload)

  return {
    getUrl: (fsPath: string): string | undefined => state.sourceMap.get(fsPath),
    isTracked: (fsPath: string): boolean => state.sourceMap.has(fsPath),
    reload,
    onDidChange: emitter.event,
    dispose: (): void => {
      watcher.dispose()
      emitter.dispose()
    },
  }
}

export { createManifestReader }
export type { ManifestReader }
