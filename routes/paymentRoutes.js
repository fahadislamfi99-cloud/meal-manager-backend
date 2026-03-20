const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// 🚀 ম্যাজিক: verifyToken এর বদলে আপনার আসল ফাংশন protect কে ইমপোর্ট করা হলো
const { protect } = require('../middleware/authMiddleware'); 

// পেমেন্ট লিংক তৈরি করার রাউট (টোকেন লাগবে)
router.post('/create', protect, paymentController.createPayment);

// বিকাশ থেকে ফিরে আসার রাউট (এটি ওপেন থাকবে, কারণ বিকাশ টোকেন পাঠাতে পারে না)
router.get('/callback', paymentController.bkashCallback);

module.exports = router;