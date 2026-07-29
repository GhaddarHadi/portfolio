import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getSiteModel,
  getVariants,
  getVariantBySlug,
  getVariantEntryIds,
  type EntryWithRelations,
} from '@/lib/content'
import { PrintButton } from '@/components/site/PrintButton'
import { dateRange } from '@/lib/format'

export const revalidate = false
// Only the variants that exist at build time are routes; anything else 404s.
// Required by the static export, which cannot resolve unknown params at runtime.
export const dynamicParams = false

export async function generateStaticParams() {
  const variants = await getVariants()
  return variants.map((v) => ({ slug: v.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const variant = await getVariantBySlug(slug)
  return {
    title: variant ? `Resume — ${variant.label}` : 'Resume',
    robots: { index: false, follow: false }, // tailored copies stay out of search
  }
}

/** Pull the most useful strings out of an entry without hardcoding field keys. */
function readEntry(entry: EntryWithRelations, fieldKeys: string[]) {
  const data = entry.data
  const [first, second] = fieldKeys
  return {
    title: first ? String(data[first] ?? '') : '',
    subtitle: second ? String(data[second] ?? '') : '',
  }
}

export default async function ResumeVariantPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const variant = await getVariantBySlug(slug)
  if (!variant) notFound()

  const [{ profile, sections }, chosenIds] = await Promise.all([
    getSiteModel(),
    getVariantEntryIds(variant.id),
  ])

  // Empty selection = include everything visible (the schema's own convention).
  const filter = (entries: EntryWithRelations[]) =>
    chosenIds.length === 0 ? entries : entries.filter((e) => chosenIds.includes(e.id))

  const emailParts = profile?.email_public?.split('@') ?? null

  return (
    <main className="mx-auto max-w-[52rem] px-6 py-10 print:max-w-none print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <span className="lettering text-[10px] text-slate">
          Variant · {variant.label}
        </span>
        <PrintButton />
      </div>

      {/* header */}
      <header className="border-b-2 border-ink pb-4">
        <h1 className="font-display text-3xl font-black uppercase tracking-tight">
          {profile?.full_name}
        </h1>
        {(variant.headline || profile?.headline) && (
          <p className="mt-1.5 text-[15px] text-ink/80">
            {variant.headline || profile?.headline}
          </p>
        )}
        <p className="lettering mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate">
          {profile?.location ? <span>{profile.location}</span> : null}
          {emailParts ? <span>{emailParts[0]}@{emailParts[1]}</span> : null}
          {profile?.socials
            ?.filter((s) => s.url && s.url !== '#')
            .map((s) => (
              <span key={s.label}>{s.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
            ))}
        </p>
      </header>

      {/* sections */}
      <div className="mt-6 space-y-6">
        {sections.map(({ section, entries }) => {
          const shown = filter(entries)
          if (shown.length === 0) return null
          const keys = section.field_schema.filter((f) => f.type === 'text').map((f) => f.key)
          const listKey = section.field_schema.find((f) => f.type === 'string[]')?.key

          return (
            <section key={section.id} className="break-inside-avoid">
              <h2 className="lettering border-b border-ink/30 pb-1 text-[11px] text-redline">
                {section.title}
              </h2>
              <div className="mt-3 space-y-3.5">
                {shown.map((entry) => {
                  const { title, subtitle } = readEntry(entry, keys)
                  const range = dateRange(entry.start_date, entry.end_date)
                  const bullets = listKey ? (entry.data[listKey] as string[] | undefined) : undefined
                  return (
                    <article key={entry.id} className="break-inside-avoid">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                        <h3 className="text-[15px] font-semibold">{title}</h3>
                        {range ? (
                          <span className="lettering text-[9px] text-slate">{range}</span>
                        ) : null}
                      </div>
                      {subtitle ? (
                        <p className="text-[13px] text-slate">{subtitle}</p>
                      ) : null}
                      {bullets?.length ? (
                        <ul className="mt-1.5 space-y-1">
                          {bullets.map((b, i) => (
                            <li key={i} className="flex gap-2 text-[13px] leading-snug text-ink/85">
                              <span aria-hidden className="mt-1.5 h-px w-2 shrink-0 bg-redline" />
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {entry.tags.length ? (
                        <p className="lettering mt-1 text-[9px] text-slate">
                          {entry.tags.map((t) => t.name).join(' · ')}
                        </p>
                      ) : null}
                    </article>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}
