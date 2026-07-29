import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getAdminSection,
  getAdminEntries,
  getAdminEntryTags,
  getAdminEntryMedia,
} from '@/lib/content/admin'
import { EntriesBoard } from '@/components/admin/EntriesBoard'

export const dynamic = 'force-dynamic'

export default async function SectionEntriesPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const section = await getAdminSection(id)
  if (!section) notFound()

  const entries = await getAdminEntries(id)
  const drafts = await Promise.all(
    entries.map(async (entry) => ({
      entry,
      tags: await getAdminEntryTags(entry.id),
      media: await getAdminEntryMedia(entry.id),
    })),
  )

  return (
    <div>
      <Link href="/admin" className="lettering text-[10px] text-slate hover:text-redline">
        ← Sections
      </Link>
      <h1 className="mt-2 font-display text-2xl font-bold uppercase tracking-wide">
        {section.title}
      </h1>
      <p className="lettering mb-6 mt-1 text-[10px] text-slate">
        {section.layout} · {section.field_schema.length} fields
      </p>
      <EntriesBoard section={section} initialDrafts={drafts} />
    </div>
  )
}
