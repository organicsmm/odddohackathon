import { useEffect, useState } from 'react';
import { loadTrips } from '@/lib/store';
import type { Trip } from '@/lib/types';

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>(loadTrips());
  useEffect(() => {
    const h = () => setTrips(loadTrips());
    window.addEventListener('traveloop:trips-changed', h);
    window.addEventListener('storage', h);
    return () => {
      window.removeEventListener('traveloop:trips-changed', h);
      window.removeEventListener('storage', h);
    };
  }, []);
  return trips;
}
