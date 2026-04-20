import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, remove, onDisconnect, serverTimestamp } from 'firebase/database';
import { rtdb } from '../firebase/config';

/**
 * usePresence hook for managing staff online/on-duty status.
 * Listens to "staff_presence/{hotelCode}" in RTDB.
 */
export function usePresence(hotelCode, uid, profile) {
  const [onlineStaff, setOnlineStaff] = useState([]);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const presenceRef = useRef(null);

  // Listen to all staff presence
  useEffect(() => {
    if (!hotelCode) return;

    const presRef = ref(rtdb, `staff_presence/${hotelCode}`);
    const unsub = onValue(presRef, (snapshot) => {
      const val = snapshot.val();
      if (!val) {
        setOnlineStaff([]);
        return;
      }
      const staff = Object.entries(val).map(([id, data]) => ({
        uid: id,
        ...data,
      }));
      setOnlineStaff(staff);
    }, (err) => {
      console.error('Presence listener error:', err);
    });

    return () => unsub();
  }, [hotelCode]);

  // Toggle on-duty
  const toggleOnDuty = useCallback(async (onDuty) => {
    if (!hotelCode || !uid || !profile) {
      console.warn('Cannot toggle on-duty: missing parameters', { hotelCode, uid, profile });
      return;
    }

    const myRef = ref(rtdb, `staff_presence/${hotelCode}/${uid}`);
    presenceRef.current = myRef;

    try {
      if (onDuty) {
        await set(myRef, {
          name: profile.name || profile.displayName || 'Unknown Staff',
          designation: profile.designation || 'Staff',
          onDuty: true,
          lastSeen: serverTimestamp(),
        });
        // Auto-remove on disconnect
        onDisconnect(myRef).remove();
        setIsOnDuty(true);
      } else {
        await remove(myRef);
        setIsOnDuty(false);
      }
    } catch (err) {
      console.error('Toggle on-duty error:', err);
    }
  }, [hotelCode, uid, profile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (presenceRef.current) {
        remove(presenceRef.current).catch(() => {});
      }
    };
  }, []);

  return {
    onlineStaff,
    isOnDuty,
    toggleOnDuty,
    onDutyCount: onlineStaff.filter(s => s.onDuty).length,
  };
}
