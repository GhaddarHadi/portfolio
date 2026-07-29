/**
 * Seed script — expresses Hadi's resume as data in the schema-driven tables.
 *
 * Runs OUTSIDE the Next.js runtime (via tsx), so it builds its own
 * service-role client instead of importing lib/supabase (which is server-only).
 *
 * Usage:
 *   1. Log in once at http://localhost:3000/admin/login so your auth user exists
 *   2. npm run seed
 *
 * Idempotent: re-running upserts the profile/sections/tags and REBUILDS the
 * entries for the seeded sections. (It only touches the sections it manages —
 * anything you add later in the dashboard under other sections is untouched.)
 */
import { config } from 'dotenv'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '../lib/database.types'
import type { FieldDef } from '../lib/schema/field-types'

config({ path: path.resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const ownerEmail = (process.env.SEED_OWNER_EMAIL ?? 'hadimghaddar@gmail.com').toLowerCase()

if (!url || !serviceKey) {
  console.error('\n✗ Missing env. Copy .env.local.example to .env.local and fill it in.\n')
  process.exit(1)
}

const sb = createClient<Database>(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

// --- section definitions (field_schema drives the renderer + admin form) -----
const sections: {
  slug: string
  title: string
  layout: Database['public']['Tables']['sections']['Row']['layout']
  sort_order: number
  field_schema: FieldDef[]
}[] = [
  {
    slug: 'experience',
    title: 'Experience',
    layout: 'timeline',
    sort_order: 1,
    field_schema: [
      { key: 'role', label: 'Role', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'bullets', label: 'Highlights', type: 'string[]' },
      { key: 'stack', label: 'Stack', type: 'tags' },
    ],
  },
  {
    slug: 'projects',
    title: 'Projects',
    layout: 'card_grid',
    sort_order: 2,
    field_schema: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'tagline', label: 'Tagline', type: 'text' },
      { key: 'problem', label: 'Problem', type: 'markdown' },
      { key: 'approach', label: 'Approach', type: 'markdown' },
      { key: 'outcome', label: 'Outcome', type: 'markdown' },
      { key: 'cover', label: 'Cover image', type: 'image' },
      { key: 'demo_url', label: 'Live demo', type: 'url' },
      { key: 'repo_url', label: 'Repository', type: 'url' },
      { key: 'stack', label: 'Stack', type: 'tags' },
    ],
  },
  {
    slug: 'skills',
    title: 'Skills',
    layout: 'chip_cloud',
    sort_order: 3,
    field_schema: [
      { key: 'group', label: 'Group', type: 'text' },
      { key: 'items', label: 'Items', type: 'string[]' },
    ],
  },
  {
    slug: 'certifications',
    title: 'Certifications',
    layout: 'chip_cloud',
    sort_order: 4,
    field_schema: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'issuer', label: 'Issuer', type: 'text' },
      { key: 'credential_id', label: 'Credential ID', type: 'text' },
    ],
  },
  {
    slug: 'education',
    title: 'Education',
    layout: 'timeline',
    sort_order: 5,
    field_schema: [
      { key: 'degree', label: 'Degree', type: 'text', required: true },
      { key: 'school', label: 'School', type: 'text' },
      { key: 'detail', label: 'Detail', type: 'textarea' },
    ],
  },
]

// --- tag catalog (name -> kind) ----------------------------------------------
const TAG_KIND: Record<string, string> = {
  'PoleForeman': 'tool', 'SPIDAcalc': 'tool', 'Katapult Pro': 'tool', 'CAD': 'tool',
  'Workflow Manager': 'tool', 'GIS': 'domain', 'NESC': 'domain',
  'Three.js': 'tech', 'OpenAI': 'tech', 'DALL·E': 'tech', 'JavaScript': 'tech',
  'Tailwind': 'tech', 'React Native': 'tech', 'Android Studio': 'tech',
  'Plaid': 'tech', 'Twilio': 'tech', 'MongoDB': 'tech', 'Firebase': 'tech',
  'Face Recognition': 'tech',
}

// stacks referenced by entries, keyed by a local ref
const STACKS = {
  experience: ['PoleForeman', 'SPIDAcalc', 'Katapult Pro', 'CAD', 'GIS', 'NESC'],
  '3d-tshirt-designer': ['Three.js', 'OpenAI', 'DALL·E', 'JavaScript', 'Tailwind'],
  billbuzz: ['React Native', 'Android Studio', 'Plaid', 'Twilio', 'MongoDB'],
  soulmatch: ['Firebase', 'Face Recognition'],
}

async function main() {
  // 1. find the owner auth user by email — create it if it doesn't exist yet,
  //    so seeding is a single command with no manual login step. (The magic-link
  //    login page still works normally for real admin use.)
  const { data: userList, error: userErr } = await sb.auth.admin.listUsers()
  if (userErr) throw userErr
  let owner = userList.users.find((u) => u.email?.toLowerCase() === ownerEmail)
  if (!owner) {
    console.log(`… no auth user for ${ownerEmail} yet — creating one`)
    const { data: created, error: createErr } = await sb.auth.admin.createUser({
      email: ownerEmail,
      email_confirm: true,
    })
    if (createErr) throw createErr
    owner = created.user
  }
  const owner_id = owner.id
  console.log(`✓ Owner: ${ownerEmail}  (${owner_id})`)

  // 2. profile — created once, then left alone. Re-running the seed must never
  //    clobber the headline/socials Hadi has edited in /admin.
  const { data: existingProfile } = await sb
    .from('profile')
    .select('id')
    .eq('owner_id', owner_id)
    .maybeSingle()

  if (existingProfile) {
    console.log('✓ Profile (already exists — left untouched)')
  } else {
    const { error: profErr } = await sb.from('profile').insert({
      owner_id,
      full_name: 'Hadi Ghaddar',
      headline:
        'I design power distribution systems and build software. Both come down to getting the details right before anything gets built.',
      location: 'Garden City, MI',
      email_public: 'hadimghaddar@gmail.com',
      socials: [
        { label: 'LinkedIn', url: 'https://www.linkedin.com/in/hadi-ghaddar-71b1b122a/', icon: 'linkedin' },
        { label: 'GitHub', url: 'https://github.com/GhaddarHadi', icon: 'github' },
      ],
      theme: { accent: '#D93A2B', mode: 'light', hero: 'pole' },
      updated_at: new Date().toISOString(),
    })
    if (profErr) throw profErr
    console.log('✓ Profile')
  }

  // 3. sections (upsert, capture ids by slug)
  const { data: secRows, error: secErr } = await sb
    .from('sections')
    .upsert(
      sections.map((s) => ({
        owner_id,
        slug: s.slug,
        title: s.title,
        layout: s.layout,
        sort_order: s.sort_order,
        field_schema: s.field_schema as unknown as Database['public']['Tables']['sections']['Insert']['field_schema'],
        visible: true,
      })),
      { onConflict: 'owner_id,slug' },
    )
    .select('id, slug')
  if (secErr) throw secErr
  const sectionId = Object.fromEntries(secRows!.map((r) => [r.slug, r.id])) as Record<string, string>
  console.log(`✓ Sections: ${secRows!.length}`)

  // 4. tags (upsert every name we reference, capture ids)
  const allTagNames = Array.from(new Set(Object.values(STACKS).flat()))
  const { data: tagRows, error: tagErr } = await sb
    .from('tags')
    .upsert(
      allTagNames.map((name) => ({ owner_id, name, kind: TAG_KIND[name] ?? 'tech' })),
      { onConflict: 'owner_id,name' },
    )
    .select('id, name')
  if (tagErr) throw tagErr
  const tagId = Object.fromEntries(tagRows!.map((r) => [r.name, r.id])) as Record<string, string>
  console.log(`✓ Tags: ${tagRows!.length}`)

  // 5. entries — FIRST RUN ONLY.
  //
  //    This used to delete and re-insert every seeded section's entries, which
  //    is destructive once real content exists: deleting an entry cascades to
  //    its `media`, so re-seeding would have silently destroyed the project
  //    cover images, the recovered repository links, and the certification
  //    credential IDs + logos. Content lives in the database and is edited in
  //    /admin — the seed's only job is bootstrapping an empty project.
  const seededSectionIds = Object.values(sectionId)
  const { count: existingEntries } = await sb
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .in('section_id', seededSectionIds)

  if (existingEntries && existingEntries > 0) {
    console.log(
      `✓ Entries: ${existingEntries} already present — left untouched.\n` +
        '  (Seeding only populates an empty project; edit content in /admin.)',
    )
    console.log('\n✓ Seed complete.\n')
    return
  }

  type EntryInsert = Database['public']['Tables']['entries']['Insert']
  const entries: (EntryInsert & { _stack?: string[] })[] = [
    // experience
    {
      owner_id,
      section_id: sectionId['experience'],
      sort_order: 0,
      start_date: '2025-08-01',
      end_date: null,
      data: {
        role: 'Utility Distribution Engineer',
        company: 'Metro Engineering Solutions',
        location: '',
        bullets: [
          '3D pole loading and structural capacity analysis for make-ready projects using PoleForeman and SPIDAcalc, evaluating pole strength against loading requirements to determine attachment feasibility',
          "Collected and QC'd field survey data in Katapult Pro supporting joint-use pole attachment and permitting workflows",
          'Designed pole replacement and distribution plans in CAD and Workflow Manager, producing construction-ready drawings compliant with NESC',
          'Used GIS mapping to confirm line sizes and flag underground utilities, reducing design conflicts',
        ],
      },
      _stack: STACKS.experience,
    },
    // projects
    {
      owner_id,
      section_id: sectionId['projects'],
      slug: '3d-tshirt-designer',
      sort_order: 0,
      featured: true,
      start_date: '2024-01-01',
      end_date: '2024-01-01',
      data: {
        name: '3D T-Shirt Designer',
        tagline: 'Real-time 3D product customization with AI-generated graphics',
        approach:
          'Built with Three.js for real-time 3D customization, integrating OpenAI ChatGPT and DALL·E to turn text prompts into applied graphics. Responsive UI in Tailwind and JavaScript with dynamic texture updates.',
        problem: '',
        outcome: '',
      },
      _stack: STACKS['3d-tshirt-designer'],
    },
    {
      owner_id,
      section_id: sectionId['projects'],
      slug: 'billbuzz',
      sort_order: 1,
      start_date: '2023-09-01',
      end_date: '2023-09-01',
      data: {
        repo_url: 'https://github.com/Skeeterbob/BillBuzz',
        name: 'BillBuzz',
        tagline: 'Cross-platform personal finance app (Wayne State, Fall 2023)',
        approach:
          'React Native / Android Studio app with Plaid bank sync, Twilio two-factor auth, custom encryption, and MongoDB storage.',
        problem: '',
        outcome: '',
      },
      _stack: STACKS.billbuzz,
    },
    {
      owner_id,
      section_id: sectionId['projects'],
      slug: 'soulmatch',
      sort_order: 2,
      start_date: '2022-09-01',
      end_date: '2022-09-01',
      data: {
        repo_url: 'https://github.com/WSU-4110/SoulMatch',
        name: 'SoulMatch',
        tagline: 'AI dating app with face-recognition and hobby matching (Wayne State, Fall 2022)',
        approach:
          'Led the team building an AI dating app: a face-recognition model plus a hobby-based matching algorithm, with encrypted storage in Firebase.',
        problem: '',
        outcome: '',
      },
      _stack: STACKS.soulmatch,
    },
    // skills
    { owner_id, section_id: sectionId['skills'], sort_order: 0, data: { group: 'Languages', items: ['Python', 'JavaScript'] } },
    { owner_id, section_id: sectionId['skills'], sort_order: 1, data: { group: 'Frontend & Mobile', items: ['React Native', 'Android Studio', 'HTML', 'CSS', 'Tailwind', 'Three.js'] } },
    { owner_id, section_id: sectionId['skills'], sort_order: 2, data: { group: 'Data & Platforms', items: ['SQL Server', 'MongoDB', 'Firebase', 'GIS', 'Katapult Pro', 'PoleForeman', 'SPIDAcalc'] } },
    { owner_id, section_id: sectionId['skills'], sort_order: 3, data: { group: 'Tools', items: ['Git', 'GitHub', 'Postman'] } },
    { owner_id, section_id: sectionId['skills'], sort_order: 4, data: { group: 'APIs & Models', items: ['OpenAI', 'Plaid', 'Twilio', 'Face Recognition'] } },
    // certifications (logos are attached separately by `npm run import-certs`)
    { owner_id, section_id: sectionId['certifications'], sort_order: 0, data: { name: 'CompTIA Security+', issuer: 'CompTIA', credential_id: 'COMP001022800348' } },
    { owner_id, section_id: sectionId['certifications'], sort_order: 1, data: { name: 'ISO 27001: Information Security Management Systems Certified', issuer: 'Mile2 Cybersecurity Institute', credential_id: '23002-168-258-7763' } },
    { owner_id, section_id: sectionId['certifications'], sort_order: 2, data: { name: 'Certificate of Completion: AI Fluency Framework & Foundations', issuer: 'Anthropic', credential_id: '4hahws8xvuet' } },
    { owner_id, section_id: sectionId['certifications'], sort_order: 3, data: { name: 'Certificate of Completion: Claude 101', issuer: 'Anthropic', credential_id: 'nd2mf6m5q6mn' } },
    { owner_id, section_id: sectionId['certifications'], sort_order: 4, data: { name: 'Adobe Certified Associate in Graphic Design & Illustration Using Adobe Illustrator CS6', issuer: 'Adobe Illustrator — Tips, Tricks, & Tutorials' } },
    // education
    { owner_id, section_id: sectionId['education'], sort_order: 0, end_date: '2023-12-01', data: { degree: 'B.S. Computer and Information Science', school: 'Wayne State University', detail: 'Graduated December 2023' } },
  ]

  // Set featured explicitly on every row: in a bulk insert PostgREST unions the
  // keys across all objects and NULL-fills any a row omits (it does not fall
  // back to the column default). Since one project sets featured:true, every
  // other row must carry featured too or it violates the NOT NULL constraint.
  const toInsert = entries.map(({ _stack, ...e }) => ({ featured: false, ...e }))
  const { data: insertedEntries, error: entErr } = await sb
    .from('entries')
    .insert(toInsert)
    .select('id, slug, section_id')
  if (entErr) throw entErr
  console.log(`✓ Entries: ${insertedEntries!.length}`)

  // 6. link entry_tags for entries that carry a _stack
  //    match inserted rows back by slug (projects) or by section (experience)
  const links: { entry_id: string; tag_id: string }[] = []
  for (const e of entries) {
    if (!e._stack) continue
    const match = insertedEntries!.find((r) =>
      e.slug ? r.slug === e.slug : r.section_id === e.section_id,
    )
    if (!match) continue
    for (const name of e._stack) {
      if (tagId[name]) links.push({ entry_id: match.id, tag_id: tagId[name] })
    }
  }
  if (links.length) {
    const { error: linkErr } = await sb.from('entry_tags').insert(links)
    if (linkErr) throw linkErr
  }
  console.log(`✓ Tag links: ${links.length}`)

  // 7. resume variants (/r/<slug>). No variant_entries rows = include everything
  //    visible, per the schema's convention — curate them later from the admin.
  const { error: varErr } = await sb.from('variants').upsert(
    [
      {
        owner_id,
        slug: 'engineering',
        label: 'Utility Engineering',
        headline: 'Utility distribution engineer — pole loading, make-ready, NESC-compliant design.',
      },
      {
        owner_id,
        slug: 'software',
        label: 'Software',
        headline: 'Software developer — 3D/web, mobile, and API integration.',
      },
    ],
    { onConflict: 'owner_id,slug' },
  )
  if (varErr) throw varErr
  console.log('✓ Variants: 2  (/r/engineering, /r/software)')

  // 8. proof — read it back through a plain query and print (Phase 1 "done when")
  console.log('\n── Seeded content ─────────────────────────────')
  for (const s of secRows!.sort((a, b) => a.slug.localeCompare(b.slug))) {
    const { count } = await sb
      .from('entries')
      .select('*', { count: 'exact', head: true })
      .eq('section_id', s.id)
    console.log(`  ${s.slug.padEnd(16)} ${count} entries`)
  }
  console.log('───────────────────────────────────────────────\n✓ Seed complete.\n')
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message ?? err)
  process.exit(1)
})
