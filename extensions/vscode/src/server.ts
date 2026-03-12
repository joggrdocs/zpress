import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import path from 'node:path'
import fs from 'node:fs'

import type * as vscode from 'vscode'

import type { ServerStatus, StatusBar } from './status-bar'

const DEFAULT_PORT = 6174
const BASE_URL = `http://localhost:${String(DEFAULT_PORT)}`

interface DevServerDeps {
  readonly workspaceRoot: string
  readonly statusBar: StatusBar
  readonly outputChannel: vscode.OutputChannel
  readonly onReady: () => void
}

interface DevServer extends vscode.Disposable {
  readonly start: () => void
  readonly stop: () => void
  readonly isRunning: () => boolean
  readonly baseUrl: string
}

const findBinary = (workspaceRoot: string): { readonly cmd: string; readonly args: readonly string[] } => {
  const localBin = path.join(workspaceRoot, 'node_modules', '.bin', 'zpress')
  if (fs.existsSync(localBin)) {
    return { cmd: localBin, args: ['dev'] }
  }
  return { cmd: 'npx', args: ['--yes', 'zpress', 'dev'] }
}

const createDevServer = (deps: DevServerDeps): DevServer => {
  /*
   * VS Code extension state: mutable process reference is unavoidable
   * when managing an external child process lifecycle.
   */
  const state = { process: null as ChildProcess | null, status: 'stopped' as ServerStatus }

  const setStatus = (status: ServerStatus): void => {
    state.status = status
    deps.statusBar.update(status)
  }

  const start = (): void => {
    if (state.process) return

    setStatus('starting')
    deps.outputChannel.show(true)
    deps.outputChannel.appendLine('[zpress] Starting dev server...')

    const { cmd, args } = findBinary(deps.workspaceRoot)
    const child = spawn(cmd, args as string[], {
      cwd: deps.workspaceRoot,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    })

    state.process = child

    child.stdout?.on('data', (data: Buffer) => {
      const text = data.toString()
      deps.outputChannel.append(text)
      if (text.includes(String(DEFAULT_PORT)) || text.includes('listening')) {
        setStatus('running')
        deps.onReady()
      }
    })

    child.stderr?.on('data', (data: Buffer) => {
      deps.outputChannel.append(data.toString())
    })

    child.on('close', (code) => {
      deps.outputChannel.appendLine(`[zpress] Dev server exited (code ${String(code)})`)
      state.process = null
      setStatus('stopped')
    })

    child.on('error', (err) => {
      deps.outputChannel.appendLine(`[zpress] Failed to start: ${err.message}`)
      state.process = null
      setStatus('stopped')
    })
  }

  const stop = (): void => {
    if (!state.process) return
    deps.outputChannel.appendLine('[zpress] Stopping dev server...')
    state.process.kill('SIGTERM')
    state.process = null
    setStatus('stopped')
  }

  return {
    start,
    stop,
    isRunning: () => state.status === 'running',
    baseUrl: BASE_URL,
    dispose: (): void => {
      stop()
    },
  }
}

export { createDevServer, DEFAULT_PORT, BASE_URL }
export type { DevServer }
