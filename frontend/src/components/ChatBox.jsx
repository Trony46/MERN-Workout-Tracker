// ─── components/ChatBox.jsx ───────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { useAuth }   from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import toast         from 'react-hot-toast'

export default function ChatBox({ todayWorkouts, onClose, onAcceptTodos }) {
  const { user } = useAuth()
  const { socket, clearNotifications, targetContact, setTargetContact } = useSocket()

  const [ptEmail,         setPtEmail]         = useState('')
  const [pt,              setPt]              = useState(null)
  const [findError,       setFindError]       = useState('')
  const [finding,         setFinding]         = useState(false)
  const [messages,        setMessages]        = useState([])
  const [loadingHistory,  setLoadingHistory]  = useState(false)
  const [text,            setText]            = useState('')
  const [includeSnapshot, setIncludeSnapshot] = useState(false)
  const [sending,         setSending]         = useState(false)
  
  const [contacts, setContacts] = useState([])
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [hoveredContact, setHoveredContact] = useState(null)

  const [viewingData, setViewingData] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    clearNotifications()
    const savedContacts = JSON.parse(localStorage.getItem(`contacts_${user._id}`) || '[]')
    setContacts(savedContacts)

    if (targetContact) {
      let updatedContacts = savedContacts
      const exists = savedContacts.find(c => c._id === targetContact._id)
      if (!exists && targetContact.email) {
        updatedContacts = [...savedContacts, { _id: targetContact._id, name: targetContact.name, email: targetContact.email }]
        setContacts(updatedContacts)
        localStorage.setItem(`contacts_${user._id}`, JSON.stringify(updatedContacts))
      }
      setPtEmail(targetContact.email)
      handleFindPT(targetContact.email) 
      setTargetContact(null) 
    }
  }, [targetContact])

  useEffect(() => {
    if (!socket) return
    const handleIncoming = (msg) => {
      const fromId = msg.fromUser?._id?.toString() || msg.fromUser?.toString()
      const toId   = msg.toUser?._id?.toString() || msg.toUser?.toString()
      const ptId   = pt?._id?.toString()
      const myId   = user._id.toString()

      const isIncoming = fromId === ptId && toId === myId
      const isOutgoing = fromId === myId && toId === ptId

      if (pt && (isIncoming || isOutgoing)) {
        setMessages(prev => {
          if (prev.find(m => m._id === msg._id)) return prev
          return [...prev, msg]
        })
        if (isIncoming) clearNotifications()
      }
    }
    
    socket.on('receive_message', handleIncoming)
    socket.on('message_sent', handleIncoming) 
    
    return () => { 
      socket.off('receive_message', handleIncoming)
      socket.off('message_sent', handleIncoming)
    }
  }, [socket, pt, user._id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleDeleteContact = (contactId) => {
    const newContacts = contacts.filter(c => c._id !== contactId)
    setContacts(newContacts)
    localStorage.setItem(`contacts_${user._id}`, JSON.stringify(newContacts))
    if (pt?._id === contactId) { setPt(null); setPtEmail(''); setMessages([]) }
    setIsDeleteMode(false); toast.success('Contact removed')
  }

  const handleFindPT = async (overrideEmail = null) => {
    const emailToSearch = overrideEmail || ptEmail
    if (!emailToSearch.trim()) return
    setFindError(''); setFinding(true)
    try {
      const res = await axios.get(`http://localhost:5000/api/chat/find-user?email=${encodeURIComponent(emailToSearch.trim())}`, { headers: { Authorization: `Bearer ${user.token}` } })
      const foundUser = res.data
      setPt(foundUser); setPtEmail('') 

      setContacts(prev => {
        const exists = prev.find(c => c._id === foundUser._id)
        if (exists) return prev
        const newContacts = [...prev, { _id: foundUser._id, name: foundUser.name, email: foundUser.email }]
        localStorage.setItem(`contacts_${user._id}`, JSON.stringify(newContacts))
        return newContacts
      })

      setLoadingHistory(true)
      const histRes = await axios.get(`http://localhost:5000/api/chat/history/${foundUser._id}`, { headers: { Authorization: `Bearer ${user.token}` } })
      setMessages(histRes.data)
    } catch (err) { setFindError('No user found with that email') } finally { setFinding(false); setLoadingHistory(false) }
  }

  const handleSendText = () => {
    if (!text.trim() || !pt || !socket) return
    setSending(true)
    
    let snapshotStr = ''
    if (includeSnapshot && todayWorkouts?.length) {
      const metricsArray = todayWorkouts.map(w => ({
        title: w.title, sets: w.sets, reps: w.reps, weight: w.weight, category: w.category
      }))
      snapshotStr = JSON.stringify({ type: 'metrics', data: metricsArray })
    }

    socket.emit('send_message', { 
      fromUserId: user._id, toUserId: pt._id, text: text.trim(), workoutSnapshot: snapshotStr 
    })
    
    setText(''); setIncludeSnapshot(false); setSending(false)
  }

  const parseDataPill = (msg) => {
    if (msg.workoutSnapshot) {
      try {
        const parsed = JSON.parse(msg.workoutSnapshot)
        if (parsed.type) return parsed
      } catch(e) { /* fallback below */ }
    }
    if (msg.workoutTodo && msg.workoutTodo.title) {
      return { type: 'todos', data: [msg.workoutTodo] } 
    }
    if (msg.workoutSnapshot && msg.workoutSnapshot.trim() !== '') {
      return { type: 'metrics', data: msg.workoutSnapshot }
    }
    return null
  }

  return (
    <>
      <div style={{ position: 'fixed', top: 'auto', left: 'auto', bottom: '20px', right: '20px', zIndex: 999999, display: 'flex', flexDirection: 'row', width: '700px', height: '520px', background: 'rgba(15, 15, 20, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        {/* Sidebar */}
        <div style={{ width: '180px', background: 'rgba(0,0,0,0.4)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '16px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', letterSpacing: '1px', color: '#888' }}>CONTACTS</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setIsDeleteMode(!isDeleteMode)} style={{ background: 'transparent', border: 'none', color: isDeleteMode ? '#e94560' : '#666', fontSize: '15px', cursor: 'pointer', padding: 0 }}>🗑️</button>
              <button onClick={() => { setPt(null); setPtEmail(''); setMessages([]); setIsDeleteMode(false) }} style={{ background: 'transparent', border: 'none', color: '#4ade80', fontSize: '22px', cursor: 'pointer', lineHeight: 1, padding: 0 }}>+</button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {contacts.map(c => {
              const isActive = pt?._id === c._id && !isDeleteMode;
              const isHovered = hoveredContact === c._id;
              const showDelete = isDeleteMode && isHovered;
              return (
                <div key={c._id} onMouseEnter={() => setHoveredContact(c._id)} onMouseLeave={() => setHoveredContact(null)} onClick={() => { if (isDeleteMode) handleDeleteContact(c._id); else { setPtEmail(c.email); handleFindPT(c.email); } }} style={{ margin: '4px 8px', padding: '10px 12px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', transition: 'all 0.2s ease', background: isActive ? 'linear-gradient(90deg, rgba(233,69,96,0.15) 0%, rgba(0,0,0,0) 100%)' : (isHovered ? 'rgba(255,255,255,0.03)' : 'transparent'), borderLeft: isActive ? '3px solid #e94560' : '3px solid transparent' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: showDelete ? '#ff4d4f' : '#2a2a35', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', color: 'white' }}>{showDelete ? '✕' : c.name.charAt(0).toUpperCase()}</div>
                  <span style={{ fontSize: '13px', fontWeight: isActive ? '600' : '500', color: showDelete ? '#ff4d4f' : (isActive ? '#fff' : '#ccc') }}>{showDelete ? 'Delete' : c.name.split(' ')[0]}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {pt && <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 8px #4ade80' }}></div>}
              <span style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{pt ? pt.name : 'New Message'}</span>
            </div>
            <button onClick={onClose} style={{ border: 'none', background: 'transparent', color: '#888', cursor: 'pointer', fontSize: '16px' }}>✕</button>
          </div>

          {!pt && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
              <div style={{ fontSize: '40px', marginBottom: '16px' }}>👋</div>
              <p style={{ fontSize: '15px', marginBottom: '24px', color: '#aaa' }}>Enter an email to connect</p>
              {findError && <div style={{ color: '#ff4d4f', fontSize: '13px', marginBottom: '16px', background: 'rgba(255,77,79,0.1)', padding: '8px', borderRadius: '6px' }}>{findError}</div>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="email" placeholder="trainer@email.com" value={ptEmail} onChange={e => setPtEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFindPT()} style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white', outline: 'none' }} />
                <button onClick={() => handleFindPT()} disabled={finding} style={{ padding: '0 24px', borderRadius: '8px', background: '#e94560', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Find</button>
              </div>
            </div>
          )}

          {pt && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loadingHistory ? <p style={{ textAlign: 'center', color: '#666', fontSize: '13px' }}>Loading history...</p> : 
                 messages.length === 0 ? <p style={{ textAlign: 'center', color: '#666', fontSize: '13px', margin: 'auto' }}>Say hello 👋</p> : 
                 messages.map(msg => {
                   const isMe = (msg.fromUser?._id?.toString() || msg.fromUser?.toString()) === user._id.toString()
                   const dataPill = parseDataPill(msg) 

                   return (
                    <div key={msg._id} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', display: 'flex', flexDirection: 'column', maxWidth: '75%' }}>
                      <div style={{ padding: '12px 16px', background: isMe ? 'linear-gradient(135deg, #e94560 0%, #c2334b 100%)' : '#2a2a35', color: '#fff', fontSize: '14px', borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                        
                        {dataPill && (
                          <button 
                            onClick={() => setViewingData({ ...dataPill, isMe })}
                            style={{ 
                              width: '100%', marginBottom: '8px', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', transition: '0.2s',
                              background: dataPill.type === 'todos' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(74, 222, 128, 0.15)',
                              border: dataPill.type === 'todos' ? '1px solid rgba(251, 191, 36, 0.4)' : '1px solid rgba(74, 222, 128, 0.4)',
                              color: dataPill.type === 'todos' ? '#fbbf24' : '#4ade80' 
                            }}
                          >
                            {dataPill.type === 'todos' ? `📝 View Todo List (${dataPill.data.length} Exercises)` : 
                             dataPill.type === 'metrics' && Array.isArray(dataPill.data) ? `📊 View Today's Metrics (${dataPill.data.length} Lifts)` :
                             `📊 View Today's Metrics`}
                          </button>
                        )}
                        <p style={{ margin: 0 }}>{msg.text}</p>
                      </div>
                      <span style={{ fontSize: '10px', color: '#666', alignSelf: isMe ? 'flex-end' : 'flex-start', marginTop: '6px', padding: '0 4px' }}>{new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                   )
                })}
                <div ref={bottomRef} />
              </div>

              <div style={{ padding: '16px 20px', background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', cursor: 'pointer', width: 'fit-content' }}>
                   <input type="checkbox" checked={includeSnapshot} onChange={e => setIncludeSnapshot(e.target.checked)} style={{ accentColor: '#e94560' }} />
                   <span style={{ fontSize: '12px', color: '#aaa', fontWeight: '500' }}>Attach today's metrics</span>
                </label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input type="text" placeholder="Message..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendText()} style={{ flex: 1, padding: '12px 20px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'white', outline: 'none' }} />
                  <button onClick={handleSendText} disabled={!text.trim() || sending} style={{ background: text.trim() ? '#e94560' : '#333', color: text.trim() ? 'white' : '#666', border: 'none', borderRadius: '30px', padding: '0 24px', cursor: text.trim() ? 'pointer' : 'default', fontWeight: 'bold' }}>Send</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🚨 THE FIX: Z-Index 9999998 pushes this entirely above the Chatbox 🚨 */}
      {viewingData && (
        <div className="modal-overlay-premium" style={{ 
          position: 'fixed', top: '80px', left: 0, right: 0, bottom: 0, 
          zIndex: 9999998, // Higher than Chatbox (999999), lower than Navbar (9999999)
          background: 'rgba(0,0,0,0.7)', 
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
          paddingTop: '30px' 
        }}>
          <div className="modal-content-premium" style={{ 
            background: 'linear-gradient(145deg, rgba(25,25,35,0.95) 0%, rgba(10,10,15,0.95) 100%)', 
            width: '500px', 
            maxHeight: 'calc(100vh - 130px)', 
            borderRadius: '24px', 
            border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', 
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 30px 60px -15px rgba(0,0,0,0.9)' 
          }}>
            
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: viewingData.type === 'metrics' ? '#4ade80' : '#fbbf24', fontSize: '20px' }}>
                {viewingData.type === 'metrics' ? '📊 Shared Metrics' : '📝 Shared Todo List'}
              </h3>
              <button onClick={() => setViewingData(null)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '20px', transition: '0.2s' }} onMouseEnter={e => e.target.style.color = '#fff'} onMouseLeave={e => e.target.style.color = '#888'}>✕</button>
            </div>

            <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {viewingData.type === 'metrics' && Array.isArray(viewingData.data) ? (
                <>
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                     <div style={{ flex: 1, background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                       <div style={{ fontSize: '22px', fontWeight: '900', color: '#4ade80' }}>{viewingData.data.length}</div>
                       <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Exercises</div>
                     </div>
                     <div style={{ flex: 1, background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                       <div style={{ fontSize: '22px', fontWeight: '900', color: '#4ade80' }}>{viewingData.data.reduce((s, w) => s + w.sets, 0)}</div>
                       <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Sets</div>
                     </div>
                     <div style={{ flex: 1, background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                       <div style={{ fontSize: '22px', fontWeight: '900', color: '#4ade80' }}>{viewingData.data.reduce((s, w) => s + (w.sets * w.reps), 0)}</div>
                       <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Reps</div>
                     </div>
                     <div style={{ flex: 1, background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                       <div style={{ fontSize: '22px', fontWeight: '900', color: '#4ade80' }}>{viewingData.data.reduce((s, w) => s + w.weight, 0)}<span style={{fontSize: '14px', fontWeight: 'normal'}}>kg</span></div>
                       <div style={{ fontSize: '11px', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>Volume</div>
                     </div>
                  </div>

                  {viewingData.data.map((w, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(74, 222, 128, 0.2)', borderLeft: '4px solid #4ade80', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#fff' }}>{idx + 1}. {w.title}</h4>
                          <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>{w.sets} Sets × {w.reps} Reps @ {w.weight}kg</p>
                        </div>
                        <span style={{ fontSize: '11px', background: 'rgba(74, 222, 128, 0.15)', color: '#4ade80', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                          {w.category || 'General'}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              ) : viewingData.type === 'metrics' ? (
                <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #4ade80', color: '#fff', fontFamily: 'monospace', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {viewingData.data}
                </div>
              ) : null}

              {viewingData.type === 'todos' && viewingData.data.map((todo, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251, 191, 36, 0.2)', borderLeft: '4px solid #fbbf24', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#fff' }}>{idx + 1}. {todo.title}</h4>
                      <p style={{ margin: 0, fontSize: '14px', color: '#aaa' }}>{todo.sets} Sets × {todo.reps} Reps @ {todo.weight}kg</p>
                    </div>
                    <span style={{ fontSize: '11px', background: 'rgba(251, 191, 36, 0.15)', color: '#fbbf24', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
                      {todo.category || 'General'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {viewingData.type === 'todos' && !viewingData.isMe && (
              <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <button 
                  onClick={() => { onAcceptTodos(viewingData.data); setViewingData(null); }} 
                  style={{ width: '100%', padding: '14px', background: '#fbbf24', color: '#111', fontWeight: '900', fontSize: '16px', borderRadius: '12px', border: 'none', cursor: 'pointer', transition: '0.2s', boxShadow: '0 4px 15px rgba(251, 191, 36, 0.3)' }}
                  onMouseEnter={e => e.target.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                >
                  Accept & Plan List
                </button>
              </div>
            )}
            
          </div>
        </div>
      )}
    </>
  )
}