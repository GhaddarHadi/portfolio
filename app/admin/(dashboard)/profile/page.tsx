import { getAdminProfile } from '@/lib/content/admin'
import { ProfileForm } from '@/components/admin/ProfileForm'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const profile = await getAdminProfile()
  return (
    <div>
      <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Profile</h1>
      <p className="lettering mb-6 mt-1 text-[10px] text-slate">
        The site header, title block and structured data all read from here.
      </p>
      <ProfileForm profile={profile} />
    </div>
  )
}
