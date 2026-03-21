interface ImportMetaEnv {
  /**
   * Set to `true` by Rspress during the SSG-MD rendering pass
   * (the build step that generates per-page `.md` files and `llms.txt`).
   * Always `false` during normal browser and HTML SSR rendering.
   */
  readonly SSG_MD: boolean
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
