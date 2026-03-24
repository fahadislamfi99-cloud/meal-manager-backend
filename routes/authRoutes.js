const express = require('express');
const mongoose = require('mongoose'); // 👈 Mongoose ইমপোর্ট করা হলো
const router = express.Router(); // 👈 Router তৈরি হলো

// ১. কন্ট্রোলার থেকে সবগুলো প্রয়োজনীয় ফাংশন ইমপোর্ট করা হলো
const { 
    registerMess, 
    loginMess, 
    loginMember, 
    getProfile, 
    updateProfile,
    forgotPin,
    resetPin
} = require('../controllers/authController');

// ২. প্রোফাইল সিকিউর করার জন্য মিডলওয়্যার (গার্ড) ইমপোর্ট করা হলো
const { protect } = require('../middleware/authMiddleware');

// ==========================================
// --- ⚠️ DANGER: FACTORY RESET ROUTE ---
// ==========================================
// 🚀 ম্যাজিক: এবার এটি সঠিক জায়গায় আছে
router.get('/factory-reset', async (req, res) => {
    try {
        await mongoose.connection.db.dropDatabase();
        res.send("<h1 style='color: green;'>Database Cleaned Successfully! 🚀</h1><p>You can now register a new Mess from your app.</p>");
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
});

// ==========================================
// --- AUTHENTICATION ROUTES ---
// ==========================================
router.post('/register', registerMess);
router.post('/login', loginMess); 
router.post('/login-member', loginMember);

// ==========================================
// --- PROFILE MANAGEMENT ROUTES ---
// ==========================================
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

// ==========================================
// --- FORGOT PIN ROUTES ---
// ==========================================
router.post('/forgot-pin', forgotPin);
router.post('/reset-pin', resetPin);

module.exports = router;