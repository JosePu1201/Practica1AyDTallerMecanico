// src/pages/CambioPassword.jsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';

export default function CambioPassword() {
  const navigate = useNavigate();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [error, setError] = useState('');

  const canSubmit = p1.length >= 6 && p1 === p2; // regla básica, ajusta a tu gusto

  useEffect(() => {
    const resetToken = localStorage.getItem('token');
    if (!resetToken) navigate('/login', { replace: true });
  }, [navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!canSubmit) return;

    try {
      const resetToken = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
        const id_usuario = String(user?.id_usuario ?? user?.id ?? user?.idUsuario);

      if (!id_usuario) {
        setError('No se encontró el id de usuario para completar el cambio.');
        return;
      }

      // PUT: localhost:3000/api/personas/cambiar-contrasena
      await api.put('/personas/cambiar-contrasena', {
        id_usuario:id_usuario,
        nueva_contrasena: p1,
        token: resetToken
      });

      localStorage.removeItem('token');
      localStorage.removeItem('user');

      alert("✅ La contraseña se ha cambiado correctamente.");

      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar la contraseña');
    }
  };

  return (
    <div className="login-bg d-flex align-items-center justify-content-center vh-100">
      <div className="p-4 login-card" style={{ width: '100%', maxWidth: 420 }}>
        <h5 className="mb-2 text-white">Cambia tu contraseña</h5>
        <p className="mb-4" style={{ color: '#cfd6e4' }}>
          Ingresa tu nueva contraseña y confírmala.
        </p>

        {error && <div className="alert alert-danger py-2">{error}</div>}

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <label className="form-label">Nueva contraseña</label>
            <input
              type="password"
              className="form-control pill px-3"
              value={p1}
              onChange={(e) => setP1(e.target.value)}
              placeholder="Nueva contraseña"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Confirmar contraseña</label>
            <input
              type="password"
              className="form-control pill px-3"
              value={p2}
              onChange={(e) => setP2(e.target.value)}
              placeholder="Confirmar contraseña"
              required
            />
          </div>

          <button className="btn btn-primary w-100 py-2 pill" type="submit" disabled={!canSubmit}>
            Cambiar contraseña
          </button>
        </form>
      </div>
    </div>
  );
}
