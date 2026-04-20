import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, onValue, push, query, limitToLast } from 'firebase/database';
import { rtdb } from '../firebase/config';

/**
 * useChat hook for Realtime Database chat channels.
 * Listens to messages at channelPath.
 */
export function useChat(channelPath, messageLimit = 100) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const unsubRef = useRef(null);

  useEffect(() => {
    if (!channelPath) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const chatRef = query(ref(rtdb, channelPath), limitToLast(messageLimit));
    const unsub = onValue(
      chatRef,
      (snapshot) => {
        const val = snapshot.val();
        if (!val) {
          setMessages([]);
          setLoading(false);
          return;
        }
        const msgs = Object.entries(val).map(([id, data]) => ({
          id,
          ...data,
        }));
        // Sort by timestamp (RTDB keys are chronological but it's safer to sort)
        msgs.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error('Chat listener error:', err);
        setLoading(false);
      }
    );
    unsubRef.current = unsub;
    return () => unsub();
  }, [channelPath, messageLimit]);

  const sendMessage = useCallback(
    async (text, sender) => {
      if (!channelPath || !text.trim()) return;
      
      const chatRef = ref(rtdb, channelPath);
      try {
        await push(chatRef, {
          senderId: sender.uid,
          senderName: sender.name || sender.displayName || 'Staff',
          role: sender.role || 'staff',
          designation: sender.designation || '',
          text: text.trim(),
          timestamp: Date.now(),
        });
      } catch (err) {
        console.error('Send message error:', err);
      }
    },
    [channelPath]
  );

  const cleanup = useCallback(() => {
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }
  }, []);

  return { 
    messages, 
    loading, 
    sendMessage, 
    cleanup, 
    messageCount: messages.length 
  };
}
