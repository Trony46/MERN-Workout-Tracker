// ─── routes/workouts.js ───────────────────────────────────────────────────────
// All workout CRUD routes.
// router.use(protect) means ALL routes here require a valid login token.
// ─────────────────────────────────────────────────────────────────────────────

const express  = require('express')
const router   = express.Router()
const { protect } = require('../middleware/authMiddleware')
const {
  getWorkouts,
  addWorkout,
  deleteWorkout,
  updateWorkout,
} = require('../controllers/workoutController')

// All routes below this line are protected (need login)
router.use(protect)

router.get('/',        getWorkouts)    // GET    /api/workouts
router.post('/',       addWorkout)     // POST   /api/workouts
router.delete('/:id',  deleteWorkout)  // DELETE /api/workouts/:id
router.patch('/:id',   updateWorkout)  // PATCH  /api/workouts/:id

module.exports = router
