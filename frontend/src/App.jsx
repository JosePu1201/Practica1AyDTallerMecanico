// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';
import AdminRoute from './auth/AdminRoute';

import Login from './pages/Login';
import VerifyCode from './pages/VerifyCode';
import DashboardAdmin from './pages/DashboardAdmin';
import AdminHome from './pages/admin/AdminHome'; // ⬅️ nuevo
import HomePague from './pages/HomePague';
import DashboardEmpleado from './pages/DashboardEmpleado';
import VerifyCodePass from './pages/VerifyCodePass';
import CambioPassword from './pages/CambioPassword';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/verificar-pass" element={<VerifyCodePass />} />
          <Route path="/cambiar-password" element={<CambioPassword />} />

          {/* Protegidas por token (ej. verificación) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/verificacion" element={<VerifyCode />} />
          </Route>

          {/* Admin solo para rol ADMIN 1 */}
         <Route element={<ProtectedRoute roles={1} />}>
            <Route path="/admin" element={<DashboardAdmin />}>
             
            </Route>
         </Route>

          {/* empleado solo para rol EMPLEADO 2 */}
         <Route element={<ProtectedRoute roles={2} />}>
            <Route path="/empleado" element={<DashboardEmpleado />}>
             
            </Route>
         </Route>
         

          {/* Raíz */}
          <Route path="/" element={<HomePague />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
