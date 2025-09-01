// src/pages/VerifyCode.jsx
import React, { useEffect, useRef, useState } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function VerifyCode() {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputsRef = useRef([]);
  const navigate = useNavigate();
  const { setUser } = useAuth(); // <- actualiza el contexto al verificar

  // Si no hay token, rebotar por seguridad extra (además del ProtectedRoute)
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) navigate('/login', { replace: true });
  }, [navigate]);

  const focusIndex = (i) => {
    const el = inputsRef.current[i];
    if (el) el.focus();
  };

  const handleChange = (i, val) => {
    const onlyDigit = val.replace(/\D/g, '').slice(0, 1);
    const next = [...digits];
    next[i] = onlyDigit;
    setDigits(next);
    if (onlyDigit && i < 5) focusIndex(i + 1);
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      if (digits[i]) {
        const next = [...digits];
        next[i] = '';
        setDigits(next);
      } else if (i > 0) {
        focusIndex(i - 1);
      }
    }
    if (e.key === 'ArrowLeft' && i > 0) focusIndex(i - 1);
    if (e.key === 'ArrowRight' && i < 5) focusIndex(i + 1);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!text) return;
    const next = text.padEnd(6).split('').slice(0, 6);
    setDigits(next);
    const last = Math.min(text.length, 6) - 1;
    focusIndex(last >= 0 ? last : 0);
  };

  const code = digits.join('');

  const onSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return;

    try {
      const token = localStorage.getItem('token');
      const { data } = await api.post('/personas/autenticar-codigo-verificacion', {
        token,
        codigo_verificacion: code,
      });

      // Persistir y actualizar el contexto inmediatamente
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data); // <- esto evita el “pantallazo” al navegar


      // Redirección directa por rol (opcional: si prefieres, navega a "/")
      if (data.nombre_rol === 'ADMINISTRADOR') {
        navigate('/admin', { replace: true });
      } else if (data.nombre_rol === 'EMPLEADO') {
        navigate('/employee', { replace: true });
      } else if (data.nombre_rol === 'ESPECIALISTA') {
        navigate('/specialist', { replace: true });
      } else if (data.nombre_rol === 'CLIENTE') {
        navigate('/client', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Código inválido');
    }
  };

  const resendCode = async () => {
    try {
      await api.post('/personas/resend-code'); // ajusta el endpoint si es distinto
      alert('Código reenviado');
    } catch {
      alert('No se pudo reenviar el código');
    }
  };

  return (
    <div className="login-bg d-flex align-items-center justify-content-center vh-100">
      <div className="p-4 login-card" style={{ width: '100%', maxWidth: 420 }}>
        <h5 className="mb-2 text-white">Verifica tu cuenta</h5>
        <p className="mb-4" style={{ color: '#cfd6e4' }}>
          Ingresa el código de 6 dígitos que enviamos a tu correo.
        </p>

        <form onSubmit={onSubmit}>
          <div className="d-flex justify-content-between mb-4" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={1}
                className="form-control pill text-center"
                style={{ width: 48, height: 52, fontSize: 22, marginRight: i < 5 ? 8 : 0 }}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                ref={(el) => (inputsRef.current[i] = el)}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2 pill" disabled={code.length !== 6}>
            Verificar
          </button>
        </form>
      </div>
    </div>
  );
}
