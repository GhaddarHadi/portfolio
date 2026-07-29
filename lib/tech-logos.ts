/**
 * Technology name -> logo file in the `media` bucket's tech/ folder.
 *
 * These are UI assets, not content: the skill and stack NAMES still come from
 * the database, and anything without a logo simply renders as a plain chip.
 * Add a logo by uploading it to tech/ and adding one line here.
 * Keys are lowercased for matching.
 */
const LOGOS: Record<string, string> = {
  html: 'html.png',
  css: 'css.png',
  javascript: 'javascript.png',
  tailwind: 'tailwind.png',
  'three.js': 'threejs.svg',
  threejs: 'threejs.svg',
  mongodb: 'mongodb.png',
  git: 'git.png',
  github: 'github.png',
  'react native': 'react_native.png',
  python: 'python.svg',
  'android studio': 'androidstudio.svg',
  firebase: 'firebase.svg',
  postman: 'postman.svg',
  // Hadi confirmed Esri ArcGIS and Autodesk AutoCAD specifically.
  gis: 'arcgis.svg',
  arcgis: 'arcgis.svg',
  cad: 'autocad.svg',
  autocad: 'autocad.svg',
}

export function techLogo(name: string): string | null {
  const file = LOGOS[name.trim().toLowerCase()]
  if (!file) return null
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  return `${base}/storage/v1/object/public/media/tech/${file}`
}

/**
 * Typographic badges for the proprietary utility software that has no public
 * logo. Without these, Hadi's engineering tools sit as bare text beside
 * brightly-coloured developer logos — which visually under-sells half his
 * resume. A monogram is clearly a design element, not a counterfeit mark.
 *
 * Written out rather than derived: "SPIDAcalc" initialises to SC, not SP, and
 * no clever rule gets that right without special-casing anyway.
 */
const MONOGRAMS: Record<string, string> = {
  'katapult pro': 'KP',
  poleforeman: 'PF',
  spidacalc: 'SC',
  'workflow manager': 'WM',
}

export function monogram(name: string): string | null {
  return MONOGRAMS[name.trim().toLowerCase()] ?? null
}
