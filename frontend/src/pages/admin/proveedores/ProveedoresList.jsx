import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
// si ya tenés bootstrap-icons o similares, se usan las clases `bi ...`
import "../../stiles/admin.css";
import { userService } from "../../../services/adminService"; 

const BASE_PATH = "/api/proveedores"; // ajusta si tu backend usa otro prefijo

const cls = (...xs) => xs.filter(Boolean).join(" ");
const required = (s) => (s ?? "").toString().trim().length > 0;

function ProveedorModal({ open, onClose, onSubmit, usersDisponibles }) {
  const [form, setForm] = useState({ id_usuario: "", nit: "" });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ id_usuario: "", nit: "" });
      setErrors({});
      setSaving(false);
    }
  }, [open]);

  const validate = () => {
    const e = {};
    if (!required(form.id_usuario)) e.id_usuario = "Selecciona un usuario";
    if (!required(form.nit)) e.nit = "Ingresa el NIT";
    else if (!/^\d{4,}$/.test(String(form.nit))) e.nit = "NIT inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await onSubmit(form);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal open" onClick={(e)=>{ if (e.target.classList.contains("modal")) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <h3 className="text-xl font-semibold mb-2">Nuevo proveedor</h3>

        <label className="label">Usuario (rol PROVEEDOR) *</label>
        <select
          className={cls("input", errors.id_usuario && "input-error")}
          value={form.id_usuario}
          onChange={(e)=>setForm(v=>({...v, id_usuario: e.target.value}))}
        >
          <option value="">Selecciona…</option>
          {usersDisponibles.map(u => (
            <option key={u.id_usuario} value={u.id_usuario}>
              {u.nombre_usuario} (#{u.id_usuario})
            </option>
          ))}
        </select>
        {errors.id_usuario && <small className="err">{errors.id_usuario}</small>}

        <label className="label">NIT *</label>
        <input
          type="number"
          className={cls("input", errors.nit && "input-error")}
          value={form.nit}
          onChange={(e)=>setForm(v=>({...v, nit: e.target.value}))}
          placeholder="Ej. 12345678"
        />
        {errors.nit && <small className="err">{errors.nit}</small>}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Crear"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProveedoresList() {
  const [data, setData] = useState([]);             // proveedores
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [users, setUsers] = useState([]);           // todos los usuarios
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [flash, setFlash] = useState(null);

  const showFlash = (type, text, ms=2200) => {
    setFlash({ type, text });
    setTimeout(()=> setFlash(null), ms);
  };

  const fetchProveedores = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE_PATH}/listar_proveedores`);
      setData(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudieron cargar los proveedores");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const list = await userService.getAllUsers(); // tu servicio
      setUsers(Array.isArray(list) ? list : []);
    } catch (e) {
      console.error("Error cargando usuarios", e);
    }
  };

  useEffect(() => { fetchProveedores(); fetchUsers(); }, []);

  // usuarios rol proveedor y activos, excluyendo ya asignados
  const usersProveedorDisponibles = useMemo(() => {
    const asignados = new Set(data.map(p => p.id_usuario));
    return users
      .filter(u => (u.estado === "ACTIVO") && (u.id_rol === 5 || String(u.rol)?.toUpperCase() === "PROVEEDOR"))
      .filter(u => !asignados.has(u.id_usuario));
  }, [users, data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter(p => {
      const usuario = p.Usuario?.nombre_usuario || "";
      return [usuario, p.nit, p.estado]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [search, data]);

  const onCreate = async ({ id_usuario, nit }) => {
    await axios.post(`${BASE_PATH}/crear`, { id_usuario, nit });
    showFlash("ok", "Proveedor creado");
    await fetchProveedores();
  };

  const onDelete = async (p) => {
    if (!window.confirm(`¿Eliminar proveedor NIT ${p.nit}?`)) return;
    try {
      // Ajusta este endpoint/método según tu backend:
      // Intento DELETE… si tu API usa PUT, cambia aquí a PUT.
      await axios.delete?.(`${BASE_PATH}/eliminar/${p.id_proveedor}`)
        .catch(async (e) => {
          // fallback si el backend no permite DELETE
          if (e?.response?.status === 405 || e?.response?.status === 404) {
            await axios.put(`${BASE_PATH}/eliminar/${p.id_proveedor}`);
          } else {
            throw e;
          }
        });
      showFlash("ok", "Proveedor eliminado");
      await fetchProveedores();
    } catch (e) {
      console.error(e);
      showFlash("error", "No se pudo eliminar");
    }
  };

  return (
    <div className="card-surface">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="m-0">Proveedores</h2>
          <div className="muted text-sm">Gestiona proveedores del sistema</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="search">
            <i className="bi bi-search" />
            <input
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              placeholder="Buscar por usuario, NIT o estado…"
            />
          </div>
          <button className="btn" onClick={()=> setModalOpen(true)}>
            <i className="bi bi-plus-lg me-2" /> Nuevo
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading && <div className="skeleton h-10" />}
        {error && (
          <div className="alert alert-error">
            <i className="bi bi-exclamation-triangle me-2" /> {error}
          </div>
        )}
        {!loading && !error && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th className="hide-sm">NIT</th>
                  <th className="hide-sm">Estado</th>
                  <th className="hide-sm">Fecha registro</th>
                  <th style={{ width: 120 }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted">No hay proveedores</td>
                  </tr>
                ) : filtered.map(p => (
                  <tr key={p.id_proveedor}>
                    <td>
                      <div className="font-semibold">
                        {p.Usuario?.nombre_usuario || `#${p.id_usuario}`}
                      </div>
                      <div className="muted text-sm">ID usuario: {p.id_usuario}</div>
                    </td>
                    <td className="hide-sm">{p.nit || "—"}</td>
                    <td className="hide-sm">
                      <span className={cls("badge", p.estado === "INACTIVO" ? "badge-neutral" : "badge-ok")}>
                        {p.estado}
                      </span>
                    </td>
                    <td className="hide-sm">
                      {p.fecha_registro ? new Date(p.fecha_registro).toISOString().split("T")[0] : "—"}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="icon-btn" title="Eliminar" onClick={()=> onDelete(p)}>
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ProveedorModal
        open={modalOpen}
        onClose={()=> setModalOpen(false)}
        onSubmit={onCreate}
        usersDisponibles={usersProveedorDisponibles}
      />

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
