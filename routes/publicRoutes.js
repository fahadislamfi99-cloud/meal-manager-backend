const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const reportController = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

// ১. 🌐 পাবলিক রুট (লগিন ছাড়া রিপোর্ট দেখার জন্য)
router.get('/report/:token', async (req, res, next) => {
    try {
        const setting = await Setting.findOne({ shareToken: req.params.token });
        if (!setting) {
            return res.status(404).json({ success: false, message: 'এই লিংকটির মেয়াদ শেষ বা এটি বাতিল করা হয়েছে! 🚫' });
        }
        req.messId = setting.messId; 
        req.query.startDate = setting.periodStart; 
        req.query.endDate = setting.periodEnd;
        return reportController.getMonthlyReport(req, res, next); 
    } catch (error) { next(error); }
});

// ২. 🔗 বর্তমান লিংক পাওয়ার রুট (যদি না থাকে, তবে তৈরি করে দেবে)
router.get('/get-token', protect, async (req, res, next) => {
    try {
        let setting = await Setting.findOne({ messId: req.messId });
        if (!setting) {
            setting = await Setting.create({ messId: req.messId });
        }
        // যদি পুরনো ডাটাবেস হয় এবং টোকেন না থাকে
        if (!setting.shareToken) {
            setting.shareToken = Math.random().toString(36).substring(2, 10);
            await setting.save();
        }
        res.status(200).json({ success: true, shareToken: setting.shareToken });
    } catch (error) { next(error); }
});

// ৩. 🔄 লিংক রিসেট করার রুট
router.post('/reset-token', protect, async (req, res, next) => {
    try {
        const newToken = Math.random().toString(36).substring(2, 10);
        const setting = await Setting.findOneAndUpdate(
            { messId: req.messId },
            { shareToken: newToken },
            { new: true, upsert: true }
        );
        res.status(200).json({ success: true, shareToken: setting.shareToken });
    } catch (error) { next(error); }
});

module.exports = router;