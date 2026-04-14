// ─── pages/HomePage.jsx ──────────────────────────────────────────────────────
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth }       from '../context/AuthContext'
import { useSocket }     from '../context/SocketContext'
import Navbar            from '../components/Navbar'
import WorkoutForm       from '../components/WorkoutForm'
import WorkoutCard       from '../components/WorkoutCard'
import ChartsSection     from '../components/ChartsSection'
import StreakBadge       from '../components/StreakBadge'
import ChatBox           from '../components/ChatBox'
import toast             from 'react-hot-toast'
import TiltCard          from '../components/TiltCard' 

const getTodayKey = () => new Date().toISOString().split('T')[0]

export default function HomePage() {
  const [workouts,    setWorkouts]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selectedDay, setSelectedDay] = useState(getTodayKey()) 
  const [catFilter,   setCatFilter]   = useState('All')
  const [chatOpen,    setChatOpen]    = useState(false)
  const [mode,        setMode]        = useState('log') 

  const [todos, setTodos] = useState(() => JSON.parse(localStorage.getItem('workout_todos')) || [])
  const [editingTodo, setEditingTodo] = useState(null)
  const [processingTodo, setProcessingTodo] = useState(null) 
  const [shareModalTodos, setShareModalTodos] = useState(null)

  const { user } = useAuth()
  const { socket, unreadCount, clearNotifications } = useSocket()

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/workouts', { headers: { Authorization: `Bearer ${user.token}` } })
        setWorkouts(res.data)
      } catch { toast.error('Could not load workouts') } finally { setLoading(false) }
    }
    loadWorkouts()
  }, [user.token])

  useEffect(() => {
    localStorage.setItem('workout_todos', JSON.stringify(todos))
  }, [todos])

  useEffect(() => {
    if (unreadCount > 0 && !chatOpen) toast(`You have ${unreadCount} new message${unreadCount > 1 ? 's' : ''} — click PT Chat 💬`, { icon: '🔔', duration: 4000 })
  }, [unreadCount])

  const handleAdd    = (w)   => setWorkouts([w, ...workouts])
  const handleDelete = (id)  => setWorkouts(workouts.filter(w => w._id !== id))
  const handleUpdate = (upd) => setWorkouts(workouts.map(w => w._id === upd._id ? upd : w))

  const handleAddTodo = (newTodo) => {
    if (editingTodo) {
      setTodos(prev => prev.map(t => t._id === newTodo._id ? newTodo : t))
    } else {
      setTodos(prev => [newTodo, ...prev])
    }
  }

  const handleDeleteTodo = (id) => setTodos(prev => prev.filter(t => t._id !== id))
  const handleEditTodo = (todo) => setEditingTodo(todo)

  const handleCompleteTodo = async (todo) => {
    setProcessingTodo(todo._id)
    try {
      const res = await axios.post('http://localhost:5000/api/workouts', 
        { title: todo.title, reps: todo.reps, sets: todo.sets, weight: todo.weight, category: todo.category, notes: todo.notes },
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      handleAdd(res.data)
      handleDeleteTodo(todo._id)
      toast.success(`${todo.title} Completed! ✅`, { style: { background: '#4ade80', color: '#111', fontWeight: 'bold' } })
    } catch (err) {
      toast.error('Failed to log completed todo.')
    } finally {
      setProcessingTodo(null)
    }
  }

  const handleSendShare = (contactId, contactName) => {
    if (!socket) {
      toast.error('Chat not connected. Please refresh.')
      return
    }

    const payloadTodos = shareModalTodos.map(t => ({
      title: t.title, sets: t.sets, reps: t.reps, weight: t.weight, category: t.category, notes: t.notes
    }))

    const encodedPayload = JSON.stringify({ type: 'todos', data: payloadTodos })

    socket.emit('send_message', {
      fromUserId: user._id, 
      toUserId: contactId, 
      text: `Shared a Todo List with ${payloadTodos.length} exercise(s) 📝`, 
      workoutSnapshot: encodedPayload,
      workoutTodo: null 
    })

    toast.success(`Todo List sent to ${contactName}! 🚀`)
    setShareModalTodos(null) 
  }

  const handleDaySelect = (dayKey) => {
    setSelectedDay(dayKey)
    setCatFilter('All')
    if (dayKey === 'all') toast('Showing all-time metrics', { icon: '📊' })
    else if (dayKey === getTodayKey()) toast('Showing today\'s metrics', { icon: '📅' })
    else toast(`Metrics for ${new Date(dayKey + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`, { icon: '📅' })
  }

  const dayWorkouts = selectedDay === 'all' ? workouts : workouts.filter(w => new Date(w.createdAt).toISOString().split('T')[0] === selectedDay)
  const CATS = ['All', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Cardio', 'General']
  const visibleWorkouts = catFilter === 'All' ? dayWorkouts : dayWorkouts.filter(w => w.category === catFilter)

  const totalSets   = dayWorkouts.reduce((s, w) => s + w.sets, 0)
  const totalReps   = dayWorkouts.reduce((s, w) => s + w.sets * w.reps, 0)
  const totalWeight = dayWorkouts.reduce((s, w) => s + w.weight, 0)

  const todayWorkouts = workouts.filter(w => new Date(w.createdAt).toISOString().split('T')[0] === getTodayKey())
  const dayLabel = selectedDay === 'all' ? 'All Time' : selectedDay === getTodayKey() ? 'Today' : new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
  const savedContacts = JSON.parse(localStorage.getItem(`contacts_${user?._id}`) || '[]')

  return (
    <div>
      <Navbar onChatToggle={() => setChatOpen(!chatOpen)} chatOpen={chatOpen} />

      <div className="home-page">
        <div className="home-header-row">
          <div><h2>Dashboard</h2><p>Stay consistent. Every rep counts.</p></div>
          {workouts.length > 0 && <StreakBadge workouts={workouts} />}
        </div>

        <div className="stats-heading-row">
          <span className="stats-heading-text">Metrics — <strong>{dayLabel}</strong></span>
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedDay !== getTodayKey() && selectedDay !== 'all' && (<button className="btn-ghost-sm" onClick={() => handleDaySelect(getTodayKey())}>Back to Today</button>)}
            <button className={`btn-ghost-sm ${selectedDay === 'all' ? 'active-ghost' : ''}`} onClick={() => handleDaySelect('all')}>All Time</button>
          </div>
        </div>

        <div className="stats-bar">
          <TiltCard className="stat-card"><div className="stat-number">{dayWorkouts.length}</div><div className="stat-label">Exercises</div></TiltCard>
          <TiltCard className="stat-card"><div className="stat-number">{totalSets}</div><div className="stat-label">Total Sets</div></TiltCard>
          <TiltCard className="stat-card"><div className="stat-number">{totalReps}</div><div className="stat-label">Total Reps</div></TiltCard>
          <TiltCard className="stat-card"><div className="stat-number">{totalWeight} kg</div><div className="stat-label">Weight Lifted</div></TiltCard>
        </div>

        <ChartsSection workouts={workouts} selectedDay={selectedDay} onDaySelect={handleDaySelect} />
        <div className="section-divider" />

        <div className="home-grid">
          <div className="left-col">
            <WorkoutForm onAdd={handleAdd} onAddTodo={handleAddTodo} editingTodo={editingTodo} clearEdit={() => setEditingTodo(null)} mode={mode} setMode={setMode} />
          </div>

          <div className="workouts-section">
            <div className="workouts-header">
              <h3 style={{ color: mode === 'todo' ? '#fbbf24' : '#fff' }}>
                {mode === 'todo' ? `📝 Pending Todos (${todos.length})` : selectedDay === 'all' ? '📋 All Workouts' : `📋 Workouts — ${dayLabel}`}
              </h3>

              {mode === 'log' ? (
                <div className="filter-pills">
                  {CATS.map(cat => (
                    <button key={cat} className={`filter-pill ${catFilter === cat ? 'active' : ''}`} onClick={() => setCatFilter(cat)}>{cat}</button>
                  ))}
                </div>
              ) : (
                todos.length > 0 && (
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <button onClick={() => setShareModalTodos(todos)} style={{ background: 'transparent', border: 'none', color: '#4ade80', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}>Share All 🔗</button>
                    <button onClick={() => setTodos([])} style={{ background: 'transparent', border: 'none', color: '#ff4d4f', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>Clear All</button>
                  </div>
                )
              )}
            </div>

            {mode === 'log' ? (
              loading ? (
                <div className="workout-list">{[1, 2, 3].map(i => (<div key={i} className="skeleton-card"><div className="skeleton-line wide" /><div className="skeleton-line narrow" /></div>))}</div>
              ) : visibleWorkouts.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">🏋️</div><p>{selectedDay === 'all' ? 'No workouts yet. Log your first one!' : `No ${catFilter !== 'All' ? catFilter + ' ' : ''}workouts on ${dayLabel}.`}</p></div>
              ) : (
                <div className="workout-list">
                  {visibleWorkouts.map((w, index) => (
                    <div key={w._id} style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                      <div style={{ color: '#666', fontWeight: '900', fontSize: '18px', width: '28px', textAlign: 'right' }}>
                        {index + 1}.
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <WorkoutCard workout={w} onDelete={handleDelete} onUpdate={handleUpdate} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              todos.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📝</div><p>Your todo list is empty. Plan your next workout!</p></div>
              ) : (
                <div className="workout-list">
                  {todos.map((todo, idx) => (
                    <TiltCard key={todo._id} className="tilt-wrapper" style={{ transition: 'none' }}>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(251, 191, 36, 0.3)', borderLeft: '4px solid #fbbf24', borderRadius: '8px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#fff' }}>{idx + 1}. {todo.title}</h4>
                            <p style={{ margin: 0, fontSize: '13px', color: '#aaa' }}>{todo.sets} Sets × {todo.reps} Reps @ {todo.weight}kg</p>
                          </div>
                          <span style={{ fontSize: '11px', background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{todo.category}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                          <button onClick={() => handleCompleteTodo(todo)} disabled={processingTodo === todo._id} style={{ flex: 1, padding: '8px', background: '#4ade80', color: '#111', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                            {processingTodo === todo._id ? '⏳' : '✅'} Done
                          </button>
                          <button onClick={() => setShareModalTodos([todo])} style={{ padding: '8px 12px', background: 'rgba(74, 222, 128, 0.2)', color: '#4ade80', border: 'none', borderRadius: '6px', cursor: 'pointer' }} title="Share Todo">🔗</button>
                          <button onClick={() => handleEditTodo(todo)} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>✏️</button>
                          <button onClick={() => handleDeleteTodo(todo._id)} style={{ padding: '8px 12px', background: 'rgba(255,77,79,0.2)', color: '#ff4d4f', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </div>
                    </TiltCard>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {chatOpen && (
        <ChatBox
          todayWorkouts={todayWorkouts}
          onClose={() => setChatOpen(false)}
          onAcceptTodos={(todosArray) => {
            const newTodosWithIds = todosArray.map(todo => ({
              ...todo,
              _id: `todo-${Date.now()}-${Math.random()}`
            }))
            setTodos(prev => [...newTodosWithIds, ...prev])
            setMode('todo') 
            toast.success(`${todosArray.length} Todo(s) Accepted & Planned!`, { style: { background: '#fbbf24', color: '#111', fontWeight: 'bold' } })
          }}
        />
      )}

      {/* 🚨 THE FIX: Z-Index 9999998 pushes this entirely above the Chatbox 🚨 */}
      {shareModalTodos && (
        <div className="modal-overlay-premium" style={{ 
          position: 'fixed', top: '80px', left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.7)', 
          zIndex: 9999998, // Higher than Chatbox (999999), lower than Navbar (9999999)
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center', 
          paddingTop: '30px' 
        }}>
          <div className="modal-content-premium" style={{ 
            background: 'linear-gradient(145deg, rgba(25,25,35,0.95) 0%, rgba(10,10,15,0.95) 100%)', 
            padding: '28px', borderRadius: '24px', width: '340px', 
            border: '1px solid rgba(255,255,255,0.1)', 
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 30px 60px -15px rgba(0,0,0,0.9)',
            maxHeight: 'calc(100vh - 130px)' 
          }}>
            
            <h3 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '20px' }}>Share Todo(s)</h3>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 24px 0', lineHeight: 1.4 }}>
              Select a contact to send <strong style={{color: '#fbbf24'}}>{shareModalTodos.length}</strong> planned workout(s).
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', paddingRight: '4px' }}>
              {savedContacts.map(c => (
                <button 
                  key={c._id} 
                  className="contact-share-btn"
                  onClick={() => handleSendShare(c._id, c.name)} 
                  style={{ 
                    padding: '14px', background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.05)', color: 'white', 
                    borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', gap: '12px'
                  }}
                >
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: '600', fontSize: '14px' }}>{c.name}</span>
                </button>
              ))}
              {savedContacts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '13px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  No contacts found.<br/>Open PT Chat to add someone!
                </div>
              )}
            </div>
            
            <button onClick={() => setShareModalTodos(null)} style={{ marginTop: '20px', width: '100%', padding: '12px', background: 'transparent', color: '#888', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', transition: '0.2s' }} onMouseEnter={(e) => e.target.style.color = '#fff'} onMouseLeave={(e) => e.target.style.color = '#888'}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}