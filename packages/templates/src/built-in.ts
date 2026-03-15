import type { Template, TemplateType } from './types.ts'

/**
 * All built-in documentation templates keyed by type.
 */
export const BUILT_IN_TEMPLATES: Record<TemplateType, Template> = {
  tutorial: {
    type: 'tutorial',
    label: 'Tutorial',
    hint: 'Guided learning experience',
    body: `# Build Your First {{title}}

<!-- One sentence: what the reader will learn and build. -->

## What You Will Learn

- Learning objective 1
- Learning objective 2
- Learning objective 3

## What You Will Build

A working {{title}} that demonstrates concepts A, B, and C.

## Prerequisites

- Prerequisite 1
- Prerequisite 2

## Steps

### 1. First Step

Brief explanation of what this step does.

\`\`\`bash
command here
\`\`\`

You should see:

\`\`\`
expected output
\`\`\`

### 2. Second Step

Brief explanation.

\`\`\`ts
// Complete, runnable code
\`\`\`

### 3. Third Step

<!-- Continue as needed. Max 7 steps. -->

## Summary

In this tutorial, you learned:

- **Concept A** — what it is and how it works
- **Concept B** — how to apply it

## Next Steps

- [Guide title](../guides/related.md) — apply what you learned
- [Concept title](../concepts/related.md) — deeper understanding
`,
  },

  guide: {
    type: 'guide',
    label: 'Guide',
    hint: 'Step-by-step task instructions',
    body: `# {{title}}

<!-- One sentence: what this guide accomplishes. -->

## Prerequisites

- Requirement 1
- Requirement 2

## Steps

### 1. First Step

Brief explanation.

\`\`\`bash
command here
\`\`\`

### 2. Second Step

Brief explanation.

\`\`\`ts
// Code example if needed
\`\`\`

### 3. Third Step

<!-- Continue as needed. -->

## Verification

How to verify the task completed successfully:

\`\`\`bash
verification-command
\`\`\`

Expected output or behavior.

## Troubleshooting

<!-- Optional: include if there are known failure modes. -->

### Common Issue Name

**Symptom:** Brief description of problem.

**Fix:**

\`\`\`bash
solution-command
\`\`\`

## References

- [Related Doc](../path/to/doc.md)
`,
  },

  quickstart: {
    type: 'quickstart',
    label: 'Quickstart',
    hint: 'Fast-track to working result',
    body: `# Get Started with {{title}}

<!-- One sentence: what the reader will have working by the end. -->

## What You Will Build

A working implementation that does something useful.

## Prerequisites

- Prerequisite 1
- Prerequisite 2

## Steps

### 1. First Step

\`\`\`bash
command here
\`\`\`

### 2. Second Step

\`\`\`bash
command here
\`\`\`

### 3. Third Step

\`\`\`ts
// Code example if needed
\`\`\`

<!-- Max 5 steps. No explanations. Fastest path. -->

## Result

\`\`\`bash
verification-command
\`\`\`

You should see:

\`\`\`
expected output
\`\`\`

## Next Steps

- [Full tutorial](../tutorials/related.md) — learn the concepts
- [Guide title](../guides/related.md) — apply to a real task
`,
  },

  explanation: {
    type: 'explanation',
    label: 'Explanation',
    hint: 'Conceptual background',
    body: `# {{title}}

<!-- One sentence: what this topic is and why it matters. -->

## Architecture

<!-- Optional: include a diagram if it clarifies the design. -->

## Key Concepts

### Concept 1

Explanation with minimal example.

### Concept 2

Explanation with minimal example.

## Usage

### Basic Usage

\`\`\`ts
// Focused example
\`\`\`

### Advanced Usage

<!-- Optional: more complex example. -->

## References

- [Related Guide](../guides/related.md)
- [Related Reference](../reference/related.md)
`,
  },

  reference: {
    type: 'reference',
    label: 'Reference',
    hint: 'Technical descriptions',
    body: `# {{title}}

<!-- One sentence: what this reference covers. -->

## Options

| Option    | Type      | Default     | Description      |
| --------- | --------- | ----------- | ---------------- |
| \`option1\` | \`string\`  | \`"default"\` | What it does     |
| \`option2\` | \`boolean\` | \`false\`     | What it controls |

## Examples

\`\`\`ts
// Minimal usage example
\`\`\`

## References

- [Related Guide](../guides/related.md)
`,
  },

  standard: {
    type: 'standard',
    label: 'Standard',
    hint: 'Rules and conventions',
    body: `# {{title}}

<!-- One sentence: what this standard covers. -->

## Overview

Why this standard exists and what it applies to.

## Rules

### Rule Category

| Rule   | Description   | Example       |
| ------ | ------------- | ------------- |
| Rule A | What it means | Example usage |
| Rule B | What it means | Example usage |

## Examples

### Good

\`\`\`ts
// Following the standard
\`\`\`

### Bad

\`\`\`ts
// Violating the standard
\`\`\`

## Enforcement

| Rule   | Enforced By   | Severity |
| ------ | ------------- | -------- |
| Rule A | Linter / CI   | Error    |
| Rule B | Code review   | Warning  |

## References

- [Related Standard](./related.md)
`,
  },

  troubleshooting: {
    type: 'troubleshooting',
    label: 'Troubleshooting',
    hint: 'Common problems and fixes',
    body: `# {{title}} Troubleshooting

Common issues and fixes for {{title}}.

## Issue Name

**Symptom:** Brief description (1 line).

**Fix:**

\`\`\`bash
solution-command
\`\`\`

## Another Issue

**Symptom:** Brief description.

**Cause:** Why this happens.

**Fix:**

1. First step
2. Second step

## Error: Specific Error Message

**Symptom:** When you see this error:

\`\`\`
Error: Something went wrong
\`\`\`

**Fix:** Explanation or command.
`,
  },

  runbook: {
    type: 'runbook',
    label: 'Runbook',
    hint: 'Operational procedures',
    body: `# {{title}}

<!-- One sentence: what this procedure accomplishes. -->

## When to Use

- Condition A occurs
- Condition B is met

## Prerequisites

- Required access
- Required permissions

## Procedure

### 1. Assess

\`\`\`bash
status-command
\`\`\`

Expected output:

\`\`\`
normal state
\`\`\`

### 2. Execute

\`\`\`bash
operation-command
\`\`\`

**Verify:**

\`\`\`bash
verification-command
\`\`\`

### 3. Confirm

\`\`\`bash
health-check-command
\`\`\`

## Rollback

### 1. Revert

\`\`\`bash
rollback-command
\`\`\`

### 2. Verify

\`\`\`bash
verification-command
\`\`\`

## Escalation

| Condition       | Contact          | Channel    |
| --------------- | ---------------- | ---------- |
| Procedure fails | On-call engineer | #incidents |
`,
  },
}
