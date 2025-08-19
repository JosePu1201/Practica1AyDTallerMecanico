// src/auth/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function ProtectedRoute({ roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{padding:24,color:'#eaf0ff'}}>Cargando…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  // roles puede no venir, ser número (1) o arreglo ([1,2])
  if (roles !== undefined) {
    const allowed = Array.isArray(roles) ? roles.includes(user.nombre_rol) : user.nombre_rol === roles;
    if (!allowed) return <Navigate to="/" replace />;
    console.log(user);
  }

  return <Outlet />;
}
