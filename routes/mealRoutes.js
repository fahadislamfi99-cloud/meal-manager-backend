const { protect } = require('../middleware/authMiddleware');
const express = require('express');
const { addMeal, getMealsByMonth, getTotalMealCount, updateMeal, deleteMeal } = require('../controllers/mealController');
const router = express.Router();

router.route('/').post(protect, addMeal).get(protect, getMealsByMonth);
router.route('/count').get(protect, getTotalMealCount);
router.route('/:id').put(protect, updateMeal).delete(protect, deleteMeal); // <-- নতুন লাইন

module.exports = router;