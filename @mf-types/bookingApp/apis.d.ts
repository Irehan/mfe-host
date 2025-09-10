
    export type RemoteKeys = 'bookingApp/BookingList' | 'bookingApp/BookingForm';
    type PackageType<T> = T extends 'bookingApp/BookingForm' ? typeof import('bookingApp/BookingForm') :T extends 'bookingApp/BookingList' ? typeof import('bookingApp/BookingList') :any;