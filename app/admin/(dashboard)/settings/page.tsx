export const dynamic = 'force-dynamic'

import { createAdminClient } from '@/lib/supabase'
import SettingsForm from '@/components/admin/SettingsForm'

async function getSettings() {
  const db = createAdminClient()
  const { data } = await db.from('settings').select('key, value')
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string>
}

export default async function AdminSettingsPage() {
  const settings = await getSettings()

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-black text-navy mb-8">Settings</h1>
      <SettingsForm settings={settings} />
    </div>
  )
}
