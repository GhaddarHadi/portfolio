import { createClient } from '@/lib/supabase/server'
import { getAdminSections } from '@/lib/content/admin'
import { SectionsBoard } from '@/components/admin/SectionsBoard'

export const dynamic = 'force-dynamic'

export default async function AdminHome() {
  const sections = await getAdminSections()

  const sb = await createClient()
  const counts: Record<string, number> = {}
  await Promise.all(
    sections.map(async (s) => {
      const { count } = await sb
        .from('entries')
        .select('*', { count: 'exact', head: true })
        .eq('section_id', s.id)
      counts[s.id] = count ?? 0
    }),
  )

  return (
    <div>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Sections</h1>
      <p className="lettering mb-6 mt-1 text-[10px] text-slate">
        Drag to reorder · toggle to show / hide · click a section to edit its entries
      </p>
      <SectionsBoard initialSections={sections} counts={counts} />
    </div>
  )
}
