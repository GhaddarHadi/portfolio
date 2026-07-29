/**
 * Page shell.
 *
 * This used to be a bordered "drawing sheet" — a boxed column centred on the
 * page. In review it read as a document floating on a background rather than a
 * website, so the border, corner ticks and narrow cap are gone. Sections now
 * run the full width of the viewport; individual content still caps itself
 * where long lines would hurt readability.
 */
export function SheetFrame({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-bond text-ink">{children}</div>
}
