import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

export default function AdminRoute() {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const location = useLocation();

  if (!token || !storedUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = JSON.parse(storedUser);
  // ajusta 'role' si en tu backend es 'rol'
  const isAdmin = user.rol === 1 || user.rol === '1';

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }else{
    navigate('/admin', { replace: true });
  }

  return <Outlet />;
}
