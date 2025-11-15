import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

const getSocketUrl = () => {
  const envUrl = (import.meta as { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE as string | undefined;
  if (envUrl && envUrl.trim()) return envUrl;
  // Fallback: derive backend from current origin (swap 5173 -> 3000)
  try {
    const origin = window.location.origin;
    if (origin.includes(':5173')) return origin.replace(':5173', ':3000');
    return origin;
  } catch {
    return 'http://localhost:3000';
  }
};

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const { user } = useAuth();
  interface UserWithId {
    id?: string;
    _id?: string;
  }
  const getUserId = () => (user as UserWithId)?.id || (user as UserWithId)?._id || null;
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const url = getSocketUrl();
    const debug = (import.meta as { env?: { VITE_DEBUG_SOCKET?: string } }).env?.VITE_DEBUG_SOCKET === '1';
    socketRef.current = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io',
    });

    // Identify after connect to ensure delivery
    const handleConnect = () => {
      const uid = getUserId();
      if (uid) socketRef.current?.emit('identify', { userId: String(uid) });
    };
    let identified = false;
    const handleIdentified = (_payload: unknown) => {
      identified = true;
    };
    const handleConnectError = (err: { message?: string } | string) => {
      if (debug) {
        // eslint-disable-next-line no-console
        console.warn('[socket] connect_error', err?.message || err);
      }
    };
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('identified', handleIdentified);
    socketRef.current.on('connect_error', handleConnectError);
    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    // Also attempt immediate identify (in case already connected)
    const uidNow = getUserId();
    if (socketRef.current.connected && uidNow) {
      socketRef.current.emit('identify', { userId: String(uidNow) });
    }
    // Fallback: re-emit identify after 1000ms if not yet identified
    const timer = setTimeout(() => {
      const uid2 = getUserId();
      if (!identified && uid2) {
        socketRef.current?.emit('identify', { userId: String(uid2) });
      }
    }, 1000);

    return () => {
      socketRef.current?.off('connect', handleConnect);
      socketRef.current?.off('identified', handleIdentified);
      socketRef.current?.off('connect_error', handleConnectError);
      socketRef.current?.off('connect', () => setIsConnected(true));
      socketRef.current?.off('disconnect', () => setIsConnected(false));
      clearTimeout(timer);
      socketRef.current?.disconnect();
    };
  }, [ (user as UserWithId)?.id, (user as UserWithId)?._id ]);

  const joinClassroom = (classroomId: string) => {
    socketRef.current?.emit('joinClassroom', { classroomId });
  };

  const joinLesson = (lessonId: string) => {
    socketRef.current?.emit('joinLesson', { lessonId });
  };

  const sendMessage = (classroomId: string, message: string, user: { id: string; name: string }) => {
    socketRef.current?.emit('classMessage', { classroomId, message, user });
  };

  const sendLessonMessage = (lessonId: string, message: string, user: { id: string; name: string }) => {
    socketRef.current?.emit('lessonMessage', { lessonId, message, user });
  };

  const onJoinedClassroom = (callback: (data: { classroomId: string }) => void) => {
    socketRef.current?.on('joinedClassroom', callback);
  };

  const onClassMessage = (callback: (data: { classroomId: string; message: string; user: { id: string; name: string }; timestamp: string }) => void) => {
    socketRef.current?.on('classMessage', callback);
  };

  const onLessonMessage = (callback: (data: { lessonId: string; message: string; user: { id: string; name: string }; timestamp: string }) => void) => {
    socketRef.current?.on('lessonMessage', callback);
  };

  const offJoinedClassroom = (callback: (data: { classroomId: string }) => void) => {
    socketRef.current?.off('joinedClassroom', callback);
  };

  const offClassMessage = (callback: (data: { classroomId: string; message: string; user: { id: string; name: string }; timestamp: string }) => void) => {
    socketRef.current?.off('classMessage', callback);
  };

  const offLessonMessage = (callback: (data: { lessonId: string; message: string; user: { id: string; name: string }; timestamp: string }) => void) => {
    socketRef.current?.off('lessonMessage', callback);
  };

  // Course events
  const joinCourse = (courseId: string) => {
    socketRef.current?.emit('joinCourse', { courseId });
  };

  const leaveCourse = (courseId: string) => {
    socketRef.current?.emit('leaveCourse', { courseId });
  };

  const onJoinedCourse = (callback: (data: { courseId: string }) => void) => {
    socketRef.current?.on('joinedCourse', callback);
  };

  const onLeftCourse = (callback: (data: { courseId: string }) => void) => {
    socketRef.current?.on('leftCourse', callback);
  };

  const onEnrollmentAdded = (callback: (data: { courseId: string; enrollment: EnrollmentData; timestamp: string }) => void) => {
    socketRef.current?.on('enrollmentAdded', callback);
  };

  const onEnrollmentRemoved = (callback: (data: { courseId: string; studentId: string; timestamp: string }) => void) => {
    socketRef.current?.on('enrollmentRemoved', callback);
  };

  const offJoinedCourse = (callback: (data: { courseId: string }) => void) => {
    socketRef.current?.off('joinedCourse', callback);
  };

  const offLeftCourse = (callback: (data: { courseId: string }) => void) => {
    socketRef.current?.off('leftCourse', callback);
  };

  const offEnrollmentAdded = (callback: (data: { courseId: string; enrollment: EnrollmentData; timestamp: string }) => void) => {
    socketRef.current?.off('enrollmentAdded', callback);
  };

  const offEnrollmentRemoved = (callback: (data: { courseId: string; studentId: string; timestamp: string }) => void) => {
    socketRef.current?.off('enrollmentRemoved', callback);
  };

  // Classroom student events
  interface StudentData {
    name?: string;
    [key: string]: unknown;
  }
  const onClassroomStudentAdded = (callback: (data: { classroomId: string; student: StudentData; timestamp: string }) => void) => {
    socketRef.current?.on('classroomStudentAdded', callback);
  };

  const onClassroomStudentRemoved = (callback: (data: { classroomId: string; studentId: string; timestamp: string }) => void) => {
    socketRef.current?.on('classroomStudentRemoved', callback);
  };

  const offClassroomStudentAdded = (callback: (data: { classroomId: string; student: StudentData; timestamp: string }) => void) => {
    socketRef.current?.off('classroomStudentAdded', callback);
  };

  const offClassroomStudentRemoved = (callback: (data: { classroomId: string; studentId: string; timestamp: string }) => void) => {
    socketRef.current?.off('classroomStudentRemoved', callback);
  };

  // Generic helpers so listeners can be attached regardless of connection timing
  const on = (event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.on(event, handler);
  };
  const off = (event: string, handler: (...args: unknown[]) => void) => {
    socketRef.current?.off(event, handler);
  };
  const onAny = (handler: (event: string, ...args: unknown[]) => void) => {
    (socketRef.current as { onAny?: (handler: (event: string, ...args: unknown[]) => void) => void })?.onAny?.(handler);
  };
  const offAny = (handler: (event: string, ...args: unknown[]) => void) => {
    (socketRef.current as { offAny?: (handler: (event: string, ...args: unknown[]) => void) => void })?.offAny?.(handler);
  };

  const onConnect = (handler: () => void) => {
    if (socketRef.current) {
      socketRef.current.on('connect', handler);
      if (socketRef.current.connected) {
        handler();
      }
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    joinClassroom,
    joinLesson,
    sendMessage,
    sendLessonMessage,
    onJoinedClassroom,
    onClassMessage,
    onLessonMessage,
    offJoinedClassroom,
    offClassMessage,
    offLessonMessage,
    joinCourse,
    leaveCourse,
    onJoinedCourse,
    onLeftCourse,
    onEnrollmentAdded,
    onEnrollmentRemoved,
    offJoinedCourse,
    offLeftCourse,
    offEnrollmentAdded,
    offEnrollmentRemoved,
    onClassroomStudentAdded,
    onClassroomStudentRemoved,
    offClassroomStudentAdded,
    offClassroomStudentRemoved,
    on,
    off,
    onAny,
    offAny,
    onConnect,
  };
};
