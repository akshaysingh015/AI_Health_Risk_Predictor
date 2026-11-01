const express = require('express');
const router = express.Router();

// 1. Import the controller you just made!
const appointmentController = require('../controllers/appointmentController');

// 2. Create the POST route that your React frontend will call
// This means when React sends data to '/book', it runs your notification code!
router.post('/book', appointmentController.bookAppointment);

module.exports = router;