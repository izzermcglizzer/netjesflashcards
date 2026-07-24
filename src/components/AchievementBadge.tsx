import type { Achievement } from '../gamification/achievements.data'

export function AchievementBadge({ achievement, locked = false }: { achievement: Achievement; locked?: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center ${
        locked ? 'border-cloud-dark bg-cloud opacity-50' : 'border-brand-gold bg-white'
      }`}
      title={achievement.description}
    >
      <span className="text-3xl">{achievement.icon}</span>
      <p className="text-xs font-extrabold text-ink">{achievement.label}</p>
    </div>
  )
}
