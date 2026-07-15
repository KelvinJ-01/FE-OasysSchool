import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ScrollToTop } from './components/common/ScrollToTop';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PageLoader } from './components/common/PageLoader';
import { createQueryClient } from './lib/queryClient';
import { env } from './config/env';
import AppLayout from './layout/AppLayout';

import Welcome from './pages/Welcome';
import SignIn from './pages/AuthPages/SignIn';
import TeacherSignUp from './pages/AuthPages/TeacherSignUp';
import NotFound from './pages/OtherPage/NotFound';

const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const SignUp = lazy(() => import('./pages/AuthPages/SignUp'));
const VerifyCode = lazy(() => import('./pages/AuthPages/VerifyCode'));
const NewPassword = lazy(() => import('./pages/AuthPages/NewPassword'));
const ResetPassword = lazy(() => import('./pages/AuthPages/ResetPassword'));
const Home = lazy(() => import('./pages/Dashboard/Home'));
const UserProfiles = lazy(() => import('./pages/UserProfiles'));
const SchedulesPage = lazy(() => import('./pages/Schedules/SchedulesPage'));
const AttendanceRecordsPage = lazy(() => import('./pages/Attendance/AttendanceRecordsPage'));
const DonationsPage = lazy(() => import('./pages/Donations/DonationsPage'));
const DataMasterLayout = lazy(() => import('./pages/DataMaster/DataMasterLayout'));
const StudentsPage = lazy(() => import('./pages/DataMaster/StudentsPage'));
const ClassesPage = lazy(() => import('./pages/DataMaster/ClassesPage'));
const AcademicTermsPage = lazy(() => import('./pages/DataMaster/AcademicTermsPage'));
const SubjectsPage = lazy(() => import('./pages/DataMaster/SubjectsPage'));
const TeachersPage = lazy(() => import('./pages/DataMaster/TeachersPage'));
const ParentsPage = lazy(() => import('./pages/DataMaster/ParentsPage'));
const DonationLanding = lazy(() => import('./pages/DonationLanding'));
const Forbidden = lazy(() => import('./pages/OtherPage/Forbidden'));

const queryClient = createQueryClient();

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <Router>
              <ScrollToTop />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route index path="/" element={<Welcome />} />
                  <Route path="/donasi" element={<DonationLanding />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/teacher-signup" element={<TeacherSignUp />} />

                  {env.enableParentRegistrationPage && <Route path="/signup" element={<SignUp />} />}

                  <Route path="/verify-code" element={<VerifyCode />} />
                  <Route path="/new-password" element={<NewPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  <Route element={<ProtectedRoute allowedRoles={['administrator', 'teacher']} />}>
                    <Route element={<AppLayout />}>
                      <Route path="/dashboard" element={<Home />} />
                      <Route path="/profile" element={<UserProfiles />} />
                      <Route path="/schedules" element={<SchedulesPage />} />
                      <Route path="/attendance" element={<AttendanceRecordsPage />} />
                      <Route path="/donations" element={<DonationsPage />} />

                      <Route path="/data-master" element={<DataMasterLayout />}>
                        <Route index element={<Navigate to="students" replace />} />
                        <Route path="students" element={<StudentsPage />} />
                        <Route path="classes" element={<ClassesPage />} />
                        <Route path="academic-terms" element={<AcademicTermsPage />} />
                        <Route path="subjects" element={<SubjectsPage />} />

                        <Route element={<ProtectedRoute allowedRoles={['administrator']} />}>
                          <Route path="teachers" element={<TeachersPage />} />
                          <Route path="parents" element={<ParentsPage />} />
                        </Route>
                      </Route>
                    </Route>
                  </Route>

                  <Route path="/403" element={<Forbidden />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </Router>
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
