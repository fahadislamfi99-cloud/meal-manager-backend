const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken } = require('../middlewares/authMiddleware'); // আপনার অথেন্টিকেশন মিডলওয়্যার

// পেমেন্ট লিংক তৈরি করার রাউট (টোকেন লাগবে)
router.post('/create', verifyToken, paymentController.createPayment);

// বিকাশ থেকে ফিরে আসার রাউট (এটি ওপেন থাকবে, কারণ বিকাশ টোকেন পাঠাতে পারে না)
router.get('/callback', paymentController.bkashCallback);

module.exports = router;