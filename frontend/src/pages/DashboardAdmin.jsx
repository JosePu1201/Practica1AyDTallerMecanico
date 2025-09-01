import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './stiles/admin.css';
import axios from "axios";

function SidebarItem({ icon, label, to, children, collapsed }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (children?.some(ch => location.pathname.startsWith(ch.to))) {
      setOpen(true);
    }
  }, [location.pathname, children]);

  if (children && children.length) {
    return (
      <div className={`menu-item ${open ? 'open' : ''}`}>
        <button type="button" className="menu-btn" onClick={() => setOpen(!open)} title={label}>
          <i className={`bi ${icon} me-2`} />
          {!collapsed && <span>{label}</span>}
          {!collapsed && <i className={`bi ms-auto ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} />}
        </button>
        <div className="submenu" style={{ height: open && !collapsed ? children.length * 40 : 0 }}>
          {children.map(ch => (
            <NavLink key={ch.to} to={ch.to} end className="submenu-link">
              <span>{ch.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    );
  }

  return (
    <NavLink to={to} end className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`} title={label}>
      <i className={`bi ${icon} me-2`} />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('adminSidebarCollapsed') === '1');
  const [user, setUser] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // === Ajustes / autenticación ===
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [autenticacion, setAutenticacion] = useState(false);
  const [authPending, setAuthPending] = useState(false);
  const [flash, setFlash] = useState(null); // {type:'ok'|'error', text:string}

  // Cargar usuario de localStorage
  useEffect(() => {
    const s = localStorage.getItem('user');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        setUser(parsed);
      } catch {
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Cargar estado inicial de autenticación
  useEffect(() => {
    const raw = localStorage.getItem('autenticacion');
    setAutenticacion(String(raw) === 'true');
  }, []);

  // Cerrar menú perfil al click fuera
  useEffect(() => {
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const toggleSidebar = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem('adminSidebarCollapsed', next ? '1' : '0');
  };

  const initials = (name) =>
    (name || '')
      .trim()
      .split(/\s+/)
      .map(w => w[0]?.toUpperCase())
      .join('')
      .slice(0, 2) || 'US';

  const onLogout = async() => {
    try {
      const res = await axios.post("/api/personas/logout");
      console.log(res.data.mensaje);
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("autenticacion");
      localStorage.removeItem("token");
      localStorage.removeItem("adminSidebarCollapsed");
      navigate("/", { replace: true });
    }
  };

  // Cambiar autenticación (optimista con revert en error)
  const toggleAutenticacion = async () => {
    if (authPending) return;
    setAuthPending(true);

    const nuevoValor = !autenticacion;
    setAutenticacion(nuevoValor); // optimista
    localStorage.setItem('autenticacion', nuevoValor ? 'true' : 'false');

    try {
      const { data } = await axios.put("/api/personas/cambiar-autenticacion", {
        autenticacion: nuevoValor,
      });
      const msg = data?.mensaje || "Autenticación de dos factores actualizada correctamente";
      setFlash({ type: 'ok', text: msg });

      // Cerrar modal y ocultar toast
      setTimeout(() => {
        setSettingsOpen(false);
        setFlash(null);
      }, 1800);
    } catch (err) {
      console.error("Error cambiando autenticación", err);
      // revertir
      setAutenticacion(!nuevoValor);
      localStorage.setItem('autenticacion', (!nuevoValor) ? 'true' : 'false');
      setFlash({ type: 'error', text: "No se pudo actualizar la autenticación" });

      setTimeout(() => setFlash(null), 2200);
    } finally {
      setAuthPending(false);
    }
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <button className="toggle-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
            <i className="bi bi-list" />
          </button>
          {!collapsed && <h5 className="m-0">Admin</h5>}
        </div>

        <nav className="menu">
          <SidebarItem icon="bi-house" label="Inicio" to="/admin" collapsed={collapsed} />
          <SidebarItem
            icon="bi-people"
            label="Usuarios"
            collapsed={collapsed}
            children={[
              { label: 'Listado', to: '/admin/usuarios' },
              { label: 'Roles', to: '/admin/usuarios/roles' },
              { label: 'Especialistas', to: '/admin/usuarios/especialistas' },
            ]}
          />
          <SidebarItem
            icon="bi-car-front"
            label="Vehículos"
            collapsed={collapsed}
            children={[
              { label: 'Listado', to: '/admin/vehicles' },
              { label: 'Registro', to: '/admin/vehicles/new' },
              { label: 'Servicios', to: '/admin/services' },
            ]}
          />
          <SidebarItem
            icon="bi-boxes"
            label="Inventario"
            collapsed={collapsed}
            children={[
              { label: 'Repuestos', to: '/admin/inventario/repuestos' },
              { label: 'Proveedores', to: '/admin/inventario/proveedores' },
              { label: 'Pedidos', to: '/admin/inventario/pedidos' }
            ]}
          />
          <SidebarItem
            icon="bi-clipboard-check"
            label="Trabajos"
            collapsed={collapsed}
            children={[
              { label: 'Servicios', to: '/admin/services' },
              { label: 'Asignaciones', to: '/admin/trabajos/asignaciones' },
              { label: 'Tipos', to: '/admin/trabajos/tipos' },
              { label: 'Seguimiento', to: '/admin/trabajos/seguimiento' },
            ]}
          />
          <SidebarItem
            icon="bi-cash-coin"
            label="Facturación"
            collapsed={collapsed}
            children={[
              { label: 'Facturas', to: '/admin/facturacion/facturas' },
              { label: 'Pagos', to: '/admin/facturacion/pagos' },
              { label: 'Reportes', to: '/admin/facturacion/reportes' },
            ]}
          />

          <SidebarItem
            icon="bi-file-earmark-text"
            label="Reportes"
            collapsed={collapsed}
            children={[
              { label: 'Reportes', to: '/admin/reportes' },
            ]}
          />
          <SidebarItem
            icon="bi-gear"
            label="Configuración"
            to="/admin/configuracion"
            collapsed={collapsed}
          />
        </nav>

        {!collapsed && <div className="sidebar-footer">v1.0</div>}
      </aside>

      {/* Área principal */}
      <div className="main">
        <header className="topbar">
          <div className="search">
            <i className="bi bi-search" />
            <input placeholder="Buscar..." />
          </div>

          {/* Perfil / menú */}
          <div className="top-actions" ref={menuRef}>
            <button className="icon-btn" title="Notificaciones"><i className="bi bi-bell" /></button>
            <button className="icon-btn" title="Ajustes" onClick={() => setSettingsOpen(true)}>
              <i className="bi bi-gear" />
            </button>

            <button
              className="profile-chip"
              onClick={() => setMenuOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.nombre_usuario || 'Usuario'}
            >
              <div className="avatar">{initials(user?.nombre_usuario)}</div>
              <span className="profile-name">{user?.nombre_usuario || 'Usuario'}</span>
              <i className={`bi ${menuOpen ? 'bi-caret-up-fill' : 'bi-caret-down-fill'}`} />
            </button>

            {menuOpen && (
              <div className="profile-menu" role="menu">
                <button className="profile-item" onClick={onLogout}>
                  <i className="bi bi-box-arrow-right me-2" />
                  Salir
                </button>
              </div>
            )}

            {/* Modal de Configuraciones */}
            {settingsOpen && (
              <div
                className="modal open"
                onClick={(e) => { if (e.target.classList.contains("modal")) setSettingsOpen(false); }}
              >
                <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="cfg-title">
                  <h3 id="cfg-title">Configuraciones</h3>

                  <div className="list" style={{ marginTop: 10 }}>
                    <div
                      className="list-item"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}
                    >
                      <div>
                        <strong>Autenticación a dos pasos</strong>
                        <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                          Activa o desactiva la autenticación a dos pasos.
                        </div>
                      </div>

                      <button
                        onClick={toggleAutenticacion}
                        className="btn"
                        disabled={authPending}
                        style={{ background: autenticacion ? "#10b981" : "#ef4444" }}
                      >
                        {authPending ? "Guardando..." : (autenticacion ? "Desactivar" : "Activar")}
                      </button>
                    </div>
                  </div>

                  <div className="modal-actions">
                    <button className="btn-ghost" onClick={() => setSettingsOpen(false)}>Cerrar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>

        <main className="content">
          <div className="card-surface">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast de feedback */}
      {flash && (
        <div
          role="status"
          style={{
            position: "fixed",
            right: 16,
            bottom: 16,
            background: flash.type === "error" ? "#b91c1c" : "#0f766e",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 10,
            boxShadow: "0 10px 25px rgba(0,0,0,.35)",
            zIndex: 10000,
            fontWeight: 600,
          }}
        >
          {flash.text}
        </div>
      )}
    </div>
  );
}
