const { protect } = require('../middleware/authMiddleware');
const express = require('express');

// ১. 🚀 ম্যাজিক: getTerms ফাংশনটি ইমপোর্ট করা হলো
const { setManager, getManager, getTerms } = require('../controllers/managerController'); 
const router = express.Router();

// ২. 🚀 ম্যাজিক: /terms এর জন্য নতুন রাউট তৈরি করা হলো
router.get('/terms', protect, getTerms);

router.route('/').post(protect, setManager).get(protect, getManager);

module.exports = router;