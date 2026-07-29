'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { buildEntryDataSchema } from '@/lib/schema/zod-from-fields'
import { FIELD_TYPES, LAYOUTS, type FieldDef } from '@/lib/schema/field-types'
import { parseSection } from '@/lib/content/sections'
import type { Json } from '@/lib/database.types'

type Result = { ok: true; id?: string } | { ok: false; error: string }

/** The guard every action runs first. Returns the session + user, or redirects. */
async function requireUser() {
  const sb = await createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) redirect('/admin/login')
  return { sb, user }
}

async function sectionOf(
  sb: Awaited<ReturnType<typeof createClient>>,
  id: string,
): Promise<FieldDef[]> {
  const { data, error } = await sb.from('sections').select('*').eq('id', id).single()
  if (error) throw error
  return parseSection(data).field_schema
}

function revalidatePublic(slug?: string | null) {
  revalidatePath('/')
  if (slug) revalidatePath(`/work/${slug}`)
}

// ─── Entries ─────────────────────────────────────────────────────────────────

const entryInput = z.object({
  id: z.string().uuid().optional(),
  sectionId: z.string().uuid(),
  slug: z.string().trim().nullable().optional(),
  data: z.record(z.string(), z.unknown()),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  visible: z.boolean(),
  featured: z.boolean(),
  tags: z.array(z.string()),
})

export async function saveEntry(input: z.infer<typeof entryInput>): Promise<Result> {
  const { sb, user } = await requireUser()
  const parsedInput = entryInput.safeParse(input)
  if (!parsedInput.success) return { ok: false, error: 'Invalid form data.' }
  const v = parsedInput.data

  // validate the dynamic data payload against the section's field schema
  const fields = await sectionOf(sb, v.sectionId)
  const dataParsed = buildEntryDataSchema(fields).safeParse(v.data)
  if (!dataParsed.success) {
    return { ok: false, error: dataParsed.error.issues[0]?.message ?? 'Invalid field value.' }
  }

  const row = {
    owner_id: user.id,
    section_id: v.sectionId,
    slug: v.slug ? v.slug : null,
    data: dataParsed.data as unknown as Json,
    start_date: v.start_date || null,
    end_date: v.end_date || null,
    visible: v.visible,
    featured: v.featured,
  }

  let entryId = v.id
  if (v.id) {
    const { error } = await sb
      .from('entries')
      .update({ ...row, updated_at: new Date().toISOString() })
      .eq('id', v.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { data, error } = await sb.from('entries').insert(row).select('id').single()
    if (error) return { ok: false, error: error.message }
    entryId = data.id
  }

  await syncEntryTags(sb, user.id, entryId!, v.tags)
  revalidatePublic(v.slug)
  return { ok: true, id: entryId }
}

export async function deleteEntry(id: string, slug?: string | null): Promise<Result> {
  const { sb } = await requireUser()
  const { error } = await sb.from('entries').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePublic(slug)
  return { ok: true }
}

export async function setEntryVisibility(id: string, visible: boolean): Promise<Result> {
  const { sb } = await requireUser()
  const { error } = await sb.from('entries').update({ visible }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePublic()
  return { ok: true }
}

export async function reorderEntries(orderedIds: string[]): Promise<Result> {
  const { sb } = await requireUser()
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await sb.from('entries').update({ sort_order: i }).eq('id', orderedIds[i])
    if (error) return { ok: false, error: error.message }
  }
  revalidatePublic()
  return { ok: true }
}

async function syncEntryTags(
  sb: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  entryId: string,
  names: string[],
) {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  await sb.from('entry_tags').delete().eq('entry_id', entryId)
  if (clean.length === 0) return
  const { data: tags, error } = await sb
    .from('tags')
    .upsert(
      clean.map((name) => ({ owner_id: ownerId, name })),
      { onConflict: 'owner_id,name' },
    )
    .select('id, name')
  if (error) throw error
  await sb.from('entry_tags').insert(tags!.map((t) => ({ entry_id: entryId, tag_id: t.id })))
}

// ─── Sections ────────────────────────────────────────────────────────────────

const fieldDef = z.object({
  key: z.string().trim().min(1),
  label: z.string().trim().min(1),
  type: z.enum(FIELD_TYPES),
  required: z.boolean().optional(),
  help: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
})

const sectionInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, 'Title is required.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required.')
    .regex(/^[a-z0-9-]+$/, 'Slug: lowercase letters, numbers and dashes only.'),
  subtitle: z.string().nullable().optional(),
  layout: z.enum(LAYOUTS),
  field_schema: z.array(fieldDef),
  visible: z.boolean(),
})

export async function saveSection(input: z.infer<typeof sectionInput>): Promise<Result> {
  const { sb, user } = await requireUser()
  const parsed = sectionInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' }
  const v = parsed.data

  const row = {
    owner_id: user.id,
    title: v.title,
    slug: v.slug,
    subtitle: v.subtitle || null,
    layout: v.layout,
    field_schema: v.field_schema as unknown as Json,
    visible: v.visible,
  }

  if (v.id) {
    const { error } = await sb.from('sections').update(row).eq('id', v.id)
    if (error) return { ok: false, error: error.message }
    revalidatePublic()
    return { ok: true, id: v.id }
  }
  // new section goes to the end
  const { count } = await sb.from('sections').select('*', { count: 'exact', head: true })
  const { data, error } = await sb
    .from('sections')
    .insert({ ...row, sort_order: count ?? 0 })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  revalidatePublic()
  return { ok: true, id: data.id }
}

export async function deleteSection(id: string): Promise<Result> {
  const { sb } = await requireUser()
  const { error } = await sb.from('sections').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePublic()
  return { ok: true }
}

export async function setSectionVisibility(id: string, visible: boolean): Promise<Result> {
  const { sb } = await requireUser()
  const { error } = await sb.from('sections').update({ visible }).eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePublic()
  return { ok: true }
}

export async function reorderSections(orderedIds: string[]): Promise<Result> {
  const { sb } = await requireUser()
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await sb.from('sections').update({ sort_order: i }).eq('id', orderedIds[i])
    if (error) return { ok: false, error: error.message }
  }
  revalidatePublic()
  return { ok: true }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

const socialInput = z.object({ label: z.string(), url: z.string(), icon: z.string().optional() })
const profileInput = z.object({
  full_name: z.string().trim().min(1, 'Name is required.'),
  headline: z.string().nullable().optional(),
  summary: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  email_public: z.string().nullable().optional(),
  socials: z.array(socialInput),
})

export async function saveProfile(input: z.infer<typeof profileInput>): Promise<Result> {
  const { sb, user } = await requireUser()
  const parsed = profileInput.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid.' }
  const v = parsed.data
  const { error } = await sb
    .from('profile')
    .update({
      full_name: v.full_name,
      headline: v.headline || null,
      summary: v.summary || null,
      location: v.location || null,
      email_public: v.email_public || null,
      socials: v.socials as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('owner_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePublic()
  return { ok: true }
}

// ─── Media / images ──────────────────────────────────────────────────────────

export async function uploadEntryImage(entryId: string, formData: FormData): Promise<Result> {
  const { sb, user } = await requireUser()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'No file.' }
  if (!file.type.startsWith('image/')) return { ok: false, error: 'Images only.' }

  const ext = file.name.split('.').pop() ?? 'png'
  const path = `${user.id}/${entryId}/${crypto.randomUUID()}.${ext}`

  // storage via service role (reliable, bypasses storage RLS); table row via session (RLS).
  const admin = createAdminClient()
  const { error: upErr } = await admin.storage
    .from('media')
    .upload(path, file, { contentType: file.type, upsert: false })
  if (upErr) return { ok: false, error: upErr.message }

  const { error } = await sb.from('media').insert({
    owner_id: user.id,
    entry_id: entryId,
    storage_path: path,
    alt: (formData.get('alt') as string) || null,
    kind: 'screenshot',
  })
  if (error) return { ok: false, error: error.message }
  revalidatePublic()
  return { ok: true }
}

export async function deleteMedia(id: string): Promise<Result> {
  const { sb } = await requireUser()
  const { data: row } = await sb.from('media').select('storage_path').eq('id', id).single()
  if (row?.storage_path) {
    await createAdminClient().storage.from('media').remove([row.storage_path])
  }
  const { error } = await sb.from('media').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  revalidatePublic()
  return { ok: true }
}

// ─── Session ─────────────────────────────────────────────────────────────────

export async function signOut() {
  const sb = await createClient()
  await sb.auth.signOut()
  redirect('/admin/login')
}
