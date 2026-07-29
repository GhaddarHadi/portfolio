import { SheetFrame } from '@/components/sheet/SheetFrame'

// The sheet frame wraps every public page. Admin routes get the bare root
// layout instead, so this chrome never bleeds into the editor.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <SheetFrame>{children}</SheetFrame>
}
