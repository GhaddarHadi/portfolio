import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// A file download is a legitimate reason for a route handler (server actions
// can't stream an attachment). Session-guarded; reads all owner data via RLS.
export async function GET() {
  const sb = await createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const [profile, sections, entries, tags, entryTags, media, variants] = await Promise.all([
    sb.from('profile').select('*'),
    sb.from('sections').select('*').order('sort_order'),
    sb.from('entries').select('*').order('sort_order'),
    sb.from('tags').select('*'),
    sb.from('entry_tags').select('*'),
    sb.from('media').select('*'),
    sb.from('variants').select('*'),
  ])

  const payload = {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    sections: sections.data,
    entries: entries.data,
    tags: tags.data,
    entry_tags: entryTags.data,
    media: media.data,
    variants: variants.data,
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="portfolio-export-${new Date()
        .toISOString()
        .slice(0, 10)}.json"`,
    },
  })
}
