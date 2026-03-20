const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { adminProtect } = require('../middleware/adminAuth'); // আপনার সিকিউরিটি ফাইল

// ওপেন রাউট (লগিন করার জন্য কোনো টোকেন লাগে না)
router.post('/login', adminController.adminLogin);

// 🛡️ হাইলি সিকিউরড রাউট (শুধুমাত্র সুপার অ্যাডমিন টোকেন দিয়ে ঢুকতে পারবে)
router.get('/messes', adminProtect, adminController.getAllMesses);
router.post('/toggle-subscription', adminProtect, adminController.toggleGlobalSubscription);
router.post('/coupons', adminProtect, adminController.createCoupon);
router.put('/messes/:messId/cancel', adminProtect, adminController.cancelSubscription);

// Price Control Routes
router.get('/pricing', adminController.getPricing); // ওপেন রাউট
router.post('/pricing', adminProtect, adminController.updatePricing); // সিকিউরড রাউট

router.get('/coupons', adminProtect, adminController.getAllCoupons);

router.get('/transactions', adminProtect, adminController.getAllTransactions);

// আনব্লক করার রাউট
router.put('/messes/:messId/unblock', adminProtect, adminController.unblockMess);
module.exports = router;