import { visit } from 'unist-util-visit'

/**
 * Remark plugin that overrides the HAST output properties on `math` and
 * `inlineMath` MDAST nodes created by `remark-math`.
 *
 * By default, remark-rehype converts these nodes into
 * `<code class="language-math ...">` elements, which causes shiki to attempt
 * syntax highlighting for the unknown `math` language. This plugin sets
 * `data.hName` to `div`/`span` so remark-rehype produces elements that shiki
 * ignores, while rehype-katex still matches them via the `math-display` /
 * `math-inline` class names.
 *
 * Must run after `remark-math` in the remark plugin chain.
 *
 * @returns Unified transformer
 */
export function remarkMathToDiv(): (tree: unknown) => void {
  return (tree: unknown) => {
    visit(tree as Parameters<typeof visit>[0], 'math', (node: Record<string, unknown>) => {
      node.data = {
        ...(node.data as Record<string, unknown> | undefined),
        hName: 'div',
        hProperties: { className: ['math', 'math-display'] },
        hChildren: [{ type: 'text', value: node.value as string }],
      }
    })

    visit(tree as Parameters<typeof visit>[0], 'inlineMath', (node: Record<string, unknown>) => {
      node.data = {
        ...(node.data as Record<string, unknown> | undefined),
        hName: 'span',
        hProperties: { className: ['math', 'math-inline'] },
        hChildren: [{ type: 'text', value: node.value as string }],
      }
    })
  }
}
