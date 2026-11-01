import { useState } from 'react';
import API from '../services/api';

const BookAppointmentButton = () => {
  const [status, setStatus] = useState('');

  const handleBooking = async () => {
    setStatus('Sending request to backend...');
    
    try {
      await API.post('/appointments/book', { date: 'Tomorrow', time: '10:00 AM' });
      setStatus('Appointment notification sent successfully.');
    } catch (error) {
      setStatus(error.response?.data?.error || 'Could not send the appointment notification.');
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