const { protect } = require('../middleware/authMiddleware');
const express = require('express');
const { getMonthlyReport } = require('../controllers/reportController');
const router = express.Router();

router.route('/').get(protect, getMonthlyReport);

module.exports = router;