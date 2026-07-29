import { CornerTicks } from './CornerTicks'

/**
 * The sheet: a bordered frame with registration ticks at the corners.
 *
 * No footer and no title block — both were cut in review as invented metadata.
 * Contact details and links live in the hero, at the top of the page where a
 * recruiter reads them first.
 */
export function SheetFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bond text-ink">
      <div className="mx-auto max-w-6xl px-3 py-4 sm:px-6 sm:py-8">
        <div className="relative border border-ink/50">
          <CornerTicks />
          <div className="px-4 py-8 sm:px-10 sm:py-12">{children}</div>
        </div>
      </div>
    </div>
  )
}
