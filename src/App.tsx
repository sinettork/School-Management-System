/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './app/providers/AuthProvider';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { ProtectedRoute } from './app/router/ProtectedRoute';
import { DashboardLayout } from './app/layouts/DashboardLayout';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import Dashboard from './features/dashboard/Dashboard';
import Students from './features/students/Students';
import Teachers from './features/teachers/Teachers';
import Classes from './features/classes/Classes';
import Subjects from './features/subjects/Subjects';
import Exams from './features/exams/Exams';
import Attendance from './features/attendance/Attendance';
import Results from './features/results/Results';
import FeePayments from './features/fees/FeePayments';
import Notices from './features/notices/Notices';
import Phases from './features/phases/Phases';
import Profile from './features/profile/Profile';
import Settings from './features/settings/Settings';
import Help from './features/help/Help';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route element={<ProtectedRoute />}>
              <Route element={<DashboardLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/students" element={<Students />} />
                <Route path="/teachers" element={<Teachers />} />
                <Route path="/classes" element={<Classes />} />
                <Route path="/subjects" element={<Subjects />} />
                <Route path="/phases" element={<Phases />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/exams" element={<Exams />} />
                <Route path="/results" element={<Results />} />
                <Route path="/fees" element={<FeePayments />} />
                <Route path="/notices" element={<Notices />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
              </Route>
            </Route>
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}
