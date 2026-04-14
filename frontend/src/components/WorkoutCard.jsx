// ─── components/WorkoutCard.jsx ──────────────────────────────────────────────
// Single workout card with Edit and Delete buttons.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import EditModal from './EditModal'
import toast from 'react-hot-toast'

export default function WorkoutCard({ workout, onDelete, onUpdate }) {
  const { user }     = useAuth()
  const [showEdit, setShowEdit] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${workout.title}"?`)) return
    try {
      await axios.delete(`http://localhost:5000/api/workouts/${workout._id}`,
        { headers: { Authorization: `Bearer ${user.token}` } })
      onDelete(workout._id)
      toast('Workout deleted', { icon: '🗑️' })
    } catch {
      toast.error('Could not delete workout')
    }
  }

  const date = new Date(workout.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <>
      <div className="workout-card">
        <div className="workout-card-left">
          <div className="workout-title">{workout.title}</div>
          <div className="workout-meta">
            <span className="workout-badge">{workout.sets} sets</span>
            <span className="workout-badge">{workout.reps} reps</span>
            <span className="workout-badge">{workout.weight} kg</span>
            <span className="workout-badge category">{workout.category}</span>
          </div>
          {workout.notes && <div className="workout-notes">📝 {workout.notes}</div>}
          <div className="workout-date">{date}</div>
        </div>
        <div className="workout-card-actions">
          <button className="btn-edit btn-sm" onClick={() => setShowEdit(true)}>Edit</button>
          <button className="btn-danger btn-sm" onClick={handleDelete}>Delete</button>
        </div>
      </div>

      {showEdit && (
        <EditModal
          workout={workout}
          onClose={() => setShowEdit(false)}
          onSave={(updated) => { onUpdate(updated); setShowEdit(false) }}
        />
      )}
    </>
  )
}
