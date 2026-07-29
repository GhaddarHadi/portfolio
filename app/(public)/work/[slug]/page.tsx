import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getAllEntrySlugs,
  getEntryBySlug,
  getSections,
  getTagsByEntry,
  getMediaByEntry,
} from '@/lib/content'
import { Chip } from '@/components/site/Chip'
import { FieldValue } from '@/components/site/FieldValue'
import { Gallery } from '@/components/layouts/Gallery'
import { pickTitle } from '@/components/layouts/entry-view'
import { dateRange } from '@/lib/format'

export const revalidate = false
// Only the projects that exist at build time are routes; anything else 404s.
export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await getAllEntrySlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const entry = await getEntryBySlug(slug)
  if (!entry) return {}
  const name = (entry.data['name'] as string) ?? slug
  const tagline = entry.data['tagline'] as string | undefined
  return { title: name, description: tagline }
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const entry = await getEntryBySlug(slug)
  if (!entry) notFound()

  const sections = await getSections()
  const section = sections.find((s) => s.id === entry.section_id)
  if (!section) notFound()

  const [tagsByEntry, mediaByEntry] = await Promise.all([
    getTagsByEntry([entry.id]),
    getMediaByEntry([entry.id]),
  ])
  const tags = tagsByEntry[entry.id] ?? []
  const media = mediaByEntry[entry.id] ?? []

  const title = pickTitle(section.field_schema, entry.data)
  const titleKey = title?.def?.key
  const taglineDef = section.field_schema.find((f) => f.type === 'text' && f.key !== titleKey)
  const tagline = taglineDef ? (entry.data[taglineDef.key] as string) : ''

  const links = section.field_schema.filter(
    (f) => f.type === 'url' && entry.data[f.key],
  )
  const blocks = section.field_schema.filter(
    (f) =>
      ['markdown', 'textarea', 'string[]'].includes(f.type) &&
      entry.data[f.key] != null &&
      entry.data[f.key] !== '' &&
      (!Array.isArray(entry.data[f.key]) || (entry.data[f.key] as unknown[]).length > 0),
  )

  const range = dateRange(entry.start_date, entry.end_date)

  return (
    <article className="mx-auto max-w-3xl">
      <Link
        href="/#projects"
        className="lettering text-[10px] text-slate hover:text-redline"
      >
        ← Back to sheet
      </Link>

      {media[0] ? (
        <div className="mt-5 overflow-hidden border border-ink/15 bg-ink/[0.03]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media[0].url}
            alt={media[0].alt ?? ''}
            className="mx-auto max-h-64 w-full object-contain p-6"
          />
        </div>
      ) : null}

      <header className="mt-5 border-b border-ink/25 pb-6">
        {range ? <p className="lettering text-xs text-slate">{range}</p> : null}
        <h1 className="mt-2 font-display text-4xl font-black uppercase leading-[0.95] sm:text-5xl">
          {title?.value ? String(title.value) : slug}
        </h1>
        {tagline ? <p className="mt-3 text-lg text-ink/80">{tagline}</p> : null}

        {links.length ? (
          <div className="mt-5 flex flex-wrap gap-3">
            {links.map((f) => (
              <a
                key={f.key}
                href={String(entry.data[f.key])}
                target="_blank"
                rel="noreferrer"
                className="lettering border border-ink/30 bg-panel px-3 py-2 text-[10px] text-ink transition-colors hover:border-redline hover:text-redline"
              >
                {f.label} →
              </a>
            ))}
          </div>
        ) : null}
      </header>

      <div className="mt-8 space-y-8">
        {blocks.map((f) => (
          <section key={f.key}>
            <h2 className="lettering mb-2 text-[11px] text-redline">{f.label}</h2>
            <FieldValue def={f} value={entry.data[f.key]} />
          </section>
        ))}

        {tags.length ? (
          <section>
            <h2 className="lettering mb-2 text-[11px] text-redline">Stack</h2>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <Chip key={t.id} label={t.name} kind={t.kind} />
              ))}
            </div>
          </section>
        ) : null}

        {/* media[0] is already shown as the cover above */}
        {media.length > 1 ? (
          <section>
            <h2 className="lettering mb-2 text-[11px] text-redline">Sheets</h2>
            <Gallery section={section} entries={[{ ...entry, tags, media: media.slice(1) }]} />
          </section>
        ) : null}
      </div>
    </article>
  )
}
