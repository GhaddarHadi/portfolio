import type { NextConfig } from 'next'

/**
 * Two build modes.
 *
 *  - default        : full app, including /admin. Used for `npm run dev`.
 *  - PAGES_BUILD=1  : static export of the PUBLIC site only, for GitHub Pages.
 *                     Pages serves files, not a server, so the admin routes,
 *                     the auth callback and the proxy are moved aside before
 *                     this build runs (see scripts/build-pages.mjs).
 *
 * BASE_PATH matters because a project repo is served from a subdirectory
 * (…github.io/portfolio) while a user site is served from the root. Set it in
 * the workflow; leave empty for a root deployment.
 */
const isPages = process.env.PAGES_BUILD === '1'
const basePath = process.env.BASE_PATH ?? ''

const nextConfig: NextConfig = {
  ...(isPages
    ? {
        output: 'export' as const,
        // Pages has no image optimiser
        images: { unoptimized: true },
        // emit /work/foo/index.html rather than /work/foo.html, so links resolve
        // without a server rewriting extensions
        trailingSlash: true,
        ...(basePath ? { basePath, assetPrefix: basePath } : {}),
      }
    : {}),
}

export default nextConfig
