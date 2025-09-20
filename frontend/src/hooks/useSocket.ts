import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinClassroom = (classroomId: string) => {
    socketRef.current?.emit('joinClassroom', { classroomId });
  };

  const sendMessage = (classroomId: string, message: string, user: { id: string; name: string }) => {
    socketRef.current?.emit('classMessage', { classroomId, message, user });
  };

  const onJoinedClassroom = (callback: (data: { classroomId: string }) => void) => {
    socketRef.current?.on('joinedClassroom', callback);
  };

  const onClassMessage = (callback: (data: { classroomId: string; message: string; user: { id: string; name: string }; timestamp: string }) => void) => {
    socketRef.current?.on('classMessage', callback);
  };

  const offJoinedClassroom = (callback: (data: { classroomId: string }) => void) => {
    socketRef.current?.off('joinedClassroom', callback);
  };

  const offClassMessage = (callback: (data: { classroomId: string; message: string; user: { id: string; name: string }; timestamp: string }) => void) => {
    socketRef.current?.off('classMessage', callback);
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

  const onEnrollmentAdded = (callback: (data: { courseId: string; enrollment: any; timestamp: string }) => void) => {
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

  const offEnrollmentAdded = (callback: (data: { courseId: string; enrollment: any; timestamp: string }) => void) => {
    socketRef.current?.off('enrollmentAdded', callback);
  };

  const offEnrollmentRemoved = (callback: (data: { courseId: string; studentId: string; timestamp: string }) => void) => {
    socketRef.current?.off('enrollmentRemoved', callback);
  };

  // Classroom student events
  const onClassroomStudentAdded = (callback: (data: { classroomId: string; student: any; timestamp: string }) => void) => {
    socketRef.current?.on('classroomStudentAdded', callback);
  };

  const onClassroomStudentRemoved = (callback: (data: { classroomId: string; studentId: string; timestamp: string }) => void) => {
    socketRef.current?.on('classroomStudentRemoved', callback);
  };

  const offClassroomStudentAdded = (callback: (data: { classroomId: string; student: any; timestamp: string }) => void) => {
    socketRef.current?.off('classroomStudentAdded', callback);
  };

  const offClassroomStudentRemoved = (callback: (data: { classroomId: string; studentId: string; timestamp: string }) => void) => {
    socketRef.current?.off('classroomStudentRemoved', callback);
  };

  return {
    socket: socketRef.current,
    joinClassroom,
    sendMessage,
    onJoinedClassroom,
    onClassMessage,
    offJoinedClassroom,
    offClassMessage,
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
  };
};
