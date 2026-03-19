const { protect } = require('../middleware/authMiddleware');
const express = require('express');
const { addDeposit, getDepositsByMonth, deleteDeposit } = require('../controllers/depositController');
const router = express.Router();

router.route('/').post(protect, addDeposit).get(protect, getDepositsByMonth);
router.route('/:id').delete(protect, deleteDeposit);

module.exports = router;