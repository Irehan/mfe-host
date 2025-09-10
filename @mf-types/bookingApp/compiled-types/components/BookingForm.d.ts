import React from 'react';
import './Booking.css';
interface BookingFormData {
    facilityName: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    attendees: number;
    purpose: string;
    contactEmail: string;
    specialRequirements: string;
}
interface BookingFormProps {
    user?: {
        id: string;
        username: string;
        email?: string;
        role: string;
    };
    onBookingSubmit?: (bookingData: BookingFormData) => void;
}
declare const BookingForm: React.FC<BookingFormProps>;
export default BookingForm;
