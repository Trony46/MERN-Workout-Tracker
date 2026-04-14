// ─── components/ChartsSection.jsx ────────────────────────────────────────────
// Bar chart of last 7 days + line chart of weight lifted.
// Clicking a bar selects that day — dashboard metrics update to show that day.
// An "All" pill resets to show all-time metrics.
// ─────────────────────────────────────────────────────────────────────────────

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts'

// Build last-7-days data from all workouts
function buildChartData(workouts) {
  const days = []

  for (let i = 6; i >= 0; i--) {
    const date  = new Date()
    date.setDate(date.getDate() - i)
    const label = date.toLocaleDateString('en-IN', { weekday: 'short' })
    const key   = date.toISOString().split('T')[0]   // "2025-01-05"
    days.push({ label, key, count: 0, weight: 0 })
  }

  workouts.forEach(w => {
    const dayKey = new Date(w.createdAt).toISOString().split('T')[0]
    const day    = days.find(d => d.key === dayKey)
    if (day) {
      day.count  += 1
      day.weight += w.weight
    }
  })

  return days
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <p className="chart-tooltip-value">{payload[0].name}: {payload[0].value}</p>
    </div>
  )
}

export default function ChartsSection({ workouts, selectedDay, onDaySelect }) {
  if (workouts.length === 0) return null

  const data     = buildChartData(workouts)
  const todayKey = new Date().toISOString().split('T')[0]

  return (
    <div className="charts-section">
      <div className="charts-header">
        <h3>📊 Last 7 Days — Click a bar to filter</h3>
        {/* "All" button resets to all-time view */}
        <button
          className={`filter-pill ${selectedDay === 'all' ? 'active' : ''}`}
          onClick={() => onDaySelect('all')}
        >
          All Time
        </button>
      </div>

      <div className="charts-grid">

        {/* Bar chart — workouts per day, bars are clickable */}
        <div className="chart-card">
          <p className="chart-title">Workouts Logged</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={data}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(225,29,72,0.08)' }} />
              <Bar
                dataKey="count"
                name="Workouts"
                radius={[4, 4, 0, 0]}
                onClick={(barData) => onDaySelect(barData.key)}
              >
                {data.map(entry => (
                  <Cell
                    key={entry.key}
                    fill={
                      entry.key === selectedDay ? '#e11d48' :   // selected = bright red
                      entry.key === todayKey    ? '#be123c' :   // today = medium red
                      '#3a1a22'                                  // other days = dark
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="chart-hint">Click a bar to see that day's metrics</p>
        </div>

        {/* Line chart — weight lifted per day */}
        <div className="chart-card">
          <p className="chart-title">Weight Lifted (kg)</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" />
              <XAxis dataKey="label" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="weight"
                name="kg"
                stroke="#e11d48"
                strokeWidth={2}
                dot={{ fill: '#be123c', r: 4 }}
                activeDot={{ r: 6, fill: '#f87171' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  )
}
