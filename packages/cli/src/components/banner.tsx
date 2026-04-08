/*
|==========================================================================
| Banner
|==========================================================================
|
| Styled zpress logo banner using cfonts block font with purple gradient.
|
*/

import BigText from 'ink-big-text'
import Gradient from 'ink-gradient'

/**
 * Brand colors for the zpress purple gradient (light to dark).
 */
const GRADIENT_COLORS = ['#c4b5fd', '#8b5cf6', '#7c3aed'] as const

/**
 * Render the zpress logo banner with purple gradient coloring.
 *
 * @returns React element with the styled zpress banner
 */
export function Banner(): React.ReactElement {
  return (
    <Gradient colors={[...GRADIENT_COLORS]}>
      <BigText text="zpress" font="block" />
    </Gradient>
  )
}
