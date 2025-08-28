// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

import Login from './pages/Login';
import VerifyCode from './pages/VerifyCode';
import DashboardAdmin from './pages/DashboardAdmin';
import HomePague from './pages/HomePague';
import DashboardEmpleado from './pages/DashboardEmpleado';
import DashboardEspecialista from './pages/DashboardEspecialista';
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
import InfoPersonal from './pages/employee/InfoPersonal';
import EmployeeTasks from './pages/employee/EmployeeTasks';
import EmployeeWork from './pages/employee/EmployeeWork';

// Specialist pages
import SpecialistDashboard from './pages/specialist/SpecialistDashboard';
import WorksList from './pages/specialist/works/WorksList';
import WorkDetail from './pages/specialist/works/WorkDetail';
import DiagnosticForm from './pages/specialist/diagnostics/DiagnosticForm';
import DiagnosticList from './pages/specialist/diagnostics/DiagnosticList';
import TechnicalTestForm from './pages/specialist/tests/TechnicalTestForm';
import TechnicalTestsList from './pages/specialist/tests/TechnicalTestsList';
import TestResultForm from './pages/specialist/tests/TestResultForm';
import SolutionProposalForm from './pages/specialist/tests/SolutionProposalForm';
import CommentForm from './pages/specialist/comments/CommentForm';
import CommentsList from './pages/specialist/comments/CommentsList';
import VehicleHistorySpecialist from './pages/specialist/works/VehicleHistory';
import RecommendationForm from './pages/specialist/recommendations/RecommendationForm';
import RecommendationList from './pages/specialist/recommendations/RecommendationList';
import SupportRequestForm from './pages/specialist/support/SupportRequestForm';
import SupportRequestList from './pages/specialist/support/SupportRequestList';
import PartsRequestList from './pages/specialist/parts/PartsRequestList';
import SpecialistProfile from './pages/specialist/profile/SpecialistProfile';
import EmployeeMisAvances from './pages/employee/EmployeeMisAvances';
import EmployeeMisObservaciones from './pages/employee/EmployeeMisObservaciones';

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
            <Route path="/employee" element={<DashboardEmpleado />}>
              <Route path="infopersonal" element={<InfoPersonal />} />
              <Route path="tasks" element={<EmployeeTasks />} />
              <Route path="tasks/:id/work" element={<EmployeeWork />} />
              <Route path="/employee/mis-avances" element={<EmployeeMisAvances />} />
              <Route path="/employee/mis-observaciones" element={<EmployeeMisObservaciones />} />
            </Route>
          </Route>

          {/*RUTAS PARA ESPECIALISTAS */}
          <Route element={<ProtectedRoute roles={'ESPECIALISTA'} />}>
            <Route path="/specialist" element={<DashboardEspecialista />}>
              {/* Dashboard */}
              <Route index element={<SpecialistDashboard />} />
              
              {/* Works management */}
              <Route path="works" element={<WorksList />} />
              <Route path="works/:id" element={<WorkDetail />} />
              <Route path="works/history" element={<WorksList />} />
              <Route path="history/:id" element={<VehicleHistorySpecialist />} />
              
              {/* Diagnostics */}
              <Route path="diagnostics" element={<DiagnosticList />} />
              <Route path="diagnostics/create" element={<DiagnosticForm />} />
              
              {/* Technical tests */}
              <Route path="tests" element={<TechnicalTestsList />} />
              <Route path="tests/create" element={<TechnicalTestForm />} />
              <Route path="tests/result/:id" element={<TestResultForm />} />
              <Route path="tests/solution/:id" element={<SolutionProposalForm />} />
              
              {/* Comments */}
              <Route path="comments/create" element={<CommentForm />} />
              <Route path="comments" element={<CommentsList />} />
              
              {/* Recommendations */}
              <Route path="recommendations" element={<RecommendationList />} />
              <Route path="recommendations/create" element={<RecommendationForm />} />
              
              {/* Support */}
              <Route path="support" element={<SupportRequestList />} />
              <Route path="support/create" element={<SupportRequestForm />} />
              
              {/* Parts */}
              <Route path="parts/requests" element={<PartsRequestList />} />
              
              {/* Profile */}
              <Route path="profile" element={<SpecialistProfile />} />
            </Route>
          </Route>

          {/* Raíz */}
          <Route path="/" element={<HomePague />} />

          {/* Unauthorized route */}
          <Route path="/no-autorizado" element={
            <div className="container mt-5 text-center">
              <h1>Acceso No Autorizado</h1>
              <p>No tiene permisos para acceder a esta página o su sesión ha expirado.</p>
              <Link to="/login" className="btn btn-primary">Iniciar Sesión</Link>
            </div>
          } />

          {/* Route for handling 404s */}
          <Route path="*" element={
            <div className="container mt-5 text-center">
              <h1>Página No Encontrada</h1>
              <p>La página que busca no existe.</p>
              <Link to="/" className="btn btn-primary">Volver al Inicio</Link>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}