/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './app/providers/AuthProvider';
import { ProtectedRoute } from './app/router/ProtectedRoute';
import { DashboardLayout } from './app/layouts/DashboardLayout';
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import Dashboard from './features/dashboard/Dashboard';
import Students from './features/students/Students';
import Teachers from './features/teachers/Teachers';
import Classes from './features/classes/Classes';
import Subjects from './features/subjects/Subjects';
import Placeholder from './components/shared/Placeholder';

export default function App() {
  return (
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
              <Route path="/attendance" element={<Placeholder title="Attendance" />} />
              <Route path="/exams" element={<Placeholder title="Exams" />} />
              <Route path="/results" element={<Placeholder title="Results" />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
