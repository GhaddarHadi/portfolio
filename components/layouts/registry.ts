import type { ComponentType } from 'react'
import type { Section, EntryWithRelations } from '@/lib/content'
import type { Layout } from '@/lib/schema/field-types'
import { Timeline } from './Timeline'
import { CardGrid } from './CardGrid'
import { ChipCloud } from './ChipCloud'
import { Prose } from './Prose'
import { StatRow } from './StatRow'
import { Gallery } from './Gallery'

export type LayoutProps = { section: Section; entries: EntryWithRelations[] }

/**
 * layout string -> renderer. This is the ONLY place that knows the mapping, so
 * supporting a new layout later means adding one line here — nothing else.
 */
export const LAYOUT_REGISTRY: Record<Layout, ComponentType<LayoutProps>> = {
  timeline: Timeline,
  card_grid: CardGrid,
  chip_cloud: ChipCloud,
  prose: Prose,
  stat_row: StatRow,
  gallery: Gallery,
}

export function getLayout(layout: Layout): ComponentType<LayoutProps> {
  return LAYOUT_REGISTRY[layout] ?? Prose
}
