import fs from 'node:fs/promises'

import { capitalize, words } from 'es-toolkit'
import matter from 'gray-matter'
import { match, P } from 'ts-pattern'

/**
 * Derive display text for a page.
 *
 * - `'auto'` (default) — frontmatter > heading > filename fallback chain
 * - `'filename'` — kebab-to-title from the slug
 * - `'heading'` — first `# heading` in the file, falls back to filename
 * - `'frontmatter'` — `title` from YAML frontmatter only, falls back to heading
 *
 * @param sourcePath - Absolute path to the source markdown file
 * @param slug - Filename slug (without extension)
 * @param mode - Text derivation strategy
 * @returns Derived display text for sidebar/nav
 */
export function deriveText(
  sourcePath: string,
  slug: string,
  mode: 'auto' | 'filename' | 'heading' | 'frontmatter'
): Promise<string> {
  return match(mode)
    .with('auto', () => deriveFromFrontmatter(sourcePath, slug))
    .with('frontmatter', () => deriveFromFrontmatter(sourcePath, slug))
    .with('heading', () => deriveFromHeading(sourcePath, slug))
    .with('filename', () => Promise.resolve(kebabToTitle(slug)))
    .exhaustive()
}

/**
 * Convert a kebab-case slug to title case.
 *
 * @param slug - Kebab-case string (e.g. `"add-api-route"`)
 * @returns Title-cased string (e.g. `"Add Api Route"`)
 */
export function kebabToTitle(slug: string): string {
  return words(slug).map(capitalize).join(' ')
}

/**
 * Derive text from YAML frontmatter `title` field, falling back to first heading,
 * then to filename. Reads the file once and reuses the content for heading extraction.
 */
async function deriveFromFrontmatter(sourcePath: string, fallbackSlug: string): Promise<string> {
  const content = await fs.readFile(sourcePath, 'utf8')
  const parsed = matter(content)

  return match(parsed.data.title)
    .with(P.string.minLength(1), (title) => title)
    .otherwise(() => extractHeading(parsed.content, fallbackSlug))
}

/**
 * Derive text from the first `# heading` in the file.
 * Falls back to kebab-to-title of the slug when no heading is found.
 */
async function deriveFromHeading(sourcePath: string, fallbackSlug: string): Promise<string> {
  const content = await fs.readFile(sourcePath, 'utf8')
  const { content: body } = matter(content)
  return extractHeading(body, fallbackSlug)
}

/**
 * Extract the first `# heading` from markdown body content.
 * Falls back to kebab-to-title of the slug when no heading is found.
 *
 * @param body - Markdown content with frontmatter already stripped
 * @param fallbackSlug - Slug to use when no heading is found
 * @returns Heading text or title-cased slug
 */
function extractHeading(body: string, fallbackSlug: string): string {
  const heading = body.match(/^#\s+(.+)$/m)
  return match(heading)
    .with(P.nonNullable, (h) => h[1].trim())
    .otherwise(() => kebabToTitle(fallbackSlug))
}
