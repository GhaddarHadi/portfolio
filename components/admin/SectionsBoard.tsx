'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
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
import { deleteSection, setSectionVisibility, reorderSections } from '@/app/admin/actions'
import { Button, Toggle } from './controls'
import { SectionEditor } from './SectionEditor'

export function SectionsBoard({
  initialSections,
  counts,
}: {
  initialSections: Section[]
  counts: Record<string, number>
}) {
  const router = useRouter()
  const [sections, setSections] = useState(initialSections)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Section | null>(null)
  // dnd-kit assigns aria ids from a module counter that differs between the
  // server and client render, so mount the sortable context on the client only.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = sections.findIndex((s) => s.id === active.id)
    const newIndex = sections.findIndex((s) => s.id === over.id)
    const next = arrayMove(sections, oldIndex, newIndex)
    setSections(next)
    await reorderSections(next.map((s) => s.id))
    router.refresh()
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null)
            setOpen(true)
          }}
        >
          + New section
        </Button>
      </div>

      {mounted ? (
        <DndContext
          id="sections-board"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {sections.map((s) => (
                <Row
                  key={s.id}
                  section={s}
                  count={counts[s.id] ?? 0}
                  onEdit={() => {
                    setEditing(s)
                    setOpen(true)
                  }}
                  onChanged={() => router.refresh()}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      ) : (
        <ul className="space-y-2">
          {sections.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-3 border border-ink/20 bg-panel px-3 py-2.5"
            >
              <span className="lettering text-slate">⠿</span>
              <span className="text-sm font-medium">{s.title}</span>
              <span className="lettering text-[9px] text-slate">
                {s.layout} · {counts[s.id] ?? 0}
              </span>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <SectionEditor
          key={editing?.id ?? 'new'}
          open
          onClose={() => setOpen(false)}
          section={editing}
        />
      ) : null}
    </div>
  )
}

function Row({
  section,
  count,
  onEdit,
  onChanged,
}: {
  section: Section
  count: number
  onEdit: () => void
  onChanged: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  })
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
      <Link href={`/admin/sections/${section.id}`} className="flex-1 truncate">
        <span className="text-sm font-medium">{section.title}</span>
        <span className="lettering ml-2 text-[9px] text-slate">
          {section.layout} · {count}
        </span>
      </Link>
      <Toggle
        checked={section.visible}
        onChange={async (v) => {
          await setSectionVisibility(section.id, v)
          onChanged()
        }}
        labels={['Hidden', 'Visible']}
      />
      <Button variant="ghost" onClick={onEdit}>
        Edit
      </Button>
      <Link
        href={`/admin/sections/${section.id}`}
        className="lettering rounded-[2px] border border-ink/30 bg-panel px-3 py-1.5 text-[11px] hover:border-ink/60"
      >
        Entries →
      </Link>
      <Button
        variant="danger"
        onClick={async () => {
          if (confirm(`Delete section "${section.title}" and all its entries?`)) {
            await deleteSection(section.id)
            onChanged()
          }
        }}
      >
        Delete
      </Button>
    </li>
  )
}
