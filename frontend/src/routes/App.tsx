import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import EnhancedAdminDashboard from '../pages/EnhancedAdminDashboard';
import ProfilePage from '../pages/ProfilePage';
import UserManagement from '../pages/UserManagement';
import CreateUserPage from '../pages/CreateUserPage';
import CourseManagement from '../pages/CourseManagement';
import ClassroomManagement from '../pages/ClassroomManagement';
import TeacherLayout from '../components/TeacherLayout';
import StudentLayout from '../components/StudentLayout';
import TeacherOverview from '../features/teacher/pages/Overview';
import MyClassrooms from '../features/teacher/pages/MyClassrooms';
import MyCourses from '../features/teacher/pages/MyCourses';
import CourseManage from '../features/teacher/pages/CourseManage';
import CourseStudents from '../features/teacher/pages/CourseStudents';
import ClassLessons from '../features/teacher/pages/ClassLessons';
import ClassAssignments from '../features/teacher/pages/ClassAssignments';
import ManageCourse from '../features/teacher/pages/ManageCourse';
import TeacherAssignments from '../features/teacher/pages/TeacherAssignments';
import TeacherStudents from '../features/teacher/pages/TeacherStudents';
import StudentHome from '../features/student/pages/Home';
import StudentCourses from '../features/student/pages/Courses';
import StudentClassrooms from '../features/student/pages/Classrooms';
import StudentProgress from '../features/student/pages/Progress';
import StudentBadges from '../features/student/pages/Badges';
import StudentAssignments from '../features/student/pages/Assignments';
import JoinClassPage from '../pages/JoinClassPage';
import ChangePasswordPage from '../pages/ChangePasswordPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ForgotPasswordSuccessPage from '../pages/ForgotPasswordSuccessPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import TestForgotPasswordPage from '../pages/TestForgotPasswordPage';
import SubmitAssignmentPage from '../pages/SubmitAssignmentPage';
import GradeSubmissionsPage from '../pages/GradeSubmissionsPage';
import CourseDetailPage from '../pages/CourseDetailPage';
import CourseInvitationPage from '../pages/CourseInvitationPage';
import StudentClassroomDetailPage from '../pages/StudentClassroomDetailPage';
import PublicCoursesPage from '../pages/PublicCoursesPage';
import CreatePublicCoursePage from '../pages/CreatePublicCoursePage';
import LessonDetailPage from '../pages/LessonDetailPage';

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/courses/:id/lessons/:lessonId" element={<LessonDetailPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/auth/login"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/auth/register"
        element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />}
      />
      <Route
        path="/auth/forgot-password"
        element={user ? <Navigate to="/dashboard" replace /> : <ForgotPasswordPage />}
      />
      <Route
        path="/auth/forgot-password/success"
        element={user ? <Navigate to="/dashboard" replace /> : <ForgotPasswordSuccessPage />}
      />
      <Route
        path="/auth/reset-password"
        element={user ? <Navigate to="/dashboard" replace /> : <ResetPasswordPage />}
      />
      <Route path="/test/forgot-password" element={<TestForgotPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            {user?.role === 'admin' ? (
              <EnhancedAdminDashboard />
            ) : user?.role === 'teacher' ? (
              <TeacherLayout>
                <TeacherOverview />
              </TeacherLayout>
            ) : (
              <StudentLayout>
                <StudentHome />
              </StudentLayout>
            )}
          </ProtectedRoute>
        }
      />
      {/* Teacher routes */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <TeacherOverview />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classrooms"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <MyClassrooms />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <MyCourses />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses/:courseId/manage"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <CourseManage />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses/:courseId/students"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <CourseStudents />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses/:id/manage"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <ManageCourse />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classrooms/:id/lessons"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <ClassLessons />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classrooms/:id/assignments"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <ClassAssignments />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/assignments"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <TeacherAssignments />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <TeacherStudents />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      {/* Student routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <StudentHome />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/classrooms"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <StudentClassrooms />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/courses"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <StudentCourses />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/assignments"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <StudentAssignments />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/progress"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <StudentProgress />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/badges"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <StudentBadges />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/join-class"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <JoinClassPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/classrooms/:id"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <StudentClassroomDetailPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/classes/:classroomId/assignments/:assignmentId/submit"
        element={
          <ProtectedRoute requiredRole="student">
            <StudentLayout>
              <SubmitAssignmentPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/classes/:classroomId/assignments/:assignmentId/submissions"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <GradeSubmissionsPage />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/change-password"
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <EnhancedAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requiredRole="admin">
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/create-user"
        element={
          <ProtectedRoute requiredRole="admin">
            <CreateUserPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/courses"
        element={
          <ProtectedRoute requiredRole="admin">
            <CourseManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/classrooms"
        element={
          <ProtectedRoute requiredRole="admin">
            <ClassroomManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/:id"
        element={
          <ProtectedRoute>
            <CourseDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/invitations/course/:id"
        element={
          <ProtectedRoute requiredRole="student">
            <CourseInvitationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/courses/public"
        element={
          <ProtectedRoute>
            <StudentLayout>
              <PublicCoursesPage />
            </StudentLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses/public"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <PublicCoursesPage />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/courses/create-public"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherLayout>
              <CreatePublicCoursePage />
            </TeacherLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
