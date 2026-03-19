import { SocialLinks } from '@rspress/core/theme-original'
import type React from 'react'
import { match } from 'ts-pattern'

import { useZpress } from '../../hooks/use-zpress'

import './site-footer.css'

/**
 * Site-wide footer rendered at the bottom of every page.
 *
 * Displays an optional message, copyright line, and social links
 * from the zpress config. Returns null when no footer config is provided.
 *
 * @returns Footer element or null
 */
export function SiteFooter(): React.ReactElement | null {
  const { zpressFooter } = useZpress()

  return match(zpressFooter)
    .with(undefined, () => null)
    .when(
      (f) => f.message === undefined && f.copyright === undefined && f.socials !== true,
      () => null
    )
    .otherwise((f) => (
      <footer className="zp-site-footer">
        {match(f.socials)
          .with(true, () => (
            <div className="zp-site-footer__socials">
              <SocialLinks />
            </div>
          ))
          .otherwise(() => null)}
        {match(f.message)
          .with(undefined, () => null)
          .otherwise((msg) => (
            <div className="zp-site-footer__message">{msg}</div>
          ))}
        {match(f.copyright)
          .with(undefined, () => null)
          .otherwise((cr) => (
            <div className="zp-site-footer__copyright">{cr}</div>
          ))}
      </footer>
    ))
}
