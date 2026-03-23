const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// ইউজারের সিকিউরিটি (protect)
const { protect } = require('../middleware/authMiddleware');

// 🚀 ম্যাজিক ফিক্স: আপনার আসল অ্যাডমিন সিকিউরিটির নাম (adminProtect) বসানো হলো
const { adminProtect } = require('../middleware/adminAuth'); 

// --- User Routes ---
router.post('/', protect, ticketController.createTicket);
router.get('/my-tickets', protect, ticketController.getUserTickets);

// --- Admin Routes ---
router.get('/all', adminProtect, ticketController.getAllTickets);
router.put('/:ticketId/reply', adminProtect, ticketController.replyTicket);

module.exports = router;