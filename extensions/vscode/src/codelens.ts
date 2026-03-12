import type * as vscode from 'vscode'

import type { ManifestReader } from './manifest'

interface CodeLensDeps {
  readonly manifestReader: ManifestReader
}

const createCodeLensProvider = (deps: CodeLensDeps): vscode.CodeLensProvider => {
  const emitter = { listeners: [] as Array<() => void> }

  deps.manifestReader.onDidChange(() => {
    emitter.listeners.forEach((fn) => fn())
  })

  return {
    onDidChangeCodeLenses: (listener: () => void): vscode.Disposable => {
      emitter.listeners.push(listener)
      return {
        dispose: (): void => {
          emitter.listeners = emitter.listeners.filter((fn) => fn !== listener)
        },
      }
    },
    provideCodeLenses: (document: vscode.TextDocument): vscode.CodeLens[] => {
      const url = deps.manifestReader.getUrl(document.uri.fsPath)
      if (!url) return []

      const Range = (
        globalThis as unknown as { _vscodeRange: new (sl: number, sc: number, el: number, ec: number) => vscode.Range }
      )._vscodeRange

      /*
       * We can't import vscode Range constructor in a module-level way because
       * esbuild marks 'vscode' as external. Instead, we create a range object
       * that satisfies the interface. The CodeLens API only reads .start/.end.
       */
      const range = {
        start: { line: 0, character: 0 },
        end: { line: 0, character: 0 },
        isEmpty: true,
        isSingleLine: true,
        contains: () => true,
        isEqual: () => true,
        intersection: () => undefined,
        union: () => range,
        with: () => range,
      } as unknown as vscode.Range

      return [
        {
          range,
          command: {
            title: '$(globe) View in zpress',
            command: 'zpress.openInBrowser',
            arguments: [url],
          },
          isResolved: true,
        } as unknown as vscode.CodeLens,
      ]
    },
  }
}

export { createCodeLensProvider }
