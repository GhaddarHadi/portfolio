import type { Metadata } from 'next'
import { getSiteModel, getProfile, getVariants } from '@/lib/content'
import { getLayout } from '@/components/layouts/registry'
import { SectionHeader } from '@/components/site/SectionHeader'
import { Hero } from '@/components/hero/Hero'
import { ObfuscatedEmail } from '@/components/site/ObfuscatedEmail'
import { JsonLd } from '@/components/site/JsonLd'
import { ContourField } from '@/components/site/ContourField'
import { Reveal } from '@/components/site/Reveal'
import { CommandPalette, type CommandItem } from '@/components/site/CommandPalette'

// Fully static; content refreshes via on-demand revalidation on publish (Phase 3).
export const revalidate = false

export async function generateMetadata(): Promise<Metadata> {
  const p = await getProfile()
  return {
    title: p?.full_name ? { absolute: p.full_name } : undefined,
    description: p?.headline ?? undefined,
  }
}

export default async function Home() {
  const { profile, sections } = await getSiteModel()
  const variants = await getVariants()

  // Reverse it here, on the server. The reversed string is the only form that
  // reaches the HTML — see ObfuscatedEmail for why the parts must not be props.
  const emailReversed =
    profile?.email_public && profile.email_public.includes('@')
      ? [...profile.email_public].reverse().join('')
      : null

  // jobTitle for structured data, derived from the experience section (no hardcoding).
  const experience = sections.find((s) => s.section.slug === 'experience')
  const jobTitle = experience?.entries[0]?.data['role'] as string | undefined

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile?.full_name,
    ...(jobTitle ? { jobTitle } : {}),
    ...(profile?.location ? { address: { '@type': 'PostalAddress', addressLocality: profile.location } } : {}),
    ...(profile?.socials?.length
      ? { sameAs: profile.socials.map((s) => s.url).filter((u) => u && u !== '#') }
      : {}),
  }

  // Palette entries come from the same data the page renders.
  const commands: CommandItem[] = [
    ...sections
      .filter((s) => s.entries.length > 0)
      .map((s) => ({ label: s.section.title, href: `#${s.section.slug}`, group: 'Sections' })),
    ...sections
      .flatMap((s) => s.entries)
      .filter((e) => e.slug)
      .map((e) => ({
        label: String(e.data['name'] ?? e.slug),
        href: `/work/${e.slug}`,
        group: 'Work',
        hint: 'Project',
      })),
    ...variants.map((v) => ({
      label: `Resume — ${v.label}`,
      href: `/r/${v.slug}`,
      group: 'Resume',
      hint: 'PDF',
    })),
  ]

  return (
    <>
      <JsonLd data={jsonLd} />
      <CommandPalette items={commands} />

      {/* ── Hero ─────────────────────────────────────────────────────────────
          Full-bleed dark band across the whole viewport — the one loud moment
          on an otherwise quiet page. */}
      <section className="on-dark relative w-full overflow-hidden bg-[#0f1319] px-5 py-16 sm:px-10 sm:py-24 lg:px-16">
        {/* contour field — fills the panel, never intercepts clicks */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <ContourField className="h-full w-full" />
        </div>
        {/* scrim: darkens the middle of the panel so the headline and the pole's
            leader lines keep their contrast no matter what sits behind them */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,19,25,0.82)_0%,rgba(15,19,25,0.5)_55%,transparent_100%)]"
        />

        <div className="relative mx-auto grid max-w-[1600px] items-center gap-12 lg:grid-cols-[1.35fr_1fr]">

        <div>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.92] tracking-tight sm:text-7xl">
            {profile?.full_name ?? 'Portfolio'}
          </h1>
          {profile?.location ? (
            <p className="lettering mt-3 flex items-center gap-2 text-xs text-redline">
              <span aria-hidden className="h-px w-6 bg-redline" />
              {profile.location}
            </p>
          ) : null}
          {profile?.headline ? (
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink/80">{profile.headline}</p>
          ) : null}

          <div className="mt-7 flex flex-wrap items-center gap-2.5">
            {/* only render links that actually go somewhere — a dead "#" link
                on a page a recruiter is reading is worse than no link */}
            {profile?.socials
              ?.filter((s) => s.url && s.url !== '#')
              .map((s) => (
                <a
                  key={s.label}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="lettering rounded-[2px] border border-ink/35 px-3 py-2 text-[11px] text-ink transition-colors hover:border-redline hover:text-redline"
                >
                  {s.label}
                </a>
              ))}
            {emailReversed ? (
              <ObfuscatedEmail
                reversed={emailReversed}
                // normal-case: an address in all caps with wide tracking is
                // harder to read than the address itself
                className="rounded-[2px] border border-ink/35 px-3 py-2 font-mono text-[11px] normal-case tracking-normal text-ink transition-colors hover:border-redline hover:text-redline"
              />
            ) : null}
          </div>

          {variants.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {variants.map((v) => (
                <a
                  key={v.slug}
                  href={`/r/${v.slug}`}
                  className="lettering rounded-[2px] border border-ink/30 bg-panel px-3 py-2 text-[10px] transition-colors hover:border-redline hover:text-redline"
                >
                  Resume — {v.label} ↓
                </a>
              ))}
            </div>
          ) : null}
        </div>

          <div className="mx-auto w-full max-w-[340px] lg:max-w-none">
            <Hero labelOverride={profile?.theme?.['hero_labels']} />
          </div>
        </div>
      </section>

      {/* ── Sections ─────────────────────────────────────────── */}
      <div className="mx-auto max-w-[1600px] space-y-20 px-5 py-20 sm:px-10 lg:px-16">
        {sections.map(({ section, entries }, i) => {
          if (entries.length === 0) return null
          const Layout = getLayout(section.layout)
          return (
            <Reveal key={section.id}>
              <section id={section.slug} aria-label={section.title}>
                <SectionHeader
                  index={i + 1}
                  title={section.title}
                  subtitle={section.subtitle}
                  layout={section.layout}
                />
                <Layout section={section} entries={entries} />
              </section>
            </Reveal>
          )
        })}
      </div>
    </>
  )
}
