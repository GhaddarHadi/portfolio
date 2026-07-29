'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="lettering rounded-[2px] border border-ink/30 bg-panel px-3 py-2 text-[10px] text-ink transition-colors hover:border-redline hover:text-redline print:hidden"
    >
      Save as PDF
    </button>
  )
}
