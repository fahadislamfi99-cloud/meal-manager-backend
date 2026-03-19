const express = require('express');
const { addMember, getMembers, updateMember, deleteMember } = require('../controllers/memberController');

// 🛡️ নতুন লাইন: আমাদের সিকিউরিটি গার্ড ইমপোর্ট করলাম
const { protect } = require('../middleware/authMiddleware'); 

const router = express.Router();

// 🛡️ প্রতিটি রিকোয়েস্টের আগে protect গার্ড বসানো হলো
router.route('/')
    .get(protect, getMembers)
    .post(protect, addMember);

router.route('/:id')
    .put(protect, updateMember)
    .delete(protect, deleteMember);

module.exports = router;