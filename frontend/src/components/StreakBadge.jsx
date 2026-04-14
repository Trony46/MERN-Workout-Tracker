// ─── components/StreakBadge.jsx ───────────────────────────────────────────────
// Counts consecutive days with at least one workout logged.
// ─────────────────────────────────────────────────────────────────────────────

// Helper to get local YYYY-MM-DD (fixes the UTC shift bug)
const getLocalKey = (dateVal) => {
  const d = new Date(dateVal)
  const localTime = new Date(d.getTime() - (d.getTimezoneOffset() * 60000))
  return localTime.toISOString().split('T')[0]
}

export default function StreakBadge({ workouts }) {
  const uniqueDates = new Set(
    workouts.map(w => getLocalKey(w.createdAt))
  )

  let streak = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = getLocalKey(d)

    if (uniqueDates.has(key)) {
      streak++
    } else if (i === 0) {
      continue   // No workout today yet — check yesterday before giving up
    } else {
      break      // Gap found — streak ends
    }
  }

  const style =
    streak >= 7 ? { emoji: '🔥', color: '#e11d48', label: 'On fire!' }  :
    streak >= 3 ? { emoji: '⚡', color: '#f59e0b', label: 'Keep going!' } :
    streak >= 1 ? { emoji: '💪', color: '#888',    label: 'Good start!'  } :
                  { emoji: '😴', color: '#555',    label: 'Start today!' }

  return (
    <div className="streak-badge" style={{ borderColor: style.color }}>
      <span className="streak-emoji">{style.emoji}</span>
      <div>
        <span className="streak-number" style={{ color: style.color }}>{streak}</span>
        <span className="streak-label"> day streak</span>
        <div className="streak-sublabel">{style.label}</div>
      </div>
    </div>
  )
}