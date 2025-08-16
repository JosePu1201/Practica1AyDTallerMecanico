// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminRoute from './auth/AdminRoute';

import Login from './pages/Login';
import VerifyCode from './pages/VerifyCode';
import DashboardAdmin from './pages/DashboardAdmin';
import AdminHome from './pages/admin/AdminHome'; // ⬅️ nuevo

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />

          {/* Protegidas por token (ej. verificación) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/verificacion" element={<VerifyCode />} />
          </Route>

          {/* Admin solo para rol ADMIN */}
         
            <Route path="/admin" element={<DashboardAdmin />}>
             
            </Route>
         

          {/* Raíz */}
          <Route path="/" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
