---
'@zpress/ui': patch
---

Fix branch tag rendering in navbar on home page

- Replace `globalUIComponents` + DOM manipulation with Rspress `beforeNavMenu` layout slot
- Add custom `Layout` override that injects `BranchTag` via the slot prop
- Remove `useEffect`/`useRef` DOM relocation from `BranchTag`, making it a pure render component
