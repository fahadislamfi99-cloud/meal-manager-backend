const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const authMiddleware = require('../middleware/authMiddleware');
const adminAuth = require('../middleware/adminAuth');

// --- User Routes (মেস ম্যানেজারদের জন্য) ---
router.post('/', authMiddleware, ticketController.createTicket);
router.get('/my-tickets', authMiddleware, ticketController.getUserTickets);

// --- Admin Routes (আপনার জন্য) ---
router.get('/all', adminAuth, ticketController.getAllTickets);
router.put('/:ticketId/reply', adminAuth, ticketController.replyTicket);

module.exports = router;