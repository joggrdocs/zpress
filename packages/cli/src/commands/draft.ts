import fs from 'node:fs/promises'
import path from 'node:path'

import { command } from '@kidd-cli/core'
import { createRegistry, render, toSlug } from '@zpress/templates'
import type { Template } from '@zpress/templates'
import { z } from 'zod'

const registry = createRegistry()

/**
 * Scaffold a new documentation file from a template.
 *
 * Prompts for the doc type and title when not provided via args,
 * then writes the rendered template to the specified output directory.
 */
export const draftCommand = command({
  description: 'Scaffold a new documentation file from a template',
  args: z.object({
    type: z.string().optional(),
    title: z.string().optional(),
    out: z.string().optional().default('.'),
  }),
  handler: async (ctx) => {
    ctx.logger.intro('zpress draft')

    const typeArg = ctx.args.type
    const selectedType: string = registry.has(typeArg ?? '')
      ? (typeArg as string)
      : await ctx.prompts.select<string>({
          message: 'Select a doc type',
          options: registry.list().map((t: Template) => ({
            value: t.type,
            label: t.label,
            hint: t.hint,
          })),
        })

    const template = registry.get(selectedType)
    if (!template) {
      ctx.logger.error(`Unknown template type: ${selectedType}`)
      process.exit(1)
    }

    const title =
      ctx.args.title ??
      (await ctx.prompts.text({
        message: 'Document title',
        placeholder: 'e.g. Authentication',
        validate: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Title is required'
          }
          return undefined
        },
      }))

    const content = render(template, { title })
    const filename = `${toSlug(title)}.md`
    const outDir = path.resolve(process.cwd(), ctx.args.out)
    const filePath = path.join(outDir, filename)

    await fs.mkdir(outDir, { recursive: true })
    await fs.writeFile(filePath, content, 'utf8')

    ctx.logger.success(`Created ${path.relative(process.cwd(), filePath)}`)
    ctx.logger.outro('Done')
  },
})
