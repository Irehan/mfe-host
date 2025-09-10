import React from 'react';
import './Booking.css';
interface BookingListProps {
    user?: {
        id: string;
        username: string;
        role: string;
    };
}
declare const BookingList: React.FC<BookingListProps>;
export default BookingList;
