/**
 * Generate JSON Schema from Zod schemas for IDE autocomplete and validation.
 */

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { zodToJsonSchema } from 'zod-to-json-schema'

import { zpressConfigSchema } from '../src/schema.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const packageJsonPath = resolve(__dirname, '../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version: string }
const currentVersion = packageJson.version

try {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const jsonSchema = zodToJsonSchema(zpressConfigSchema as any, {
    name: 'ZpressConfig',
    $refStrategy: 'root',
    target: 'jsonSchema7',
  })

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://raw.githubusercontent.com/joggrdocs/zpress/v${currentVersion}/packages/config/schemas/schema.json`,
    title: 'Zpress Configuration',
    description: 'Configuration file for zpress documentation framework',
    ...jsonSchema,
  }

  const schemasDir = resolve(__dirname, '../schemas')
  mkdirSync(schemasDir, { recursive: true })

  const schemaPath = resolve(schemasDir, 'schema.json')
  writeFileSync(schemaPath, JSON.stringify(schema, null, 2))

  console.log(`✓ Generated JSON Schema at ${schemaPath}`)
} catch (error) {
  console.error('✗ Failed to generate JSON Schema:')
  console.error(getErrorMessage(error))
  process.exit(1)
}

/**
 * Extract error message from unknown error value.
 */
// TODO: replace with shared toError util (https://github.com/joggrdocs/zpress/issues/73)
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
