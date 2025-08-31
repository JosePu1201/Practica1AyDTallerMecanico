import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../stiles/proveedor.css";

const BASE_PATH = "/api/proveedores"; // ajusta si tus rutas cambian

const cls = (...xs) => xs.filter(Boolean).join(" ");
const required = (s) => (s ?? "").toString().trim().length > 0;

function useProveedorId() {
  const [idProveedor, setIdProveedor] = useState(null);
  useEffect(() => {
    const raw = localStorage.getItem("user");
    try {
      const u = raw ? JSON.parse(raw) : null;
      setIdProveedor(u?.id_usuario ?? null); // si tu backend requiere id_proveedor real, cambia aquí
    } catch {
      setIdProveedor(null);
    }
  }, []);
  return idProveedor;
}

const EmptyState = ({ onAdd }) => (
  <div className="p-8 text-center border-2 border-dashed rounded-2xl">
    <div className="text-2xl font-semibold">Aún no tienes repuestos</div>
    <p className="mt-2 text-sm opacity-75">
      Agrega tus repuestos para empezar a gestionar tu inventario.
    </p>
    <button className="btn mt-4" onClick={onAdd}>
      <i className="bi bi-plus-lg me-2" /> Nuevo repuesto
    </button>
  </div>
);

/* ===== Modal: Crear / Editar repuesto ===== */
function RepuestoModal({ open, onClose, onSubmit, initial }) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    codigo_parte: "",
    marca_compatible: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({
        nombre: initial?.nombre ?? "",
        descripcion: initial?.descripcion ?? "",
        codigo_parte: initial?.codigo_parte ?? "",
        marca_compatible: initial?.marca_compatible ?? "",
      });
      setErrors({});
      setSaving(false);
    }
  }, [open, initial]);

  const validate = () => {
    const e = {};
    if (!required(form.nombre)) e.nombre = "Obligatorio";
    if (!required(form.descripcion)) e.descripcion = "Obligatorio";
    if (!required(form.codigo_parte)) e.codigo_parte = "Obligatorio";
    if (!required(form.marca_compatible)) e.marca_compatible = "Obligatorio";
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
        <h3 className="text-xl font-semibold mb-2">{initial ? "Editar repuesto" : "Nuevo repuesto"}</h3>
        <div className="grid gap-3 mt-3">
          <div>
            <label className="label">Nombre *</label>
            <input
              className={cls("input", errors.nombre && "input-error")}
              value={form.nombre}
              onChange={(e)=>setForm(v=>({...v, nombre: e.target.value}))}
              placeholder="Ej. Filtro de aceite 5W-30"
            />
            {errors.nombre && <small className="err">{errors.nombre}</small>}
          </div>
          <div>
            <label className="label">Descripción *</label>
            <textarea
              rows={3}
              className={cls("textarea", errors.descripcion && "input-error")}
              value={form.descripcion}
              onChange={(e)=>setForm(v=>({...v, descripcion: e.target.value}))}
              placeholder="Detalles, compatibilidad, notas…"
            />
            {errors.descripcion && <small className="err">{errors.descripcion}</small>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Código de parte *</label>
              <input
                className={cls("input", errors.codigo_parte && "input-error")}
                value={form.codigo_parte}
                onChange={(e)=>setForm(v=>({...v, codigo_parte: e.target.value}))}
                placeholder="Ej. ABC-12345"
              />
              {errors.codigo_parte && <small className="err">{errors.codigo_parte}</small>}
            </div>
            <div>
              <label className="label">Marca compatible *</label>
              <input
                className={cls("input", errors.marca_compatible && "input-error")}
                value={form.marca_compatible}
                onChange={(e)=>setForm(v=>({...v, marca_compatible: e.target.value}))}
                placeholder="Toyota, Honda, Nissan…"
              />
              {errors.marca_compatible && <small className="err">{errors.marca_compatible}</small>}
            </div>
          </div>
        </div>

        <div className="modal-actions mt-5">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : (initial ? "Guardar cambios" : "Crear repuesto")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Modal: Agregar a mi catálogo ===== */
function AddToCatalogModal({ open, onClose, onSubmit, repuesto }) {
  const [form, setForm] = useState({
    precio: "",
    cantidad_disponible: "",
    tiempo_entrega: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      setForm({ precio: "", cantidad_disponible: "", tiempo_entrega: "" });
      setErrors({});
      setSaving(false);
    }
  }, [open]);

  const validate = () => {
    const e = {};
    if (!required(form.precio) || Number(form.precio) <= 0) e.precio = "Precio inválido";
    if (!required(form.cantidad_disponible) || Number.isNaN(+form.cantidad_disponible) || +form.cantidad_disponible < 0) {
      e.cantidad_disponible = "Cantidad inválida";
    }
    if (!required(form.tiempo_entrega)) e.tiempo_entrega = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await onSubmit({
        id_repuesto: repuesto.id_repuesto,
        precio: Number(form.precio),
        cantidad_disponible: Number(form.cantidad_disponible),
        tiempo_entrega: Number(form.tiempo_entrega),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal open" onClick={(e)=>{ if (e.target.classList.contains("modal")) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <h3 className="text-xl font-semibold mb-2">Agregar a mi catálogo</h3>
        <div className="muted" style={{marginBottom:8}}>
          Repuesto: <strong>{repuesto?.nombre}</strong> ({repuesto?.codigo_parte || "s/código"})
        </div>

        <label className="label">Precio *</label>
        <input
          type="number" min="0" step="0.01"
          className={cls("input", errors.precio && "input-error")}
          value={form.precio}
          onChange={(e)=>setForm(v=>({...v, precio: e.target.value}))}
          placeholder="0.00"
        />
        {errors.precio && <small className="err">{errors.precio}</small>}

        <label className="label">Cantidad disponible *</label>
        <input
          type="number" min="0" step="1"
          className={cls("input", errors.cantidad_disponible && "input-error")}
          value={form.cantidad_disponible}
          onChange={(e)=>setForm(v=>({...v, cantidad_disponible: e.target.value}))}
          placeholder="0"
        />
        {errors.cantidad_disponible && <small className="err">{errors.cantidad_disponible}</small>}

        <label className="label">Tiempo de entrega *</label>
        <input
          className={cls("input", errors.tiempo_entrega && "input-error")}
          value={form.tiempo_entrega}
          onChange={(e)=>setForm(v=>({...v, tiempo_entrega: e.target.value}))}
          placeholder="Ej. 2-3 días hábiles"
        />
        {errors.tiempo_entrega && <small className="err">{errors.tiempo_entrega}</small>}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Agregar"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Tabla / listado ===== */
function TablaRepuestos({ items, onEdit, onDelete, onAddCatalog }) {
  if (!items?.length) return null;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th className="hide-sm">Código</th>
            <th className="hide-sm">Marca compatible</th>
            <th className="hide-sm">Estado</th>
            <th className="hide-sm">Creado</th>
            <th className="actions-col">Acciones</th> {/* ancho mayor por CSS */}
          </tr>
        </thead>
        <tbody>
          {items.map(r => (
            <tr key={r.id_repuesto}>
              <td>
                <div className="font-semibold">{r.nombre}</div>
                <div className="muted text-sm" title={r.descripcion}>{r.descripcion}</div>
              </td>
              <td className="hide-sm">{r.codigo_parte || "—"}</td>
              <td className="hide-sm">{r.marca_compatible || "—"}</td>
              <td className="hide-sm">
                <span className={cls("badge", r.estado === "DESCONTINUADO" ? "badge-error" : "badge-ok")}>{r.estado}</span>
              </td>
              <td className="hide-sm">{r.fecha_creacion ? new Date(r.fecha_creacion).toISOString().split("T")[0] : "—"}</td>
              <td className="actions-col">
                <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
                  <button className="icon-btn" title="Editar" onClick={()=>onEdit(r)}>
                    <i className="bi bi-pencil"/>
                  </button>
                  <button className="icon-btn" title="Eliminar" onClick={()=>onDelete(r)}>
                    <i className="bi bi-trash"/>
                  </button>
                  <button className="icon-btn" title="Agregar a mi catálogo" onClick={()=>onAddCatalog(r)}>
                    <i className="bi bi-bag-plus"/>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ===== Vista principal ===== */
export default function RepuestosList() {
  const idProveedor = useProveedorId();
  const [q, setQ] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [flash, setFlash] = useState(null);

  // modal agregar a catálogo
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selectedRepuesto, setSelectedRepuesto] = useState(null);

  const showFlash = (type, text, ms=2200) => {
    setFlash({ type, text });
    setTimeout(()=> setFlash(null), ms);
  };

  const fetchAll = async () => {
    if (!idProveedor) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE_PATH}/listar_repuestos/${idProveedor}`);
      setData(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los repuestos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [idProveedor]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return data;
    return data.filter(r =>
      [r.nombre, r.descripcion, r.codigo_parte, r.marca_compatible]
        .join(" \u200b ")
        .toLowerCase()
        .includes(term)
    );
  }, [q, data]);

  const onAdd = () => { setEditing(null); setModalOpen(true); };
  const onEdit = (r) => { setEditing(r); setModalOpen(true); };

  const submitCreate = async (form) => {
    await axios.post(`${BASE_PATH}/crear_repuesto/${idProveedor}`,{...form});
    showFlash("ok","Repuesto creado exitosamente");
    await fetchAll();
  };

  const submitUpdate = async (form) => {
    await axios.put(`${BASE_PATH}/actualizar_repuesto/${editing.id_repuesto}`,{...form});
    showFlash("ok","Repuesto actualizado");
    await fetchAll();
  };

  const onDelete = async (r) => {
    if (!window.confirm(`¿Eliminar repuesto "${r.nombre}"?`)) return;
    try {
      await axios.put(`${BASE_PATH}/eliminar_repuesto/${r.id_repuesto}`);
      showFlash("ok","Repuesto eliminado");
      await fetchAll();
    } catch (e) {
      console.error(e);
      showFlash("error","No se pudo eliminar");
    }
  };

  // Abrir modal de catálogo
  const onAddCatalog = (repuesto) => {
    setSelectedRepuesto(repuesto);
    setCatalogOpen(true);
  };

  // Guardar en catálogo
  const submitAddCatalog = async ({ id_repuesto, precio, cantidad_disponible, tiempo_entrega }) => {
    await axios.post(`${BASE_PATH}/agregar_repuesto`, {
      id_repuesto,
      precio,
      cantidad_disponible,
      tiempo_entrega,
    });
    showFlash("ok", "Repuesto agregado a tu catálogo");
  };

  return (
    <div className="card-surface card-light">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="m-0">Repuestos</h2>
          <div className="muted text-sm">Gestiona tu catálogo de repuestos</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="search">
            <i className="bi bi-search"/>
            {/* texto negro (reforzado por .card-light) */}
            <input
              style={{ color: "#000" }}
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Buscar por nombre, código o marca…"
            />
          </div>
          <button className="btn" onClick={onAdd}>
            <i className="bi bi-plus-lg me-2"/> Nuevo
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading && <div className="skeleton h-10"/>}
        {error && (
          <div className="alert alert-error">
            <i className="bi bi-exclamation-triangle me-2"/>{error}
          </div>
        )}
        {!loading && !error && !filtered.length && (
          <EmptyState onAdd={onAdd}/>
        )}
        {!loading && !error && !!filtered.length && (
          <TablaRepuestos
            items={filtered}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddCatalog={onAddCatalog}
          />
        )}
      </div>

      <RepuestoModal
        open={modalOpen}
        onClose={()=> setModalOpen(false)}
        onSubmit={editing ? submitUpdate : submitCreate}
        initial={editing}
      />

      <AddToCatalogModal
        open={catalogOpen}
        onClose={()=> setCatalogOpen(false)}
        onSubmit={submitAddCatalog}
        repuesto={selectedRepuesto}
      />

      {flash && (
        <div
          role="status"
          style={{
            position: 'fixed', right: 16, bottom: 16,
            background: flash.type === 'error' ? '#b91c1c' : '#0f766e',
            color: '#fff', padding: '10px 14px', borderRadius: 10,
            boxShadow: '0 10px 25px rgba(0,0,0,.35)', zIndex: 10000, fontWeight: 600,
          }}
        >{flash.text}</div>
      )}
    </div>
  );
}
