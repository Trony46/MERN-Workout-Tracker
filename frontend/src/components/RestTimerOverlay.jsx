// ─── components/RestTimerOverlay.jsx ─────────────────────────────────────────
// Full-screen blur overlay with a countdown timer in the center.
// Opens when user clicks "Rest" in the navbar.
// Can be cancelled at any time.
//
// HOW THE TIMER WORKS:
//   - useRef stores the interval ID so we can clear it reliably
//   - useEffect watches `isRunning` — starts/stops interval when it changes
//   - When timeLeft hits 0, the interval clears itself
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'
import { useTimer } from '../context/TimerContext'
import toast from 'react-hot-toast'

const PRESETS = [
  { label: '30s',  seconds: 30  },
  { label: '1 min', seconds: 60  },
  { label: '90s',  seconds: 90  },
  { label: '2 min', seconds: 120 },
]

export default function RestTimerOverlay() {
  const { isOpen, closeTimer } = useTimer()

  const [selected,  setSelected]  = useState(60)
  const [timeLeft,  setTimeLeft]  = useState(60)
  const [isRunning, setIsRunning] = useState(false)
  const [isDone,    setIsDone]    = useState(false)

  // useRef so the interval ID never goes stale inside closures
  const intervalRef = useRef(null)

  // ── Timer engine ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setIsRunning(false)
            setIsDone(true)
            toast.success('Rest over! Time to crush it 💪', { duration: 3000 })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    // This cleanup runs when isRunning flips to false (stop/cancel)
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  // Reset everything when overlay is opened fresh
  useEffect(() => {
    if (isOpen) {
      clearInterval(intervalRef.current)
      setTimeLeft(selected)
      setIsRunning(false)
      setIsDone(false)
    }
  }, [isOpen])

  const handleStart = () => {
    setTimeLeft(selected)
    setIsDone(false)
    setIsRunning(true)
  }

  const handleCancel = () => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsDone(false)
    setTimeLeft(selected)
    closeTimer()
    toast('Rest cancelled', { icon: '⏹️' })
  }

  const handlePreset = (secs) => {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setIsDone(false)
    setSelected(secs)
    setTimeLeft(secs)
  }

  // Format seconds → "1:30"
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  // SVG ring progress
  const R             = 70
  const circumference = 2 * Math.PI * R
  const progress      = timeLeft / selected
  const dashOffset    = circumference * (1 - progress)

  if (!isOpen) return null

  return (
    <div className="rest-overlay">
      <div className="rest-modal">

        <h2 className="rest-title">⏱ Rest Timer</h2>

        {/* Preset buttons */}
        <div className="rest-presets">
          {PRESETS.map(p => (
            <button
              key={p.seconds}
              className={`rest-preset-btn ${selected === p.seconds ? 'active' : ''}`}
              onClick={() => handlePreset(p.seconds)}
              disabled={isRunning}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Countdown ring */}
        <div className="rest-ring-wrap">
          <svg width="180" height="180" viewBox="0 0 180 180">
            {/* Track ring */}
            <circle cx="90" cy="90" r={R} fill="none" stroke="#2a2a2a" strokeWidth="8" />
            {/* Progress ring — starts from top (rotate -90deg) */}
            <circle
              cx="90" cy="90" r={R}
              fill="none"
              stroke={isDone ? '#22c55e' : '#e11d48'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 90 90)"
              style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.4s' }}
            />
          </svg>
          <div className="rest-time-display">
            {isDone ? '✓' : fmt(timeLeft)}
          </div>
        </div>

        {isDone && <p className="rest-done-text">Get back to it! 🔥</p>}

        {/* Action buttons */}
        <div className="rest-actions">
          {!isRunning ? (
            <button className="btn-red" onClick={handleStart}>
              {isDone ? 'Restart' : 'Start Rest'}
            </button>
          ) : (
            <button className="btn-ghost" onClick={() => { clearInterval(intervalRef.current); setIsRunning(false) }}>
              Pause
            </button>
          )}
          <button className="btn-ghost-red" onClick={handleCancel}>
            Close
          </button>
        </div>

      </div>
    </div>
  )
}
