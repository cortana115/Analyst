import { useEffect, useRef, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { type Domain } from '@shared/schema';

interface WebSocketMessage {
  type: 'join' | 'leave' | 'typing' | 'user_joined' | 'user_left';
  userId: string;
  threadId?: string;
  domain?: Domain;
  isTyping?: boolean;
  timestamp?: number;
}

export function useWebSocket(threadId: string, domain: Domain) {
  const socket = useRef<WebSocket | null>(null);
  const userId = useRef(nanoid());

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    socket.current = new WebSocket(wsUrl);

    socket.current.onopen = () => {
      if (socket.current?.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({
          type: 'join',
          userId: userId.current,
          threadId,
          domain
        }));
      }
    };

    socket.current.onclose = () => {
      // Attempt to reconnect after a delay
      setTimeout(connect, 3000);
    };
  }, [threadId, domain]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({
        ...message,
        userId: userId.current
      }));
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (socket.current?.readyState === WebSocket.OPEN) {
        socket.current.send(JSON.stringify({
          type: 'leave',
          userId: userId.current,
          threadId
        }));
        socket.current.close();
      }
    };
  }, [connect, threadId]);

  return {
    sendMessage,
    userId: userId.current
  };
}
