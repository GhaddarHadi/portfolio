import ReactMarkdown from 'react-markdown'

/** Markdown rendered in the drawing-set body voice. Safe by default (no raw HTML). */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-ink/85 [&_a]:text-redline [&_a]:underline [&_a]:underline-offset-2 [&_li]:ml-4 [&_li]:list-disc [&_strong]:font-semibold [&_ul]:space-y-1">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  )
}
