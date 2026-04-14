// ─── components/EditModal.jsx ─────────────────────────────────────────────────
// Modal form to edit an existing workout.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const CATEGORIES = ['General', 'Chest', 'Back', 'Legs', 'Arms', 'Shoulders', 'Core', 'Cardio']

export default function EditModal({ workout, onClose, onSave }) {
  const [title,    setTitle]    = useState(workout.title)
  const [reps,     setReps]     = useState(workout.reps)
  const [sets,     setSets]     = useState(workout.sets)
  const [weight,   setWeight]   = useState(workout.weight)
  const [category, setCategory] = useState(workout.category)
  const [notes,    setNotes]    = useState(workout.notes || '')
  const [loading,  setLoading]  = useState(false)

  const { user } = useAuth()

  const handleSave = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await axios.patch(
        `http://localhost:5000/api/workouts/${workout._id}`,
        { title, reps: Number(reps), sets: Number(sets), weight: Number(weight), category, notes },
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      onSave(res.data)
      toast.success('Workout updated!')
    } catch {
      toast.error('Could not update workout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>✏️ Edit Workout</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label>Exercise Name</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Sets</label>
              <input type="number" min="1" value={sets} onChange={e => setSets(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Reps</label>
              <input type="number" min="1" value={reps} onChange={e => setReps(e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input type="number" min="0" value={weight} onChange={e => setWeight(e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-red" style={{ padding: '10px 28px', width: 'auto' }}
              disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
