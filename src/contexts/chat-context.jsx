import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import { getAuth, getAuthChangedEventName } from '@/lib/auth';

const ChatContext = createContext(null);

function convIdOf(message) {
  return message?.conversationId ?? message?.conversation_id;
}

function senderIdOf(message) {
  return message?.senderId ?? message?.sender_id ?? message?.sender?.id;
}

function sortConversations(list) {
  return [...list].sort((a, b) => {
    const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
    const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
    return bTime - aTime;
  });
}

function upsertConversation(list, conversation) {
  if (!conversation?.id) return list;
  const exists = list.some((item) => String(item.id) === String(conversation.id));
  const next = exists
    ? list.map((item) => (String(item.id) === String(conversation.id) ? { ...item, ...conversation } : item))
    : [conversation, ...list];
  return sortConversations(next);
}

function replaceOrAppendMessage(list, message) {
  if (!message?.id) return list;
  if (message.tempId && list.some((item) => item.tempId === message.tempId)) {
    return list.map((item) => (item.tempId === message.tempId ? message : item));
  }
  if (list.some((item) => String(item.id) === String(message.id))) return list;
  return [...list, message];
}

export function ChatProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convError, setConvError] = useState(null);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messagesByConv, setMessagesByConv] = useState({});
  const [msgLoading, setMsgLoading] = useState(false);
  const [msgError, setMsgError] = useState(null);
  const [hasMoreByConv, setHasMoreByConv] = useState({});
  const [typingByConv, setTypingByConv] = useState({});
  const [onlineUsers, setOnlineUsers] = useState({});

  const socketRef = useRef(null);
  const typingTimers = useRef({});
  const activeConvIdRef = useRef(null);

  useEffect(() => {
    activeConvIdRef.current = activeConvId;
  }, [activeConvId]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setSocket(null);
    setConnected(false);
  }, []);

  const connect = useCallback(() => {
    const auth = getAuth();
    if (!auth?.accessToken || socketRef.current?.connected) return;

    const nextSocket = io(window.location.origin, {
      auth: { token: auth.accessToken },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1200,
    });

    nextSocket.on('connect', () => setConnected(true));
    nextSocket.on('disconnect', () => setConnected(false));
    nextSocket.on('connect_error', () => setConnected(false));

    nextSocket.on('conversation:new', (conversation) => {
      setConversations((prev) => upsertConversation(prev, conversation));
      if (conversation?.id) nextSocket.emit('conversation:join', { conversationId: conversation.id });
    });

    nextSocket.on('message:new', (message) => {
      const conversationId = convIdOf(message);
      if (!conversationId) return;

      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: replaceOrAppendMessage(prev[conversationId] || [], message),
      }));

      setConversations((prev) => sortConversations(prev.map((conversation) => {
        if (String(conversation.id) !== String(conversationId)) return conversation;
        const isOwn = String(senderIdOf(message)) === String(getAuth()?.user?.id);
        return {
          ...conversation,
          lastMessagePreview: message.content || (message.type !== 'text' ? `[${message.type}]` : ''),
          lastMessageAt: message.createdAt || message.created_at,
          unreadCount: isOwn || String(activeConvIdRef.current) === String(conversationId)
            ? conversation.unreadCount || 0
            : (conversation.unreadCount || 0) + 1,
        };
      })));
    });

    nextSocket.on('typing:start', ({ userId, conversationId }) => {
      setTypingByConv((prev) => ({ ...prev, [conversationId]: { userId, typing: true } }));
    });

    nextSocket.on('typing:stop', ({ conversationId }) => {
      setTypingByConv((prev) => {
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    });

    nextSocket.on('user:online', ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: true }));
    });

    nextSocket.on('user:offline', ({ userId }) => {
      setOnlineUsers((prev) => ({ ...prev, [userId]: false }));
    });

    nextSocket.on('message:read', ({ messageId, userId, readAt }) => {
      setMessagesByConv((prev) => {
        const next = {};
        Object.entries(prev).forEach(([conversationId, list]) => {
          next[conversationId] = list.map((message) => {
            if (String(message.id) !== String(messageId)) return message;
            const receipts = message.readReceipts || [];
            if (receipts.some((receipt) => String(receipt.userId) === String(userId))) return message;
            return { ...message, readReceipts: [...receipts, { userId, readAt }] };
          });
        });
        return next;
      });
    });

    nextSocket.on('message:reactions', ({ messageId, reactions }) => {
      setMessagesByConv((prev) => {
        const next = {};
        Object.entries(prev).forEach(([conversationId, list]) => {
          next[conversationId] = list.map((message) =>
            String(message.id) === String(messageId) ? { ...message, reactions } : message
          );
        });
        return next;
      });
    });

    socketRef.current = nextSocket;
    setSocket(nextSocket);
  }, []);

  useEffect(() => {
    if (getAuth()?.accessToken) connect();
    const syncAuth = () => {
      if (getAuth()?.accessToken) connect();
      else {
        disconnect();
        setConversations([]);
        setMessagesByConv({});
        setActiveConvId(null);
      }
    };
    window.addEventListener(getAuthChangedEventName(), syncAuth);
    window.addEventListener('storage', syncAuth);
    return () => {
      window.removeEventListener(getAuthChangedEventName(), syncAuth);
      window.removeEventListener('storage', syncAuth);
      disconnect();
    };
  }, [connect, disconnect]);

  const loadConversations = useCallback(async () => {
    const auth = getAuth();
    if (!auth?.accessToken) return [];
    setConvLoading(true);
    setConvError(null);
    try {
      const response = await fetch('/api/chat/conversations', {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Could not load conversations.');
      const data = sortConversations(json.data || []);
      setConversations(data);
      data.forEach((conversation) => {
        socketRef.current?.emit('conversation:join', { conversationId: conversation.id });
      });
      return data;
    } catch (error) {
      setConvError(error.message);
      return [];
    } finally {
      setConvLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, before = null) => {
    const auth = getAuth();
    if (!auth?.accessToken || !conversationId) return [];
    setMsgLoading(true);
    setMsgError(null);
    try {
      const query = before ? `?before=${before}` : '';
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages${query}`, {
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Could not load messages.');
      const data = json.data || [];
      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: before ? [...data, ...(prev[conversationId] || [])] : data,
      }));
      setHasMoreByConv((prev) => ({ ...prev, [conversationId]: Boolean(json.hasMore) }));
      setConversations((prev) =>
        prev.map((conversation) =>
          String(conversation.id) === String(conversationId)
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      );
      return data;
    } catch (error) {
      setMsgError(error.message);
      return [];
    } finally {
      setMsgLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async ({ conversationId, content, type = 'text', replyToId }) => {
    const auth = getAuth();
    if (!auth?.accessToken || !conversationId || (type === 'text' && !content?.trim())) return null;

    const tempId = `temp_${Date.now()}`;
    const optimistic = {
      id: tempId,
      tempId,
      conversationId,
      senderId: auth.user.id,
      sender: {
        id: auth.user.id,
        firstName: auth.user.first_name || auth.user.firstName,
        first_name: auth.user.first_name || auth.user.firstName,
        lastName: auth.user.last_name || auth.user.lastName,
        last_name: auth.user.last_name || auth.user.lastName,
        role: auth.user.role,
      },
      content,
      type,
      replyToId: replyToId || null,
      reactions: {},
      readReceipts: [],
      createdAt: new Date().toISOString(),
      _optimistic: true,
    };

    setMessagesByConv((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), optimistic],
    }));

    const removeOptimistic = () => {
      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).filter((message) => message.tempId !== tempId),
      }));
    };

    if (socketRef.current?.connected) {
      socketRef.current.emit(
        'message:send',
        { conversationId, content, type, replyToId, tempId },
        (ack) => {
          if (ack?.error) removeOptimistic();
        }
      );
      return optimistic;
    }

    try {
      const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, type, replyToId }),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.message || 'Message could not be sent.');

      setMessagesByConv((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] || []).map((message) =>
          message.tempId === tempId ? json.data : message
        ),
      }));
      setConversations((prev) => sortConversations(prev.map((conversation) => (
        String(conversation.id) === String(conversationId)
          ? {
              ...conversation,
              lastMessagePreview: json.data?.content || (json.data?.type !== 'text' ? `[${json.data?.type}]` : ''),
              lastMessageAt: json.data?.createdAt || json.data?.created_at,
              unreadCount: 0,
            }
          : conversation
      ))));
      return json.data;
    } catch (error) {
      removeOptimistic();
      throw error;
    }
  }, []);

  const sendTyping = useCallback((conversationId) => {
    if (!socketRef.current?.connected || !conversationId) return;
    socketRef.current.emit('typing:start', { conversationId });
    if (typingTimers.current[conversationId]) clearTimeout(typingTimers.current[conversationId]);
    typingTimers.current[conversationId] = setTimeout(() => {
      socketRef.current?.emit('typing:stop', { conversationId });
    }, 1600);
  }, []);

  const markRead = useCallback(async (conversationId, messageId) => {
    if (!conversationId) return;
    if (socketRef.current?.connected && messageId) {
      socketRef.current.emit('message:read', { conversationId, messageId });
    }
    const auth = getAuth();
    if (auth?.accessToken) {
      fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${auth.accessToken}` },
      }).catch(() => {});
    }
    setConversations((prev) =>
      prev.map((conversation) =>
        String(conversation.id) === String(conversationId)
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    );
  }, []);

  const createConversation = useCallback(async ({ type, targetUserId, participantIds, name }) => {
    const auth = getAuth();
    if (!auth?.accessToken) return null;
    const response = await fetch('/api/chat/conversations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${auth.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, targetUserId, participantIds, name }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.message || 'Conversation could not be created.');
    setConversations((prev) => upsertConversation(prev, json.data));
    socketRef.current?.emit('conversation:join', { conversationId: json.data.id });
    return json.data;
  }, []);

  const searchUsers = useCallback(async (query) => {
    const auth = getAuth();
    if (!auth?.accessToken || !query?.trim()) return [];
    const response = await fetch(`/api/chat/users/search?q=${encodeURIComponent(query.trim())}`, {
      headers: { Authorization: `Bearer ${auth.accessToken}` },
    });
    const json = await response.json();
    return response.ok ? json.data || [] : [];
  }, []);

  const value = useMemo(() => ({
    socket,
    connected,
    conversations,
    convLoading,
    convError,
    activeConvId,
    setActiveConvId,
    messagesByConv,
    msgLoading,
    msgError,
    hasMoreByConv,
    typingByConv,
    onlineUsers,
    loadConversations,
    loadMessages,
    sendMessage,
    sendTyping,
    markRead,
    createConversation,
    searchUsers,
    connect,
    disconnect,
  }), [
    socket,
    connected,
    conversations,
    convLoading,
    convError,
    activeConvId,
    messagesByConv,
    msgLoading,
    msgError,
    hasMoreByConv,
    typingByConv,
    onlineUsers,
    loadConversations,
    loadMessages,
    sendMessage,
    sendTyping,
    markRead,
    createConversation,
    searchUsers,
    connect,
    disconnect,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
}
