import type { LayoutProps } from './registry'

/** Image grid pulled from entry media. */
export function Gallery({ entries }: LayoutProps) {
  const images = entries.flatMap((e) => e.media)

  if (images.length === 0) {
    return (
      <p className="border border-dashed border-ink/25 bg-panel px-4 py-8 text-center text-sm text-slate">
        Add screenshots or drawings to a project and they&apos;ll plot here.
      </p>
    )
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {images.map((m) => (
        <li key={m.id} className="border border-ink/20 bg-panel p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={m.url}
            alt={m.alt ?? ''}
            loading="lazy"
            className="h-full w-full object-cover"
            width={m.width ?? undefined}
            height={m.height ?? undefined}
          />
        </li>
      ))}
    </ul>
  )
}
