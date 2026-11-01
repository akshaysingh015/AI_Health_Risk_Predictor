const admin = require('firebase-admin');
// You will eventually import your Mongoose models here
// const Appointment = require('../models/Appointment');
// const User = require('../models/User');

exports.bookAppointment = async (req, res) => {
  try {
    if (!admin.apps.length) {
      return res.status(503).json({ error: "Notifications are not configured on this server." });
    }

    // 1. Grab the data sent from the React frontend
    const { date, time } = req.body;

    if (!date || !time) {
      return res.status(400).json({ error: "Appointment date and time are required." });
    }

    const user = await require('../models/User').findById(req.user.id);
    if (!user?.fcmToken) {
      return res.status(503).json({ error: "Notifications are not enabled for this account." });
    }

    // Send the Firebase notification to the authenticated user's registered device.
    if (user.fcmToken) {
      const message = {
        notification: {
          title: "🗓️ Appointment Confirmed!",
          body: `Your appointment is scheduled for ${date} at ${time}.`
        },
        token: user.fcmToken
      };

      await admin.messaging().send(message);
      console.log("✅ Notification successfully sent from controller!");
    }

    res.status(200).json({ 
        success: true, 
        message: "Appointment booked and notification sent!" 
    });

  } catch (error) {
    console.error("❌ Error in bookAppointment:", error);
    res.status(500).json({ error: "Failed to book appointment or send notification" });
  }
};