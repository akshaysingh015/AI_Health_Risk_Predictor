import { useState } from 'react';

const BookAppointmentButton = () => {
  const [status, setStatus] = useState('');

  const handleBooking = async () => {
    setStatus('Sending request to backend...');
    
    try {
      // Make sure 3000 matches your Node.js backend port!
      const response = await fetch('http://localhost:3000/api/appointments/book', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: "12345", 
          date: "Tomorrow",
          time: "10:00 AM"
        })
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('✅ Success! The backend just fired the notification.');
        console.log("Backend says:", data);
      } else {
        setStatus('❌ Backend received it, but something went wrong.');
        console.error("Backend error:", data);
      }
    } catch (error) {
      setStatus('❌ Network Error: Could not reach the backend.');
      console.error(error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 mt-10 border-2 border-dashed border-blue-300 rounded-xl bg-blue-50">
      <h3 className="mb-4 text-xl font-semibold text-blue-900">Push Notification Test</h3>
      <button 
        onClick={handleBooking}
        className="px-6 py-3 font-bold text-white transition-all bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95"
      >
        Book Appointment 📅
      </button>
      {status && <p className="mt-4 font-medium text-gray-700">{status}</p>}
    </div>
  );
};

export default BookAppointmentButton;