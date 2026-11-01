const admin = require('firebase-admin');
// You will eventually import your Mongoose models here
// const Appointment = require('../models/Appointment');
// const User = require('../models/User');

exports.bookAppointment = async (req, res) => {
  try {
    // 1. Grab the data sent from the React frontend
    const { patientId, date, time } = req.body;

    // 2. (Future Step) Save the appointment to MongoDB here
    // const newAppointment = await Appointment.create({ ... });

    // 3. (Future Step) Find the patient in the DB to get their specific FCM Token
    // const patient = await User.findById(patientId);
    
    // --- TEMPORARY MOCK TOKEN FOR TESTING ---
    const mockUserToken = "eZDHSg7Mz0hf_PGovtZ0It:APA91bGnYX3drgsA29KlQb64xavREKld2Vprc2NzAYweaoUsTVppWAaSBhcgrbjyCLFiS9WNrSiUmiJkBp0-8wJpGvvnQBMxlpWShFJxUC8OAYsDS5xuOsc"; 

    // 4. Send the Firebase Notification
    if (mockUserToken) {
      const message = {
        notification: {
          title: "🗓️ Appointment Confirmed!",
          body: `Your appointment is scheduled for ${date} at ${time}.`
        },
        token: mockUserToken
      };

      await admin.messaging().send(message);
      console.log("✅ Notification successfully sent from controller!");
    }

    // 5. Send success response back to React
    res.status(200).json({ 
        success: true, 
        message: "Appointment booked and notification sent!" 
    });

  } catch (error) {
    console.error("❌ Error in bookAppointment:", error);
    res.status(500).json({ error: "Failed to book appointment or send notification" });
  }
};