// Resume variants get a clean, print-first layout — no sheet border, no grid,
// no command palette. What you see is what prints.
export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-bond text-ink">{children}</div>
}
