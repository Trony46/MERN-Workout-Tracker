// ─── components/Navbar.jsx ────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom'
import { useAuth }     from '../context/AuthContext'
import { useTimer }    from '../context/TimerContext'
import { useSocket }   from '../context/SocketContext'
import toast           from 'react-hot-toast'

export default function Navbar({ onChatToggle, chatOpen }) {
  const { user, logout } = useAuth()
  const { openTimer }    = useTimer()
  const { unreadCount, lastMsg, setTargetContact } = useSocket()
  const navigate         = useNavigate()

  const handleLogout = () => {
    logout()
    toast('Logged out. See you at the gym! 👋')
    navigate('/login')
  }

  const handleChatClick = () => {
    if (lastMsg && !chatOpen) {
      setTargetContact(lastMsg.fromUser) 
    }
    onChatToggle() 
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand"><span>🔥</span> FitLog</div>

      <div className="navbar-center">
        <button className="navbar-rest-btn" onClick={openTimer}>⏱ Rest Timer</button>
      </div>

      <div className="navbar-right">
        <div className="nav-chat-wrap" style={{ position: 'relative' }}>
          
          <button className={`navbar-chat-btn ${chatOpen ? 'active' : ''}`} onClick={handleChatClick} style={{ position: 'relative', paddingRight: '20px' }}>
            💬 Chat
            {/* 🚨 THE GLOWING, UN-CLIPPABLE GREEN DOT 🚨 */}
            {unreadCount > 0 && !chatOpen && (
              <span style={{
                position: 'absolute', top: '6px', right: '6px', // Moved safely inward
                width: '10px', height: '10px', background: '#4ade80',
                borderRadius: '50%', border: '1px solid #111',
                zIndex: 9999,
                boxShadow: '0 0 12px 2px #4ade80' // Neon glow makes it impossible to miss
              }}></span>
            )}
          </button>
          
        </div>

        <span className="navbar-user">Hey, <span className="navbar-username">{user?.name}</span></span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}