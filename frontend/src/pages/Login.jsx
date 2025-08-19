// src/pages/Login.jsx
import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Nav } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      console.log(data);
      navigate('/verificacion', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Ingrese su nombre de usuario para recuperar la contraseña.');
      return;
    }
    try {
      const { data } = await api.post('/personas/recuperar-contrasena', {
        username: email.trim(),
      });
      if (!data?.token) {
        setError('No se recibió el token de recuperación.');
        return;
      }
      localStorage.setItem('token', data.token);
      navigate('/verificar-pass', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo iniciar la recuperación.');
    }
  };

  return (
    <div className="login-bg d-flex align-items-center justify-content-center vh-100">
      <div className="p-4 login-card" style={{ width: '100%', maxWidth: 400 }}>
        <Nav variant="tabs" defaultActiveKey="signin" className="mb-4 login-tabs">
          <Nav.Item>
            <Nav.Link eventKey="signin">SIGN IN</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="signup">SIGN UP</Nav.Link>
          </Nav.Item>
        </Nav>

        {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">NOMBRE DE USUARIO</label>
            <input
              id="email"
              type="text"
              className="form-control rounded-pill px-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Usuario"
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">PASSWORD</label>
            <input
              id="password"
              type="password"
              className="form-control rounded-pill px-3"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-check mb-3">
            <input className="form-check-input" type="checkbox" id="remember" />
            <label className="form-check-label" htmlFor="remember">Mantener Sesión</label>
          </div>

          <button className="btn btn-primary w-100 py-2" type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'SIGN IN'}
          </button>
        </form>

        <div className="text-center mt-3">
          <a href="#" className="text-decoration-none text-light" onClick={onForgot}>
            Olvidó el Password?
          </a>
        </div>
      </div>
    </div>
  );
}
