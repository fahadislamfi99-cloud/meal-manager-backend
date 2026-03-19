const { protect } = require('../middleware/authMiddleware');
const express = require('express');
const { setManager, getManager } = require('../controllers/managerController');
const router = express.Router();

router.route('/').post(protect, setManager).get(protect, getManager);

module.exports = router;