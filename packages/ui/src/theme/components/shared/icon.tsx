import catppuccin from '@iconify-json/catppuccin/icons.json' with { type: 'json' }
import devicon from '@iconify-json/devicon/icons.json' with { type: 'json' }
import logos from '@iconify-json/logos/icons.json' with { type: 'json' }
import materialIconTheme from '@iconify-json/material-icon-theme/icons.json' with { type: 'json' }
import mdi from '@iconify-json/mdi/icons.json' with { type: 'json' }
import pixelarticons from '@iconify-json/pixelarticons/icons.json' with { type: 'json' }
import simpleIcons from '@iconify-json/simple-icons/icons.json' with { type: 'json' }
import skillIcons from '@iconify-json/skill-icons/icons.json' with { type: 'json' }
import vscodeIcons from '@iconify-json/vscode-icons/icons.json' with { type: 'json' }
import { addCollection, Icon } from '@iconify/react'

// Register all icon collections for offline Iconify resolution
export const pixelarticonsLoaded = addCollection(cast(pixelarticons))
export const deviconLoaded = addCollection(cast(devicon))
export const mdiLoaded = addCollection(cast(mdi))
export const simpleIconsLoaded = addCollection(cast(simpleIcons))
export const skillIconsLoaded = addCollection(cast(skillIcons))
export const catppuccinLoaded = addCollection(cast(catppuccin))
export const logosLoaded = addCollection(cast(logos))
export const vscodeIconsLoaded = addCollection(cast(vscodeIcons))
export const materialIconThemeLoaded = addCollection(cast(materialIconTheme))

export { Icon }

// ---------------------------------------------------------------------------
// Private
// ---------------------------------------------------------------------------

/**
 * Cast an icon JSON import to the type expected by `addCollection`.
 *
 * @private
 * @param v - Raw icon JSON import
 * @returns Value cast to the addCollection parameter type
 */
function cast(v: unknown): Parameters<typeof addCollection>[0] {
  return v as Parameters<typeof addCollection>[0]
}
