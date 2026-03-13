/**
 * Generate JSON Schema from Zod schemas for IDE autocomplete and validation.
 */

import { writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

import { zodToJsonSchema } from 'zod-to-json-schema'

import { zpressConfigSchema } from '../src/schema.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const CURRENT_VERSION = '0'

try {
  const jsonSchema = zodToJsonSchema(zpressConfigSchema, {
    name: 'ZpressConfig',
    $refStrategy: 'none',
    target: 'jsonSchema7',
  })

  const schema = {
    $schema: 'http://json-schema.org/draft-07/schema#',
    $id: `https://raw.githubusercontent.com/joggrdocs/zpress/v${CURRENT_VERSION}/packages/config/schemas/schema.json`,
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
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
