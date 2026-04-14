// ─── controllers/workoutController.js ────────────────────────────────────────
// All the logic for creating, reading, updating, and deleting workouts.
// req.user is available here because the protect middleware runs first.
// ─────────────────────────────────────────────────────────────────────────────

const Workout = require('../models/Workout')

// ── GET all workouts for the logged-in user ────────────────────────────────
const getWorkouts = async (req, res) => {
  const workouts = await Workout.find({ user: req.user._id }).sort({ createdAt: -1 })
  res.json(workouts)
}

// ── POST add a new workout ─────────────────────────────────────────────────
const addWorkout = async (req, res) => {
  const { title, reps, sets, weight, category, notes } = req.body

  const workout = await Workout.create({
    user: req.user._id,     // Link workout to the logged-in user
    title, reps, sets, weight, category, notes,
  })

  res.status(201).json(workout)
}

// ── DELETE a workout by ID ─────────────────────────────────────────────────
const deleteWorkout = async (req, res) => {
  const workout = await Workout.findById(req.params.id)

  if (!workout) return res.status(404).json({ error: 'Workout not found' })

  await workout.deleteOne()
  res.json({ message: 'Workout deleted successfully' })
}

// ── PATCH update a workout by ID ───────────────────────────────────────────
const updateWorkout = async (req, res) => {
  const updated = await Workout.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }    // Return the updated document
  )

  if (!updated) return res.status(404).json({ error: 'Workout not found' })

  res.json(updated)
}

module.exports = { getWorkouts, addWorkout, deleteWorkout, updateWorkout }
