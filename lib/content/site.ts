import { getProfile, type Profile } from './profile'
import { getSections, type Section } from './sections'
import { getEntriesForSections, type Entry } from './entries'
import { getTagsByEntry, type Tag } from './tags'
import { getMediaByEntry, type Media } from './media'

export type EntryWithRelations = Entry & { tags: Tag[]; media: Media[] }
export type SectionWithEntries = { section: Section; entries: EntryWithRelations[] }

export type SiteModel = {
  profile: Profile | null
  sections: SectionWithEntries[]
}

/**
 * The whole public site as one object: profile + every section in order, each
 * with its entries and their tags/media joined in. This is what the home page
 * renders. Pure reads through the content layer — a page never touches Supabase.
 */
export async function getSiteModel(): Promise<SiteModel> {
  const [profile, sections] = await Promise.all([getProfile(), getSections()])

  const sectionIds = sections.map((s) => s.id)
  const entriesBySection = await getEntriesForSections(sectionIds)

  const allEntryIds = Object.values(entriesBySection)
    .flat()
    .map((e) => e.id)
  const [tagsByEntry, mediaByEntry] = await Promise.all([
    getTagsByEntry(allEntryIds),
    getMediaByEntry(allEntryIds),
  ])

  const composed: SectionWithEntries[] = sections.map((section) => ({
    section,
    entries: (entriesBySection[section.id] ?? []).map((e) => ({
      ...e,
      tags: tagsByEntry[e.id] ?? [],
      media: mediaByEntry[e.id] ?? [],
    })),
  }))

  return { profile, sections: composed }
}
