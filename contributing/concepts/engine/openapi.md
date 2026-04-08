# OpenAPI Sync

Transforms OpenAPI specs into browsable MDX pages with interactive components.

## Overview

The OpenAPI sync (`sync/openapi.ts`) is a sub-pipeline bolted onto the main sync engine. It collects specs from the config, dereferences `$ref`s, generates one MDX page per operation, and builds sidebar items grouped by tag.

```mermaid
%%{init: {
  'theme': 'base',
  'themeVariables': {
    'primaryColor': '#313244',
    'primaryTextColor': '#cdd6f4',
    'primaryBorderColor': '#6c7086',
    'lineColor': '#89b4fa',
    'secondaryColor': '#45475a',
    'tertiaryColor': '#1e1e2e',
    'background': '#1e1e2e',
    'mainBkg': '#313244',
    'clusterBkg': '#1e1e2e',
    'clusterBorder': '#45475a'
  },
  'flowchart': { 'curve': 'basis', 'padding': 15 }
}}%%
flowchart LR
    SPEC(["openapi.yaml"]) --> MTIME{"mtime changed?"}
    MTIME -- "no + cached" --> CACHED(["Use cached spec"])
    MTIME -- "yes" --> DEREF(["Dereference $refs"])
    CACHED --> EXTRACT(["Extract operations"])
    DEREF --> EXTRACT
    EXTRACT --> GROUP(["Group by tag"])
    GROUP --> MDX(["Generate MDX pages"])
    GROUP --> SIDEBAR(["Build sidebar items"])

    classDef external fill:#313244,stroke:#f5c2e7,stroke-width:2px,color:#cdd6f4
    classDef core fill:#313244,stroke:#89b4fa,stroke-width:2px,color:#cdd6f4
    classDef agent fill:#313244,stroke:#a6e3a1,stroke-width:2px,color:#cdd6f4
    classDef gateway fill:#313244,stroke:#fab387,stroke-width:2px,color:#cdd6f4

    class SPEC external
    class DEREF,EXTRACT,GROUP core
    class MDX,SIDEBAR agent
    class MTIME gateway
    class CACHED agent
```

## Steps

| #   | Step               | What it does                                                                                                                  |
| --- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| 1   | Collect configs    | Gather OpenAPI configs from root `config.openapi` and entry-level `openapi` fields (`apps`, `packages`, and workspace items)  |
| 2   | Check mtime        | Stat the spec file and compare its mtime to the previous manifest to decide whether a shared cached dereference can be reused |
| 3   | Dereference        | Resolve all `$ref`s via `@apidevtools/swagger-parser` (or use cached result)                                                  |
| 4   | Extract operations | Pull operations from paths, group by tag                                                                                      |
| 5   | Generate MDX       | One `.mdx` per operation (renders `<OpenAPIOperation>`) + overview page (`<OpenAPIOverview>`)                                 |
| 6   | Build sidebar      | Sidebar items grouped by tag with configurable layout (`method-path` or `title`)                                              |
| 7   | Emit spec          | Emit dereferenced spec as a virtual `openapi.json` page (written by the sync engine's copy step)                              |

## Caching

In dev mode, a shared `Map<string, unknown>` is created once and threaded through all sync passes. See [Dev Mode — OpenAPI Cache](./dev.md#openapi-cache) for lifecycle details.

## References

- [Engine Overview](./overview.md)
- [Pipeline](./pipeline.md)
- [Incremental Sync](./incremental.md)
- [Dev Mode](./dev.md)
