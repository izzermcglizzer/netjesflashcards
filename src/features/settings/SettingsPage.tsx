import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { ensureProfile, updateProfile, type Profile } from '../../api/profile'
import { ChunkyButton } from '../../components/ChunkyButton'
import { Card } from '../../components/Card'
import { Stepper } from '../../components/Stepper'
import { Toggle } from '../../components/Toggle'
import { Mascot } from '../../components/Mascot'

function SettingField({ icon, label, children }: { icon: string; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <span className="app-icon-badge h-10 w-10 bg-brand-green/10 text-xl">{icon}</span>
        <p className="flex-1 font-extrabold text-ink">{label}</p>
      </div>
      {children}
    </div>
  )
}

function tipFor(profile: Profile): string {
  if (profile.streak === 0) return 'Ready to start your streak? Study today and come back tomorrow!'
  if (profile.streak < 3) return "You're just getting started — keep it up!"
  return "Consistency is key! You're doing great, keep it up! 💚"
}

export function SettingsPage() {
  const { userId, email, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    ensureProfile(userId).then(setProfile)
  }, [userId])

  async function save(patch: Partial<Profile>) {
    setProfile((p) => (p ? { ...p, ...patch } : p))
    const updated = await updateProfile(userId, patch)
    setProfile(updated)
  }

  if (!profile) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <p className="text-ink-light">Loading...</p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <Link to="/" className="font-bold text-brand-blue">
        &larr; Decks
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-ink">Settings</h1>
          <p className="text-ink-light">{email}</p>
        </div>
        <Mascot pose="reading" size={90} />
      </div>

      <Card className="divide-y-2 divide-cloud-dark">
        <SettingField icon="🎯" label="Daily goal (cards)">
          <Stepper
            value={profile.daily_goal}
            min={5}
            max={100}
            step={5}
            onChange={(daily_goal) => save({ daily_goal })}
          />
        </SettingField>

        <SettingField icon="🗂️" label="New cards per day">
          <Stepper
            value={profile.new_cards_per_day}
            min={1}
            max={50}
            step={1}
            onChange={(new_cards_per_day) => save({ new_cards_per_day })}
          />
        </SettingField>

        <div className="flex items-center gap-3 py-4">
          <span className="app-icon-badge h-10 w-10 bg-brand-green/10 text-xl">🔊</span>
          <p className="flex-1 font-extrabold text-ink">Sound effects</p>
          <Toggle checked={profile.sound_enabled} onChange={(sound_enabled) => save({ sound_enabled })} />
        </div>

        <div className="flex items-center gap-3 rounded-2xl bg-brand-green/10 p-4">
          <Mascot pose="happy" size={64} />
          <div>
            <p className="font-extrabold text-brand-green-dark">Tulpie tip!</p>
            <p className="text-sm text-ink-light">{tipFor(profile)}</p>
          </div>
        </div>
      </Card>

      <ChunkyButton variant="danger" fullWidth onClick={() => signOut()}>
        🚪 Sign out
      </ChunkyButton>
    </div>
  )
}
