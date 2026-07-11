import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { ScrollToTop } from './components/common/ScrollToTop';
import AppLayout from './layout/AppLayout';
import Welcome from './pages/Welcome';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SignIn from './pages/AuthPages/SignIn';
import SignUp from './pages/AuthPages/SignUp';
import VerifyCode from './pages/AuthPages/VerifyCode';
import NewPassword from './pages/AuthPages/NewPassword';
import ResetPassword from './pages/AuthPages/ResetPassword';
import NotFound from './pages/OtherPage/NotFound';
import Home from './pages/Dashboard/Home';
import UserProfiles from './pages/UserProfiles';
import AttendanceReportsPage from './pages/Reports/AttendanceReportsPage';
import SchedulesPage from './pages/Schedules/SchedulesPage';
import AttendanceRecordsPage from './pages/Attendance/AttendanceRecordsPage';
import DonationsPage from './pages/Donations/DonationsPage';
import DataMasterLayout from './pages/DataMaster/DataMasterLayout';
import StudentsPage from './pages/DataMaster/StudentsPage';
import ClassesPage from './pages/DataMaster/ClassesPage';
import AcademicTermsPage from './pages/DataMaster/AcademicTermsPage';
import SubjectsPage from './pages/DataMaster/SubjectsPage';
import TeachersPage from './pages/DataMaster/TeachersPage';
import ParentsPage from './pages/DataMaster/ParentsPage';
import DonationLanding from './pages/DonationLanding';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route index path="/" element={<Welcome />} />
            <Route path="/donasi" element={<DonationLanding />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/verify-code" element={<VerifyCode />} />
            <Route path="/new-password" element={<NewPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<ProtectedRoute allowedRoles={['administrator', 'teacher']} />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Home />} />
                <Route path="/profile" element={<UserProfiles />} />
                <Route path="/reports" element={<AttendanceReportsPage />} />
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
            
            {/* --- Fallback --- */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}