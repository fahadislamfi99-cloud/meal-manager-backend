const { protect } = require('../middleware/authMiddleware');
const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingController');
const router = express.Router();

// GET রিকোয়েস্ট দিয়ে সেটিংস দেখাবে এবং POST রিকোয়েস্ট দিয়ে সেটিংস আপডেট করবে
router.route('/').get(protect, getSettings).post(protect, updateSettings);

module.exports = router;