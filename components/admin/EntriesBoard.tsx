'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Section } from '@/lib/content'
import { pickTitle } from '@/components/layouts/entry-view'
import { deleteEntry, setEntryVisibility, reorderEntries } from '@/app/admin/actions'
import { Button, Toggle } from './controls'
import { EntryDrawer, type EntryDraft } from './EntryDrawer'

export function EntriesBoard({
  section,
  initialDrafts,
}: {
  section: Section
  initialDrafts: EntryDraft[]
}) {
  const router = useRouter()
  const [drafts, setDrafts] = useState(initialDrafts)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<EntryDraft | null>(null)
  // client-only mount for dnd-kit (avoids its SSR aria-id hydration mismatch)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = drafts.findIndex((d) => d.entry!.id === active.id)
    const newIndex = drafts.findIndex((d) => d.entry!.id === over.id)
    const next = arrayMove(drafts, oldIndex, newIndex)
    setDrafts(next)
    await reorderEntries(next.map((d) => d.entry!.id))
    router.refresh()
  }

  function openNew() {
    setEditing(null)
    setOpen(true)
  }
  function openEdit(d: EntryDraft) {
    setEditing(d)
    setOpen(true)
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button variant="primary" onClick={openNew}>
          + New entry
        </Button>
      </div>

      {drafts.length === 0 ? (
        <p className="border border-dashed border-ink/25 bg-panel px-4 py-8 text-center text-sm text-slate">
          Nothing here yet. Add your first entry.
        </p>
      ) : mounted ? (
        <DndContext
          id="entries-board"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext
            items={drafts.map((d) => d.entry!.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="space-y-2">
              {drafts.map((d) => (
                <Row
                  key={d.entry!.id}
                  draft={d}
                  section={section}
                  onEdit={() => openEdit(d)}
                  onChanged={() => router.refresh()}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {drafts.map((d) => (
            <li
              key={d.entry!.id}
              className="flex items-center gap-3 border border-ink/20 bg-panel px-3 py-2.5"
            >
              <span className="lettering text-slate">⠿</span>
              <span className="text-sm font-medium">
                {(pickTitle(section.field_schema, d.entry!.data)?.value as string) ||
                  d.entry!.slug ||
                  'Untitled'}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <EntryDrawer
          key={editing?.entry?.id ?? 'new'}
          open
          onClose={() => setOpen(false)}
          section={section}
          draft={editing}
        />
      ) : null}
    </div>
  )
}

function Row({
  draft,
  section,
  onEdit,
  onChanged,
}: {
  draft: EntryDraft
  section: Section
  onEdit: () => void
  onChanged: () => void
}) {
  const entry = draft.entry!
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.id,
  })
  const title = pickTitle(section.field_schema, entry.data)?.value
  const label = title ? String(title) : entry.slug || 'Untitled'

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 border border-ink/20 bg-panel px-3 py-2.5 ${
        isDragging ? 'opacity-60' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="lettering cursor-grab text-slate active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <span className="flex-1 truncate text-sm font-medium">
        {label}
        {entry.featured ? <span className="lettering ml-2 text-[9px] text-amber">★ featured</span> : null}
      </span>
      <Toggle
        checked={entry.visible}
        onChange={async (v) => {
          await setEntryVisibility(entry.id, v)
          onChanged()
        }}
      />
      <Button variant="ghost" onClick={onEdit}>
        Edit
      </Button>
      <Button
        variant="danger"
        onClick={async () => {
          if (confirm(`Delete "${label}"?`)) {
            await deleteEntry(entry.id, entry.slug)
            onChanged()
          }
        }}
      >
        Delete
      </Button>
    </li>
  )
}
