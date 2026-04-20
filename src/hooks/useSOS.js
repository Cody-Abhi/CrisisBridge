import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, set, remove } from 'firebase/database';
import { rtdb } from '../firebase/config';

/**
 * useSOS hook for managing emergency signals in the hotel.
 * Listens to "sos/{hotelCode}" in RTDB.
 */
export function useSOS(hotelCode, designation) {
  const [allSOS, setAllSOS] = useState([]);
  const [activeSOS, setActiveSOS] = useState(null);
  const seenIds = useRef(new Set());
  const [loading, setLoading] = useState(true);

  const matchesDesignation = useCallback((sosType, userDesignation) => {
    if (!userDesignation || userDesignation === 'General') return true;
    const type = (sosType || '').toLowerCase();
    const desig = (userDesignation || '').toLowerCase();
    
    if (desig.includes('fire') && type.includes('fire')) return true;
    if (desig.includes('medical') && type.includes('medical')) return true;
    if (desig.includes('security') && type.includes('security')) return true;
    
    // Fallback or catch-all for general staff
    if (desig === 'general') return true;
    return false;
  }, []);

  useEffect(() => {
    if (!hotelCode) return;

    const sosRef = ref(rtdb, `sos/${hotelCode}`);
    const unsub = onValue(
      sosRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          setAllSOS([]);
          setLoading(false);
          return;
        }
        
        const sosList = Object.entries(val).map(([id, data]) => ({
          id,
          ...data,
        }));
        
        setAllSOS(sosList);
        setLoading(false);

        // Find new SOS matching designation that we haven't seen/dismissed
        const matching = sosList.find(
          (s) =>
            s.status === 'active' &&
            !s.declined &&
            !s.escalated &&
            !seenIds.current.has(s.id) &&
            matchesDesignation(s.type, designation)
        );

        if (matching && !activeSOS) {
          setActiveSOS(matching);
        }
      },
      (err) => {
        console.error('SOS listener error:', err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [hotelCode, designation, activeSOS, matchesDesignation]);

  const acceptSOS = useCallback(
    async (sosId, uid) => {
      if (!sosId || !hotelCode) return;
      const sosItemRef = ref(rtdb, `sos/${hotelCode}/${sosId}`);
      const existing = allSOS.find((s) => s.id === sosId);
      
      await set(sosItemRef, {
        ...existing,
        status: 'accepted',
        acceptedBy: uid,
        acceptedAt: Date.now()
      });
      
      seenIds.current.add(sosId);
      setActiveSOS(null);
    },
    [hotelCode, allSOS]
  );

  const declineSOS = useCallback(
    async (sosId) => {
      if (!sosId || !hotelCode) return;
      const sosItemRef = ref(rtdb, `sos/${hotelCode}/${sosId}`);
      const existing = allSOS.find((s) => s.id === sosId);
      
      if (existing) {
        await set(sosItemRef, { ...existing, declined: true });
      }
      
      seenIds.current.add(sosId);
      setActiveSOS(null);
    },
    [hotelCode, allSOS]
  );

  const escalateSOS = useCallback(
    async (sosId) => {
      if (!sosId || !hotelCode) return;
      const sosItemRef = ref(rtdb, `sos/${hotelCode}/${sosId}`);
      const existing = allSOS.find((s) => s.id === sosId);
      
      if (existing) {
        await set(sosItemRef, { ...existing, escalated: true });
      }
      
      seenIds.current.add(sosId);
      setActiveSOS(null);
    },
    [hotelCode, allSOS]
  );

  const dismissSOS = useCallback(() => {
    if (activeSOS) {
      seenIds.current.add(activeSOS.id);
    }
    setActiveSOS(null);
  }, [activeSOS]);

  const deleteSOS = useCallback(
    async (roomNumber) => {
      if (!hotelCode) return;
      const match = allSOS.find((s) => s.roomNumber === roomNumber);
      if (match) {
        await remove(ref(rtdb, `sos/${hotelCode}/${match.id}`));
      }
    },
    [hotelCode, allSOS]
  );

  return {
    allSOS,
    activeSOS,
    loading,
    acceptSOS,
    declineSOS,
    escalateSOS,
    dismissSOS,
    deleteSOS,
    activeSOSCount: allSOS.filter((s) => s.status === 'active' && !s.declined && !s.escalated).length,
  };
}
