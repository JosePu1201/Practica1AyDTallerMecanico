// src/proveedor/MiCatalogo.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../stiles/proveedor.css";

const BASE_PATH = "/api/proveedores";

const cls = (...xs) => xs.filter(Boolean).join(" ");
const required = (s) => (s ?? "").toString().trim().length > 0;

function useProveedorId() {
  const [idProveedor, setIdProveedor] = useState(null);
  useEffect(() => {
    const raw = localStorage.getItem("user");
    try {
      const u = raw ? JSON.parse(raw) : null;
      setIdProveedor(u?.id_usuario ?? null); // en tu backend mapeas a id_proveedor
    } catch {
      setIdProveedor(null);
    }
  }, []);
  return idProveedor;
}

/* ========== Modales ========== */

// Agregar a mi catálogo (con combo de repuestos)
function AddToCatalogSelectModal({ open, onClose, onSubmit, repuestos }) {
  const [form, setForm] = useState({
    id_repuesto: "",
    precio: "",
    cantidad_disponible: "",
    tiempo_entrega: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        id_repuesto: "",
        precio: "",
        cantidad_disponible: "",
        tiempo_entrega: "",
      });
      setErrors({});
      setSaving(false);
    }
  }, [open]);

  const validate = () => {
    const e = {};
    if (!required(form.id_repuesto)) e.id_repuesto = "Selecciona un repuesto";
    if (!required(form.precio) || Number(form.precio) <= 0) e.precio = "Precio inválido";
    if (!required(form.cantidad_disponible) || Number(form.cantidad_disponible) < 0) e.cantidad_disponible = "Cantidad inválida";
    if (!required(form.tiempo_entrega)) e.tiempo_entrega = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await onSubmit({
        id_repuesto: Number(form.id_repuesto),
        precio: Number(form.precio),
        cantidad_disponible: Number(form.cantidad_disponible),
        tiempo_entrega: form.tiempo_entrega,
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
        <h3 className="text-xl font-semibold mb-2">Agregar al catálogo</h3>

        <label className="label">Repuesto *</label>
        <select
          className={cls("input", errors.id_repuesto && "input-error")}
          value={form.id_repuesto}
          onChange={(e)=>setForm(v=>({ ...v, id_repuesto: e.target.value }))}
        >
          <option value="">Selecciona un repuesto…</option>
          {repuestos?.map(r => (
            <option key={r.id_repuesto} value={r.id_repuesto}>
              {r.nombre} {r.codigo_parte ? `(${r.codigo_parte})` : ""} — {r.marca_compatible || "—"}
            </option>
          ))}
        </select>
        {errors.id_repuesto && <small className="err">{errors.id_repuesto}</small>}

        <label className="label">Precio *</label>
        <input
          type="number" min="0" step="0.01"
          className={cls("input", errors.precio && "input-error")}
          value={form.precio}
          onChange={(e)=>setForm(v=>({ ...v, precio: e.target.value }))}
          placeholder="0.00"
        />
        {errors.precio && <small className="err">{errors.precio}</small>}

        <label className="label">Cantidad disponible *</label>
        <input
          type="number" min="0" step="1"
          className={cls("input", errors.cantidad_disponible && "input-error")}
          value={form.cantidad_disponible}
          onChange={(e)=>setForm(v=>({ ...v, cantidad_disponible: e.target.value }))}
          placeholder="0"
        />
        {errors.cantidad_disponible && <small className="err">{errors.cantidad_disponible}</small>}

        <label className="label">Tiempo de entrega *</label>
        <input
          className={cls("input", errors.tiempo_entrega && "input-error")}
          value={form.tiempo_entrega}
          onChange={(e)=>setForm(v=>({ ...v, tiempo_entrega: e.target.value }))}
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

// Agregar cantidad a un item ya en catálogo
function AddQtyModal({ open, onClose, onSubmit, item }) {
  const [cantidad, setCantidad] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setCantidad("");
      setSaving(false);
      setErr(null);
    }
  }, [open]);

  const submit = async () => {
    const n = Number(cantidad);
    if (Number.isNaN(n) || n <= 0) {
      setErr("Ingresa un número mayor a 0");
      return;
    }
    try {
      setSaving(true);
      await onSubmit({ id_catalogo: item.id_catalogo, add: n, current: item.cantidad_disponible });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal open" onClick={(e)=>{ if (e.target.classList.contains("modal")) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <h3 className="text-xl font-semibold mb-2">Agregar cantidad</h3>
        <div className="muted" style={{marginBottom:8}}>
          {item?.Repuesto?.nombre} — stock actual: <strong>{item?.cantidad_disponible ?? 0}</strong>
        </div>
        <label className="label">Cantidad a agregar *</label>
        <input
          type="number" min="1" step="1"
          className={cls("input", err && "input-error")}
          value={cantidad}
          onChange={(e)=>setCantidad(e.target.value)}
          placeholder="0"
        />
        {err && <small className="err">{err}</small>}
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

// EDITAR un item de catálogo (precio, cantidad, tiempo_entrega)
function EditCatalogModal({ open, onClose, onSubmit, item }) {
  const [form, setForm] = useState({
    precio: "",
    cantidad_disponible: "",
    tiempo_entrega: "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && item) {
      setForm({
        precio: String(item?.precio ?? ""),
        cantidad_disponible: String(item?.cantidad_disponible ?? ""),
        tiempo_entrega: String(item?.tiempo_entrega ?? ""),
      });
      setErrors({});
      setSaving(false);
    }
  }, [open, item]);

  const validate = () => {
    const e = {};
    if (!required(form.precio) || Number(form.precio) < 0) e.precio = "Precio inválido";
    if (!required(form.cantidad_disponible) || Number(form.cantidad_disponible) < 0) e.cantidad_disponible = "Cantidad inválida";
    if (!required(form.tiempo_entrega)) e.tiempo_entrega = "Requerido";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      setSaving(true);
      await onSubmit({
        id_catalogo: item.id_catalogo,
        precio: Number(form.precio),
        cantidad_disponible: Number(form.cantidad_disponible),
        tiempo_entrega: form.tiempo_entrega,
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
        <h3 className="text-xl font-semibold mb-2">Editar catálogo</h3>

        <div className="muted" style={{ marginBottom: 8 }}>
          {item?.Repuesto?.nombre ?? "Repuesto"} (ID catálogo #{item?.id_catalogo})
        </div>

        <label className="label">Precio *</label>
        <input
          type="number" min="0" step="0.01"
          className={cls("input", errors.precio && "input-error")}
          value={form.precio}
          onChange={(e)=>setForm(v=>({ ...v, precio: e.target.value }))}
          placeholder="0.00"
        />
        {errors.precio && <small className="err">{errors.precio}</small>}

        <label className="label">Cantidad disponible *</label>
        <input
          type="number" min="0" step="1"
          className={cls("input", errors.cantidad_disponible && "input-error")}
          value={form.cantidad_disponible}
          onChange={(e)=>setForm(v=>({ ...v, cantidad_disponible: e.target.value }))}
          placeholder="0"
        />
        {errors.cantidad_disponible && <small className="err">{errors.cantidad_disponible}</small>}

        <label className="label">Tiempo de entrega *</label>
        <input
          className={cls("input", errors.tiempo_entrega && "input-error")}
          value={form.tiempo_entrega}
          onChange={(e)=>setForm(v=>({ ...v, tiempo_entrega: e.target.value }))}
          placeholder="Ej. 2-3 días hábiles"
        />
        {errors.tiempo_entrega && <small className="err">{errors.tiempo_entrega}</small>}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={submit} disabled={saving}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========== Tabla ========== */

function TablaCatalogo({ items, onAddQty, onEdit }) {
  if (!items?.length) return null;
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Repuesto</th>
            <th className="hide-sm">Marca</th>
            <th>Precio</th>
            <th>Cantidad</th>
            <th className="hide-sm">Entrega</th>
            <th className="actions-col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {items.map(it => (
            <tr key={it.id_catalogo}>
              <td>
                <div className="font-semibold">{it.Repuesto?.nombre}</div>
                <div className="muted text-sm" title={it.Repuesto?.descripcion}>{it.Repuesto?.descripcion}</div>
              </td>
              <td className="hide-sm">{it.Repuesto?.marca_compatible || "—"}</td>
              <td className="mono">Q. {Number(it.precio).toFixed(2)}</td>
              <td className="mono">{it.cantidad_disponible}</td>
              <td className="hide-sm">{it.tiempo_entrega || "—"}</td>
              <td className="actions-col">
                <div className="flex">
                  <button className="icon-btn" title="Editar" onClick={()=>onEdit(it)}>
                    <i className="bi bi-pencil-square" />
                  </button>
                  <button className="icon-btn" title="Agregar cantidad" onClick={()=>onAddQty(it)}>
                    <i className="bi bi-plus-circle" />
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

/* ========== Vista principal ========== */

export default function MiCatalogo() {
  const idProveedor = useProveedorId();

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rows, setRows] = useState([]);

  // para combo de “Agregar”
  const [repuestos, setRepuestos] = useState([]);
  const [addOpen, setAddOpen] = useState(false);

  // para “Agregar cantidad”
  const [qtyOpen, setQtyOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // para “Editar”
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const [flash, setFlash] = useState(null);
  const showFlash = (type, text, ms=2200) => {
    setFlash({ type, text });
    setTimeout(()=> setFlash(null), ms);
  };

  const fetchCatalogo = async () => {
    if (!idProveedor) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE_PATH}/listar_catalogos_proveedor/${idProveedor}`);
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  };

  const fetchRepuestosForCombo = async () => {
    if (!idProveedor) return;
    try {
      const { data } = await axios.get(`${BASE_PATH}/listar_repuestos/${idProveedor}`);
      setRepuestos(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setRepuestos([]);
    }
  };

  useEffect(() => { fetchCatalogo(); /* eslint-disable-next-line */ }, [idProveedor]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(it =>
      [
        it.Repuesto?.nombre,
        it.Repuesto?.descripcion,
        it.Repuesto?.marca_compatible,
      ]
        .join(" \u200b ")
        .toLowerCase()
        .includes(term)
    );
  }, [q, rows]);

  // Abrir modal “Agregar”
  const onOpenAdd = async () => {
    await fetchRepuestosForCombo();
    setAddOpen(true);
  };

  // POST agregar_repuesto
  const submitAdd = async ({ id_repuesto, precio, cantidad_disponible, tiempo_entrega }) => {
    await axios.post(`${BASE_PATH}/agregar_repuesto`, {
      id_repuesto,
      precio,
      cantidad_disponible,
      tiempo_entrega,
    });
    showFlash("ok", "Repuesto agregado al catálogo");
    await fetchCatalogo();
  };

  // Abrir modal “Agregar cantidad”
  const onAddQty = (item) => {
    setSelectedItem(item);
    setQtyOpen(true);
  };

  // PUT actualizar cantidad (suma a stock actual)
  const submitAddQty = async ({ id_catalogo, add, current }) => {
    const cantidad_disponible = Number(current) + Number(add);
    await axios.put(`${BASE_PATH}/actualizar_catalogo/${id_catalogo}`, { cantidad_disponible });
    showFlash("ok", "Cantidad actualizada");
    await fetchCatalogo();
  };

  // Abrir modal “Editar”
  const onEdit = (item) => {
    setEditItem(item);
    setEditOpen(true);
  };

  // PUT actualizar catálogo (precio, cantidad_disponible, tiempo_entrega)
  const submitEdit = async ({ id_catalogo, precio, cantidad_disponible, tiempo_entrega }) => {
    await axios.put(`${BASE_PATH}/actualizar_catalogo/${id_catalogo}`, {
      precio,
      cantidad_disponible,
      tiempo_entrega,
    });
    showFlash("ok", "Catálogo actualizado");
    await fetchCatalogo();
  };

  return (
    <div className="card-surface card-light">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="m-0">Mi catálogo</h2>
          <div className="muted text-sm">Gestiona tus productos y stock</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="search">
            <i className="bi bi-search"/>
            <input
              style={{ color: "#000" }}
              value={q}
              onChange={(e)=>setQ(e.target.value)}
              placeholder="Buscar por nombre o marca…"
            />
          </div>
          <button className="btn" onClick={onOpenAdd}>
            <i className="bi bi-plus-lg me-2" /> Agregar
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading && <div className="skeleton h-10" />}
        {error && (
          <div className="alert alert-error">
            <i className="bi bi-exclamation-triangle me-2" />
            {error}
          </div>
        )}
        {!loading && !error && !filtered.length && (
          <div className="p-8 text-center border-2 border-dashed rounded-2xl">
            <div className="text-2xl font-semibold">Tu catálogo está vacío</div>
            <p className="mt-2 text-sm opacity-75">
              Usa el botón <strong>Agregar</strong> para incorporar repuestos.
            </p>
          </div>
        )}
        {!loading && !error && !!filtered.length && (
          <TablaCatalogo items={filtered} onAddQty={onAddQty} onEdit={onEdit} />
        )}
      </div>

      <AddToCatalogSelectModal
        open={addOpen}
        onClose={()=> setAddOpen(false)}
        onSubmit={submitAdd}
        repuestos={repuestos}
      />

      <AddQtyModal
        open={qtyOpen}
        onClose={()=> setQtyOpen(false)}
        onSubmit={submitAddQty}
        item={selectedItem}
      />

      <EditCatalogModal
        open={editOpen}
        onClose={()=> setEditOpen(false)}
        onSubmit={submitEdit}
        item={editItem}
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
