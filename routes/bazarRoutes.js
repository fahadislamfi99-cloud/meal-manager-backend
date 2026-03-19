const { protect } = require('../middleware/authMiddleware');
const express = require('express');
const { addBazar, getBazarsByMonth, updateBazar, deleteBazar } = require('../controllers/bazarController');
const router = express.Router();

router.route('/').post(protect, addBazar).get(protect, getBazarsByMonth);
router.route('/:id').put(protect, updateBazar).delete(protect, deleteBazar);

module.exports = router;