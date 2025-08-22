// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

import Login from './pages/Login';
import VerifyCode from './pages/VerifyCode';
import DashboardAdmin from './pages/DashboardAdmin';
import HomePague from './pages/HomePague';
import DashboardEmpleado from './pages/DashboardEmpleado';
import VerifyCodePass from './pages/VerifyCodePass';
import CambioPassword from './pages/CambioPassword';

// Admin pages for user management
import UserList from './pages/admin/UserList';
import UserForm from './pages/admin/UserForm';
import UserDetail from './pages/admin/UserDetail';
import RoleList from './pages/admin/RoleList';
import SpecialistList from './pages/admin/SpecialistList';

// Admin service management pages
import ServicesDashboard from './pages/admin/services/ServicesDashboard';
import ServicesList from './pages/admin/services/ServicesList';
import RegisterService from './pages/admin/services/RegisterService';
import ServiceDetail from './pages/admin/services/ServiceDetail';
import ServiceEditForm from './pages/admin/services/ServiceEditForm';
import AssignWork from './pages/admin/services/AssignWork';
import MaintenanceTypes from './pages/admin/services/MaintenanceTypes';

// admin vehicles
import VehiclesList from './pages/admin/vehicles/VehiclesList';
import VehicleForm from './pages/admin/vehicles/VehicleForm';
import VehicleHistory from './pages/admin/vehicles/VehicleHostory';

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
          <Route element={<ProtectedRoute roles={'ADMINISTRADOR'} />}>
            <Route path="/admin" element={<DashboardAdmin />}>
              {/* User Management Routes */}
              <Route path="usuarios" element={<UserList />} />
              <Route path="usuarios/nuevo" element={<UserForm />} />
              <Route path="usuarios/editar/:id" element={<UserForm />} />
              <Route path="usuarios/detalle/:id" element={<UserDetail />} />
              <Route path="usuarios/roles" element={<RoleList />} />
              <Route path="usuarios/especialistas" element={<SpecialistList />} />
              
              {/* Services Management Routes */}
              <Route path="services" element={<ServicesDashboard />} />
              <Route path="services/list" element={<ServicesList />} />
              <Route path="services/register" element={<RegisterService />} />
              <Route path="services/detail/:id" element={<ServiceDetail />} />
              <Route path="services/edit/:id" element={<ServiceEditForm />} />
              <Route path="services/assign-work/:id" element={<AssignWork />} />
              <Route path="services/maintenance-types" element={<MaintenanceTypes />} />
              
              {/* Vehicles */}
              <Route path="vehicles" element={<VehiclesList />} />
              <Route path="vehicles/new" element={<VehicleForm />} />
              <Route path="vehicles/:id/edit" element={<VehicleForm />} />
              <Route path="vehicles/:id/history" element={<VehicleHistory />} />
              
              {/* Default admin page */}
              <Route index element={<div className="p-4"><h1>Panel de Administración</h1><p>Seleccione una opción del menú</p></div>} />
            </Route>
          </Route>

          {/* empleado solo para rol EMPLEADO 2 */}
          <Route element={<ProtectedRoute roles={'EMPLEADO'} />}>
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