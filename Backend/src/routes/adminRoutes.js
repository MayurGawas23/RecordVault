const express = require('express');
const router = express.Router();
const authenticateJWT = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleGuard');
const adminController = require('../controllers/adminController');

router.use(authenticateJWT);
router.use(requireRole('ADMIN'));

router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.get('/users/:userId/records', adminController.getUserRecords);
router.get('/records', adminController.getAllRecords);

module.exports = router;
