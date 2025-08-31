// src/admin/ProductosList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../stiles/admin.css"; // usa el CSS completo pegado arriba

const BASE_PATH   = "/api/proveedores"; // GET /listar_catalogos
const PEDIDOS_API = "/api/pedidos";     // POST /crear  (ajusta si tu ruta cambia)

const cls = (...xs) => xs.filter(Boolean).join(" ");
const currency = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return `Bs. ${x.toFixed(2)}`;
};

function useCatalogos() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${BASE_PATH}/listar_catalogos`);
      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el catálogo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  return { rows, loading, error, refetch: fetchAll };
}

function TablaCatalogos({ items, onPickProveedor, selectedProveedor }) {
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
            <th>Proveedor</th>
          </tr>
        </thead>
        <tbody>
          {!items?.length && (
            <tr><td colSpan={6} className="empty">No hay datos</td></tr>
          )}

          {items?.map((it) => {
            const provName = it?.Proveedor?.Usuario?.nombre_usuario || "—";
            const provNit  = it?.Proveedor?.nit || "—";
            const isSel = selectedProveedor && selectedProveedor === it.id_proveedor;

            return (
              <tr
                key={it.id_catalogo}
                className={cls("row-select", isSel && "row-selected")}
                onClick={() => onPickProveedor?.(it.id_proveedor, provName, provNit)}
                title="Seleccionar proveedor"
              >
                <td>
                  <div className="font-semibold">{it.Repuesto?.nombre}</div>
                  <div className="muted text-sm" title={it.Repuesto?.descripcion}>
                    {it.Repuesto?.descripcion}
                  </div>
                </td>
                <td className="hide-sm">{it.Repuesto?.marca_compatible || "—"}</td>
                <td className="mono">{currency(it.precio)}</td>
                <td className="mono">{it.cantidad_disponible}</td>
                <td className="hide-sm">{it.tiempo_entrega || "—"}</td>
                <td>
                  <div className="font-semibold">{provName}</div>
                  <div className="muted text-sm">NIT: {provNit}</div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="table-tip">
        <i className="bi bi-info-circle" />
        Consejo: haz clic en una fila para <strong>seleccionar proveedor</strong>.
      </div>
    </div>
  );
}

export default function ProductosList() {
  const { rows, loading, error } = useCatalogos();
  const [mode, setMode] = useState("list"); // "list" | "pedido"
  const [q, setQ] = useState("");

  // selección de proveedor para el pedido
  const [provSelId, setProvSelId]     = useState(null);
  const [provSelName, setProvSelName] = useState(null);
  const [provSelNit, setProvSelNit]   = useState(null);

  // formulario de pedido
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(null);

  const showFlash = (type, text, ms=2200) => {
    setFlash({ type, text });
    setTimeout(()=> setFlash(null), ms);
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(it =>
      [
        it.Repuesto?.nombre,
        it.Repuesto?.descripcion,
        it.Repuesto?.marca_compatible,
        it?.Proveedor?.Usuario?.nombre_usuario,
        it?.Proveedor?.nit
      ].join(" \u200b ").toLowerCase().includes(term)
    );
  }, [q, rows]);

  const proveedoresUnicos = useMemo(() => {
    const map = new Map();
    rows.forEach(it => {
      const idp = it.id_proveedor;
      const name = it?.Proveedor?.Usuario?.nombre_usuario || "—";
      const nit  = it?.Proveedor?.nit || "—";
      if (!map.has(idp)) map.set(idp, { id_proveedor: idp, nombre: name, nit });
    });
    return Array.from(map.values());
  }, [rows]);

  const onPickProveedor = (id, nombre, nit) => {
    setProvSelId(id);
    setProvSelName(nombre);
    setProvSelNit(nit);
  };

  const goPedido = () => setMode("pedido");
  const cancelarPedido = () => {
    setMode("list");
    setFechaEntrega("");
    setObs("");
  };

  const submitPedido = async () => {
    if (!provSelId) return showFlash("error","Selecciona un proveedor.");
    if (!fechaEntrega) return showFlash("error","Ingresa la fecha de entrega solicitada.");

    try {
      setSaving(true);
      await axios.post(`${PEDIDOS_API}/crear-pedido`, {
        id_proveedor: provSelId,
        fecha_entrega_solicitada: fechaEntrega,
        observaciones: obs
      });
      showFlash("ok","Pedido creado correctamente.");
      setObs("");
      setFechaEntrega("");
    } catch (e) {
      console.error(e);
      showFlash("error","No se pudo crear el pedido.");
    } finally {
      setSaving(false);
    }
  };

  // KPIs del proveedor seleccionado
  const productosProveedor = useMemo(() => (
    provSelId ? rows.filter(r => r.id_proveedor === provSelId) : []
  ), [rows, provSelId]);

  const disponibilidad = productosProveedor.some(p => Number(p.cantidad_disponible) > 0);

  return (
    <div className="card-surface card-light">
      {mode === "list" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Catálogos de proveedores</h2>
              <div className="muted text-sm">Todos los productos publicados por cada proveedor</div>
            </div>
            <button className="btn-pedido" onClick={goPedido}>
              <i className="bi bi-receipt me-2" />
              Realizar un pedido
            </button>
          </div>

          <div className="mt-4">
            {/* 🔍 buscador arriba de la tabla */}
            <div className="table-toolbar">
              <div className="search">
                <i className="bi bi-search" />
                <input
                  style={{ color: "#000" }}
                  placeholder="Buscar por repuesto, marca o proveedor…"
                  value={q}
                  onChange={(e)=>setQ(e.target.value)}
                />
              </div>
            </div>

            {loading && <div className="skeleton h-10" />}
            {error && (
              <div className="alert alert-error">
                <i className="bi bi-exclamation-triangle me-2" />
                {error}
              </div>
            )}
            {!loading && !error && (
              <TablaCatalogos
                items={filtered}
                onPickProveedor={onPickProveedor}
                selectedProveedor={provSelId}
              />
            )}
          </div>
        </>
      )}

      {mode === "pedido" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Realizar pedido</h2>
              <div className="muted text-sm">Haz clic en una fila (izquierda) o usa el combo (derecha).</div>
            </div>
            <button className="btn-ghost" onClick={cancelarPedido}>
              <i className="bi bi-arrow-left me-2" />
              Volver al listado
            </button>
          </div>

          <div className="split mt-3">
            {/* Columna izquierda: tabla + buscador sticky */}
            <div>
              <div className="table-toolbar sticky">
                <div className="search">
                  <i className="bi bi-search" />
                  <input
                    style={{ color: "#000" }}
                    placeholder="Buscar por repuesto, marca o proveedor…"
                    value={q}
                    onChange={(e)=>setQ(e.target.value)}
                  />
                </div>
              </div>

              {loading && <div className="skeleton h-10" />}
              {error && (
                <div className="alert alert-error">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {error}
                </div>
              )}
              {!loading && !error && (
                <TablaCatalogos
                  items={filtered}
                  onPickProveedor={onPickProveedor}
                  selectedProveedor={provSelId}
                />
              )}
            </div>

            {/* Columna derecha: pane oscuro con textos en blanco */}
            <div className="pane sticky">
              <div className="pane-head">
                <span className="pill">
                  <i className="bi bi-shop me-1" />
                  {provSelName ? `${provSelName} · NIT ${provSelNit}` : "Sin proveedor seleccionado"}
                </span>

                <div className="kpis">
                  <div className="kpi">
                    <div className="kpi-value">{productosProveedor.length}</div>
                    <div className="kpi-label">Productos del proveedor</div>
                  </div>
                  <div className="kpi">
                    <div className="kpi-value">{disponibilidad ? "Sí" : "No"}</div>
                    <div className="kpi-label">Disponibilidad</div>
                  </div>
                </div>
              </div>

              {/* Formulario */}
              <label className="label">Proveedor</label>
              <select
                className="input"
                value={provSelId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value) || null;
                  setProvSelId(id);
                  if (id) {
                    const p = proveedoresUnicos.find(x => x.id_proveedor === id);
                    setProvSelName(p?.nombre || null);
                    setProvSelNit(p?.nit || null);
                  } else {
                    setProvSelName(null); setProvSelNit(null);
                  }
                }}
              >
                <option value="">Selecciona proveedor…</option>
                {proveedoresUnicos.map(p => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.nombre} — NIT {p.nit}
                  </option>
                ))}
              </select>

              <div className="grid2" style={{ marginTop: 8 }}>
                <div>
                  <label className="label">Fecha de entrega solicitada</label>
                  <input
                    type="date"
                    value={fechaEntrega}
                    onChange={(e)=>setFechaEntrega(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <i className="bi bi-card-checklist" />
                  <span>Observaciones</span>
                </div>
              </div>

              <label className="label" style={{ marginTop: 6, color:'#000' }}>Notas del pedido</label>
              <textarea
                className="textarea"
                rows={5}
                placeholder="Notas del pedido…"
                value={obs}
                onChange={(e)=>setObs(e.target.value)}
              />

              <div className="actions-row">
                <button className="btn-ghost" onClick={cancelarPedido}>Cancelar</button>
                <button className="btn-pedido" onClick={submitPedido} disabled={saving}>
                  <i className="bi bi-send me-2" />
                  {saving ? "Enviando…" : "Enviar a proveedor"}
                </button>
              </div>
            </div>
          </div>

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
        </>
      )}
    </div>
  );
}
