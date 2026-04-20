import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { rtdb } from '../firebase/config';

/**
 * useRooms hook for managing room statuses in real-time.
 * Listens to "rooms/{hotelCode}" in RTDB.
 */
export function useRooms(hotelCode) {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!hotelCode) {
      setRooms([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const roomsRef = ref(rtdb, `rooms/${hotelCode}`);
    const unsub = onValue(
      roomsRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          setRooms([]);
          setLoading(false);
          return;
        }
        
        const roomList = Object.entries(val).map(([id, data]) => ({
          id,
          roomNumber: data.roomNumber || id,
          floor: data.floor || Math.ceil(parseInt(id) / 10) || 1,
          status: data.status || 'neutral',
          assignedStaff: data.assignedStaff || null,
          sosType: data.sosType || null,
          guestName: data.guestName || null,
        }));

        // Sort: SOS first, then active, maintenance, neutral, resolved
        const statusOrder = { sos: 0, active: 1, maintenance: 2, neutral: 3, resolved: 4 };
        roomList.sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5));
        
        setRooms(roomList);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Rooms listener error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [hotelCode]);

  const statusCounts = rooms.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    },
    { sos: 0, active: 0, maintenance: 0, neutral: 0, resolved: 0 }
  );

  return { rooms, loading, error, statusCounts };
}
