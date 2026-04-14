// ─── components/WorkoutForm.jsx ──────────────────────────────────────────────
import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import TiltCard from './TiltCard'

const CATEGORIES = ['General', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Cardio']

const RANDOM_EXERCISES = [
  { title: 'Barbell Bench Press', category: 'Chest', wMin: 40, wMax: 100 },
  { title: 'Incline Dumbbell Press', category: 'Chest', wMin: 15, wMax: 40 },
  { title: 'Deadlift', category: 'Back', wMin: 60, wMax: 140 },
  { title: 'Lat Pulldown', category: 'Back', wMin: 30, wMax: 80 },
  { title: 'Barbell Squat', category: 'Legs', wMin: 50, wMax: 120 },
  { title: 'Leg Press', category: 'Legs', wMin: 100, wMax: 250 },
  { title: 'Bicep Curl', category: 'Arms', wMin: 10, wMax: 25 },
  { title: 'Overhead Press', category: 'Shoulders', wMin: 20, wMax: 60 },
  { title: 'Cable Crunch', category: 'Core', wMin: 20, wMax: 50 }
]

// 🚨 ACCEPTING mode AND setMode AS PROPS NOW 🚨
export default function WorkoutForm({ onAdd, onAddTodo, editingTodo, clearEdit, mode, setMode }) {
  const [title,    setTitle]    = useState('')
  const [reps,     setReps]     = useState('')
  const [sets,     setSets]     = useState('')
  const [weight,   setWeight]   = useState('')
  const [category, setCategory] = useState('General')
  const [notes,    setNotes]    = useState('')
  const [loading,  setLoading]  = useState(false)

  const { user } = useAuth()

  useEffect(() => {
    if (editingTodo) {
      setTitle(editingTodo.title)
      setReps(editingTodo.reps.toString())
      setSets(editingTodo.sets.toString())
      setWeight(editingTodo.weight.toString())
      setCategory(editingTodo.category)
      setNotes(editingTodo.notes || '')
      setMode('todo')
    }
  }, [editingTodo, setMode])

  const handleRandomFill = () => {
    const randomEx = RANDOM_EXERCISES[Math.floor(Math.random() * RANDOM_EXERCISES.length)]
    setTitle(randomEx.title)
    setCategory(randomEx.category)
    setSets((Math.floor(Math.random() * 3) + 3).toString())
    setReps((Math.floor(Math.random() * 8) + 5).toString())
    
    const weightRange = randomEx.wMax - randomEx.wMin
    let randomWeight = 0
    if (weightRange > 0) {
      randomWeight = randomEx.wMin + (Math.floor(Math.random() * (weightRange / 5 + 1)) * 5)
    }
    setWeight(randomWeight.toString())
    setNotes('Autofilled for demo purposes 🚀')
    toast('Random exercise loaded!', { icon: '🎲' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const workoutData = { title, reps: Number(reps), sets: Number(sets), weight: Number(weight), category, notes }

    if (mode === 'todo') {
      onAddTodo({ ...workoutData, _id: editingTodo ? editingTodo._id : `todo-${Date.now()}` })
      toast.success(editingTodo ? 'Todo Updated!' : 'Added to Todo List! 📝', {
        style: { background: '#fbbf24', color: '#111', fontWeight: 'bold' }, iconTheme: { primary: '#111', secondary: '#fbbf24' }
      })
      if (editingTodo) clearEdit()
      resetForm()
      return
    }

    setLoading(true)
    try {
      const res = await axios.post(
        'http://localhost:5000/api/workouts',
        workoutData,
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      onAdd(res.data)
      toast.success(`${title} logged! 💪`)
      resetForm()
    } catch (err) {
      toast.error('Could not save workout')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTitle(''); setReps(''); setSets(''); setWeight(''); setCategory('General'); setNotes('')
  }

  return (
    <TiltCard className="form-card">
      <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: '10px', padding: '6px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          type="button"
          onClick={() => { setMode('log'); clearEdit(); }}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: '0.2s',
            background: mode === 'log' ? '#e94560' : 'transparent', color: mode === 'log' ? '#fff' : '#888' }}
        >
          ⚡ Direct Log
        </button>
        <button 
          type="button"
          onClick={() => setMode('todo')}
          style={{ flex: 1, padding: '10px', borderRadius: '6px', border: 'none', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', transition: '0.2s',
            background: mode === 'todo' ? '#fbbf24' : 'transparent', color: mode === 'todo' ? '#111' : '#888' }}
        >
          📝 Plan Todo
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: mode === 'todo' ? '#fbbf24' : '#fff' }}>
          {mode === 'todo' ? (editingTodo ? '✏️ Edit Todo' : '📝 Add Todo') : '➕ Log Workout'}
        </h3>
        <button type="button" onClick={handleRandomFill} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid #555', color: '#fff', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}>
          🎲 Fill
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Exercise Name</label>
          <input type="text" placeholder="e.g. Bench Press" value={title} onChange={e => setTitle(e.target.value)} required />
        </div>
        <div className="form-row">
          <div className="form-group"><label>Sets</label><input type="number" placeholder="3" min="1" value={sets} onChange={e => setSets(e.target.value)} required /></div>
          <div className="form-group"><label>Reps</label><input type="number" placeholder="12" min="1" value={reps} onChange={e => setReps(e.target.value)} required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Weight (kg)</label><input type="number" placeholder="60" min="0" value={weight} onChange={e => setWeight(e.target.value)} required /></div>
          <div className="form-group">
            <label>Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group"><label>Notes</label><textarea placeholder="Optional notes..." value={notes} onChange={e => setNotes(e.target.value)} /></div>
        
        <button 
          className="btn-red" type="submit" disabled={loading} 
          style={{ width: '100%', background: mode === 'todo' ? '#fbbf24' : '#e94560', color: mode === 'todo' ? '#111' : '#fff' }}
        >
          {loading ? 'Saving...' : (mode === 'todo' ? (editingTodo ? 'Update Todo' : 'Save to Todo List') : 'Save to DB')}
        </button>
      </form>
    </TiltCard>
  )
}






