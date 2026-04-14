// ─── context/SocketContext.jsx ────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast' // 🚨 ADDED GLOBAL TOAST

const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const [socket,      setSocket]      = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [lastMsg,     setLastMsg]     = useState(null)
  const [targetContact, setTargetContact] = useState(null)

  const { user } = useAuth()

  useEffect(() => {
    if (!user?._id) return
    const s = io('http://localhost:5000', { transports: ['websocket', 'polling'] })

    s.on('connect', () => s.emit('join_room', user._id))

    s.on('receive_message', (msg) => {
      setUnreadCount(prev => prev + 1)
      setLastMsg(msg)
      
      // 🚨 IRONCLAD NOTIFICATION: This will pop up 100% of the time!
      const senderName = msg.fromUser?.name ? msg.fromUser.name.split(' ')[0] : 'Someone'
      toast(`New message from ${senderName}`, {
        icon: '🟢',
        style: { background: '#111', color: '#4ade80', border: '1px solid #4ade80' }
      })
    })

    setSocket(s)
    return () => { s.disconnect(); setSocket(null); setUnreadCount(0); setLastMsg(null); }
  }, [user?._id])

  const clearNotifications = () => {
    setUnreadCount(0)
    setLastMsg(null)
  }

  return (
    <SocketContext.Provider value={{ socket, unreadCount, lastMsg, clearNotifications, targetContact, setTargetContact }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => useContext(SocketContext)