// ─── App.jsx ──────────────────────────────────────────────────────────────────
// BUG FIX 1 (blur): RestTimerOverlay is now OUTSIDE the .page-blurred div.
//   Before: overlay was inside the blurred div → overlay itself got blurred.
//   After:  overlay renders above the blur at sibling level.
//
// BUG FIX 2 (Google auth): GoogleAuthCatcher now:
//   - reads token + _id from URL params
//   - calls login() to set user in context
//   - then navigates to / using navigate() (not <Navigate>)
//   This ensures user is in context BEFORE PrivateRoute checks it.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect }   from 'react'
import { Toaster }     from 'react-hot-toast'

import { AuthProvider, useAuth }   from './context/AuthContext'
import { TimerProvider, useTimer } from './context/TimerContext'
import { SocketProvider }          from './context/SocketContext'

import RestTimerOverlay from './components/RestTimerOverlay'
import HomePage         from './pages/HomePage'
import LoginPage        from './pages/LoginPage'
import SignupPage       from './pages/SignupPage'

// ── Handles ?token=&name=&_id= from Google OAuth redirect ───────────────────
function GoogleAuthCatcher() {
  const [params] = useSearchParams()
  const { login } = useAuth()
  const navigate  = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    const name  = params.get('name')
    const _id   = params.get('_id')

    if (token && name) {
      // Set user in context FIRST, then navigate
      login({ token, name, _id })
      navigate('/', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }, [])   // Runs once on mount

  // Brief loading screen while processing
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center',
      minHeight:'100vh', background:'#080808', color:'#e11d48', fontSize:'18px',
      fontFamily:'Inter,sans-serif' }}>
      🔥 Logging you in...
    </div>
  )
}

// ── Only renders children if user is logged in, else redirects to login ──────
function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? children : <Navigate to="/login" replace />
}

// ── Inner app — has access to TimerContext for blur state ─────────────────────
function AppInner() {
  const { isOpen } = useTimer()

  return (
    <>
      {/*
        BUG FIX: page-blurred is only on this inner wrapper.
        RestTimerOverlay and Toaster are SIBLINGS of this div, not children,
        so they never get blurred.
      */}
      <div className={isOpen ? 'page-blurred' : ''}>
        <Routes>
          <Route path="/login"  element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/auth"   element={<GoogleAuthCatcher />} />
          <Route path="/" element={
            <PrivateRoute><HomePage /></PrivateRoute>
          } />
        </Routes>
      </div>

      {/* These are OUTSIDE the blur — they always render on top clearly */}
      <RestTimerOverlay />
      
      {/* ── Premium Toast Notifications ── */}
      <Toaster
        position="top-left" // 🚨 CHANGED FROM top-right TO top-left 🚨
        reverseOrder={false}
        gutter={12} 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e1e2f', 
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)', 
            fontSize: '15px',
            fontWeight: '500',
            backdropFilter: 'blur(10px)', 
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80', 
              secondary: '#1e1e2f',
            },
            style: {
              borderLeft: '4px solid #4ade80', 
            }
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#e94560', 
              secondary: '#fff',
            },
            style: {
              borderLeft: '4px solid #e94560',
            }
          },
        }}
      />
    </>
  )
}

// ── Root — wraps everything in providers ─────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <TimerProvider>
        <SocketProvider>
          <BrowserRouter>
            <AppInner />
          </BrowserRouter>
        </SocketProvider>
      </TimerProvider>
    </AuthProvider>
  )
}