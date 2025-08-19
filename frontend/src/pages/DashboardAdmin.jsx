import React, { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import './stiles/admin.css';

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

  useEffect(() => {
    // Carga usuario de localStorage
    const s = localStorage.getItem('user');
    if (s) {
      try {
        const parsed = JSON.parse(s);
        setUser(parsed);
      } catch {
        // si hay algo corrupto, limpiar y salir al login
        localStorage.removeItem('user');
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Cerrar menú al hacer clic fuera
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

  const onLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('adminSidebarCollapsed');
    navigate('/', { replace: true });
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
              { label: 'Listado', to: '/admin/vehiculos' },
              { label: 'Registro', to: '/admin/vehiculos/nuevo' },
              { label: 'Servicios', to: '/admin/vehiculos/servicios' },
            ]}
          />
          <SidebarItem
            icon="bi-boxes"
            label="Inventario"
            collapsed={collapsed}
            children={[
              { label: 'Repuestos', to: '/admin/inventario/repuestos' },
              { label: 'Proveedores', to: '/admin/inventario/proveedores' },
            ]}
          />
          <SidebarItem
            icon="bi-clipboard-check"
            label="Trabajos"
            collapsed={collapsed}
            children={[
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
            <button className="icon-btn" title="Ajustes"><i className="bi bi-gear" /></button>

            <button
              className="profile-chip"
              onClick={() => setMenuOpen(v => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user?.username || 'Usuario'}
            >
              <div className="avatar">{initials(user?.username)}</div>
              <span className="profile-name">{user?.username || 'Usuario'}</span>
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
          </div>
        </header>

        <main className="content">
          <div className="card-surface">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
