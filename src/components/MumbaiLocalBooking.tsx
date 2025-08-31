import React, { useState, useEffect, useRef } from 'react';
import { useLoadScript, Autocomplete } from '@react-google-maps/api';
import { useAdmin } from '../contexts/AdminContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface LocalBooking {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  pickup: string;
  dropoff: string;
  serviceType: 'airport-pickup' | 'airport-drop' | 'local-ride';
  date: string;
  time: string;
}

const libraries: ("places")[] = ["places"];

const MumbaiLocalBooking: React.FC = () => {
  const [booking, setBooking] = useState<LocalBooking>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    pickup: '',
    dropoff: '',
    serviceType: 'airport-pickup',
    date: '',
    time: ''
  });

  const { pricing } = useAdmin();
  const [distance, setDistance] = useState(0);
  const [price, setPrice] = useState(0);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries,
  });

  const pickupRef = useRef<any>(null);
  const dropoffRef = useRef<any>(null);

  useEffect(() => {
    if (booking.pickup && booking.dropoff && booking.pickup !== booking.dropoff && window.google) {
      const service = new window.google.maps.DistanceMatrixService();

      service.getDistanceMatrix(
        {
          origins: [booking.pickup],
          destinations: [booking.dropoff],
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (response: any, status: any) => {
          if (status === "OK") {
            const distanceValue = response.rows[0].elements[0].distance.value;
            const km = distanceValue / 1000;
            setDistance(Math.round(km));

            let baseRate = pricing.mumbaiLocal.baseRate;
            if (booking.serviceType === 'airport-pickup' || booking.serviceType === 'airport-drop') {
              baseRate = pricing.mumbaiLocal.airportRate;
            }

            setPrice(Math.round(km * baseRate));
          } else {
            console.error("Error with DistanceMatrix:", status);
            setDistance(0);
            setPrice(0);
          }
        }
      );
    }
  }, [booking.pickup, booking.dropoff, booking.serviceType, pricing]);

  if (!isLoaded) return <p>Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Mumbai Local Booking</h2>

      {/* Customer Info */}
      <input
        type="text"
        placeholder="Name"
        value={booking.customerName}
        onChange={(e) => setBooking({ ...booking, customerName: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      <input
        type="text"
        placeholder="Phone"
        value={booking.customerPhone}
        onChange={(e) => setBooking({ ...booking, customerPhone: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      <input
        type="email"
        placeholder="Email"
        value={booking.customerEmail}
        onChange={(e) => setBooking({ ...booking, customerEmail: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      {/* Pickup Autocomplete */}
      <Autocomplete
        onLoad={(ref) => (pickupRef.current = ref)}
        onPlaceChanged={() => {
          const place = pickupRef.current.getPlace();
          setBooking({ ...booking, pickup: place.formatted_address || place.name });
        }}
      >
        <input
          type="text"
          placeholder="Pickup Location"
          className="w-full border p-2 mb-2"
        />
      </Autocomplete>

      {/* Dropoff Autocomplete */}
      <Autocomplete
        onLoad={(ref) => (dropoffRef.current = ref)}
        onPlaceChanged={() => {
          const place = dropoffRef.current.getPlace();
          setBooking({ ...booking, dropoff: place.formatted_address || place.name });
        }}
      >
        <input
          type="text"
          placeholder="Dropoff Location"
          className="w-full border p-2 mb-2"
        />
      </Autocomplete>

      {/* Date & Time */}
      <input
        type="date"
        value={booking.date}
        onChange={(e) => setBooking({ ...booking, date: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      <input
        type="time"
        value={booking.time}
        onChange={(e) => setBooking({ ...booking, time: e.target.value })}
        className="w-full border p-2 mb-2"
      />

      {/* Distance & Price */}
      <p>Distance: {distance} km</p>
      <p>Estimated Price: ₹{price}</p>
    </div>
  );
};

export default MumbaiLocalBooking;
