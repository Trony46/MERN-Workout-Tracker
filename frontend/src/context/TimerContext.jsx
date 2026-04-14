// ─── context/TimerContext.jsx ─────────────────────────────────────────────────
// Global state for the Rest Timer.
// Any component can call useTimer() to open/close the overlay.
// The actual overlay renders in App.jsx so it sits above everything.
// ─────────────────────────────────────────────────────────────────────────────

import { createContext, useContext, useState } from 'react'

const TimerContext = createContext()

export const TimerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false)

  const openTimer  = () => setIsOpen(true)
  const closeTimer = () => setIsOpen(false)

  return (
    <TimerContext.Provider value={{ isOpen, openTimer, closeTimer }}>
      {children}
    </TimerContext.Provider>
  )
}

export const useTimer = () => useContext(TimerContext)
