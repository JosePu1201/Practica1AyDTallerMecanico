// src/admin/PedidosList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../stiles/admin.css";

// RUTAS (no tocar)
const PED_API  = "/api/pedidos";
const PROV_API = "/api/proveedores";

const cls = (...xs) => xs.filter(Boolean).join(" ");
const currency = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return `Bs. ${x.toFixed(2)}`;
};

// ===================== HOOKS =====================

function usePedidos() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${PED_API}/listar-pedidos`);
      // Backend: { message, pedidos: [...] }
      const list = Array.isArray(data?.pedidos)
        ? data.pedidos
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setRows(list);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar la lista de pedidos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  return { rows, loading, error, refetch: fetchAll, setRows };
}

// Para armar el combo de proveedores desde el catálogo global
function useProveedoresDesdeCatalogos() {
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${PROV_API}/listar_catalogos`);
      const cat = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
      const map = new Map();
      cat.forEach((it) => {
        const idp = it.id_proveedor;
        const name = it?.Proveedor?.Usuario?.nombre_usuario || "—";
        const nit  = it?.Proveedor?.nit || "—";
        if (!map.has(idp)) map.set(idp, { id_proveedor: idp, nombre: name, nit });
      });
      setProveedores(Array.from(map.values()));
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar proveedores.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  return { proveedores, loading, error, refetch: fetchAll };
}

function useCatalogoProveedor(id_proveedor) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(!!id_proveedor);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    if (!id_proveedor) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(
        `${PROV_API}/listar_catalogos_proveedor_by_id_proveedor/${id_proveedor}`
      );
      setRows(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el catálogo del proveedor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id_proveedor]);
  return { rows, loading, error, refetch: fetchAll };
}

function useDetallesPedido(id_pedido) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(!!id_pedido);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    if (!id_pedido) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${PED_API}/detalle-pedido/${id_pedido}`);
      // Backend típico: { detallePedido: [...] }
      let list = [];
      if (Array.isArray(data?.detallePedido)) list = data.detallePedido;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data)) list = data;
      setRows(list);
    } catch (e) {
      console.error(e);
      setError("No se pudo obtener el detalle del pedido.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id_pedido]);
  return { rows, loading, error, refetch: fetchAll, setRows };
}

// ===================== MODAL PAGO =====================

function PagoModal({ open, onClose, onSubmit, pedido }) {
  const [metodo_pago, setMetodo] = useState("");
  const [referencia, setRef] = useState("");
  const [observaciones, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (open) {
      setMetodo("");
      setRef("");
      setObs("");
      setSaving(false);
      setErr(null);
    }
  }, [open]);

  const guardar = async () => {
    if (!metodo_pago) { setErr("Selecciona un método de pago"); return; }
    try {
      setSaving(true);
      await onSubmit({ metodo_pago, referencia, observaciones });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal open" onClick={(e)=>{ if (e.target.classList.contains("modal")) onClose(); }}>
      <div className="modal-card" role="dialog" aria-modal="true">
        <h3 className="text-xl font-semibold mb-2">Realizar pago</h3>
        <div className="muted" style={{ marginBottom: 10 }}>
          Pedido <strong>#{pedido?.id_pedido}</strong> · Total <strong>{currency(pedido?.total ?? 0)}</strong>
        </div>

        <label className="label">Método de pago *</label>
        <select className={cls("input", err && !metodo_pago && "input-error")} value={metodo_pago} onChange={(e)=>setMetodo(e.target.value)}>
          <option value="">Selecciona…</option>
          <option value="EFECTIVO">Efectivo</option>
          <option value="TRANSFERENCIA">Transferencia</option>
          <option value="TARJETA">Tarjeta</option>
          <option value="OTRO">Otro</option>
        </select>

        <label className="label" style={{ marginTop: 8 }}>Referencia</label>
        <input className="input" value={referencia} onChange={(e)=>setRef(e.target.value)} placeholder="Nº de operación o referencia" />

        <label className="label" style={{ marginTop: 8 }}>Observaciones</label>
        <textarea className="textarea" rows={4} value={observaciones} onChange={(e)=>setObs(e.target.value)} placeholder="Notas del pago…" />

        {err && <div className="alert alert-error" style={{ marginTop: 10 }}>
          <i className="bi bi-exclamation-triangle me-2" /> {err}
        </div>}

        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn" onClick={guardar} disabled={saving}>{saving ? "Procesando…" : "Pagar"}</button>
        </div>
      </div>
    </div>
  );
}

// ===================== COMPONENTE =====================

export default function PedidosList() {
  const { rows: pedidos, loading, error, refetch } = usePedidos();
  const { proveedores } = useProveedoresDesdeCatalogos();

  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return pedidos;
    return pedidos.filter((p) =>
      [
        p?.numero_pedido,
        p?.estado,
        p?.observaciones,
        String(p?.id_pedido),
        String(p?.id_proveedor),
        p?.Proveedor?.nit
      ]
        .join(" \u200b ")
        .toLowerCase()
        .includes(term)
    );
  }, [q, pedidos]);

  // Vistas: listado, detalle EXISTENTE, crear_form (nuevo pedido), crear_detalle (detalle del nuevo), detalle_ro (solo ver)
  const [mode, setMode] = useState("list"); // "list" | "detalle" | "crear_form" | "crear_detalle" | "detalle_ro"
  const [pedidoSel, setPedidoSel] = useState(null); // objeto pedido seleccionado (para detalle existente)

  // ------ CREAR PEDIDO ------
  const [provSelId, setProvSelId]     = useState(null);
  const [provSelName, setProvSelName] = useState(null);
  const [provSelNit, setProvSelNit]   = useState(null);
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [pedidoNuevoId, setPedidoNuevoId] = useState(null);

  // ------ DETALLE (sirve para detalle existente y detalle nuevo) ------
  const idPedidoActivo = mode === "detalle" ? (pedidoSel?.id_pedido ?? null) : mode === "detalle_ro" ? (pedidoSel?.id_pedido ?? null) : pedidoNuevoId;
  const idProveedorActivo = mode === "detalle" ? (pedidoSel?.id_proveedor ?? null) : mode === "detalle_ro" ? (pedidoSel?.id_proveedor ?? null) : provSelId;

  const {
    rows: catProv,
    loading: loadingProv,
    error: errorProv,
    refetch: refetchProv,
  } = useCatalogoProveedor(idProveedorActivo);

  const {
    rows: detalles,
    loading: loadingDet,
    error: errorDet,
    refetch: refetchDet,
    setRows: setDetallesRows,
  } = useDetallesPedido(idPedidoActivo);

  // Flash
  const [flash, setFlash] = useState(null);
  const showFlash = (type, text, ms = 2200) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), ms);
  };

  // ---- Acciones listado ----
  const verDetalle = (pedido) => {
    // Si el pedido está PAGADO o CONFIRMADO -> solo lectura
    const st = String(pedido?.estado || "").toUpperCase();
    setPedidoSel(pedido);
    if (st === "ENTREGADO" || st === "CONFIRMADO"||st==='EN_TRANSITO') setMode("detalle_ro");
    else setMode("detalle");
  };

  // ---- Acciones para crear pedido ----
  const abrirCrearPedido = () => {
    setProvSelId(null);
    setProvSelName(null);
    setProvSelNit(null);
    setFechaEntrega("");
    setObs("");
    setPedidoNuevoId(null);
    setMode("crear_form");
  };

  const crearPedido = async () => {
    if (!provSelId) return showFlash("error","Selecciona un proveedor.");
    if (!fechaEntrega) return showFlash("error","Ingresa la fecha de entrega solicitada.");
    try {
      setSaving(true);
      let resp;
      try {
        resp = await axios.post(`${PED_API}/crear-pedido`, {
          id_proveedor: provSelId,
          fecha_entrega_solicitada: fechaEntrega,
          observaciones: obs,
        });
      } catch {
        resp = await axios.post(`${PED_API}/crear`, {
          id_proveedor: provSelId,
          fecha_entrega_solicitada: fechaEntrega,
          observaciones: obs,
        });
      }
      const body = resp?.data || {};
      const id = body?.pedido?.id_pedido ?? body?.data?.id_pedido ?? body?.id_pedido ?? body?.data?.id ?? body?.id;
      if (!id) {
        showFlash("error","Se creó el pedido pero no recibí el id_pedido.");
        return;
      }
      setPedidoNuevoId(id);
      showFlash("ok","Pedido creado. Ahora agrega el detalle.");
      setMode("crear_detalle");
      await refetch(); // refresca listado
      await refetchProv();
      await refetchDet();
    } catch (e) {
      console.error(e);
      showFlash("error","No se pudo crear el pedido.");
    } finally {
      setSaving(false);
    }
  };

  // ---- Agregar / actualizar detalle (para ambos modos de detalle) ----
  const [qProv, setQProv] = useState("");
  const filteredProv = useMemo(() => {
    const term = qProv.trim().toLowerCase();
    if (!term) return catProv;
    return catProv.filter((it) =>
      [it?.Repuesto?.nombre, it?.Repuesto?.descripcion, it?.Repuesto?.marca_compatible]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [qProv, catProv]);

  const [qtyMap, setQtyMap] = useState({}); // id_catalogo -> cantidad
  const [adding, setAdding] = useState({}); // id_catalogo -> loading
  const setQty = (idc, val) => setQtyMap((prev) => ({ ...prev, [idc]: val }));

  const normalizeDetalleCreado = (raw) => {
    if (!raw || typeof raw !== "object") return null;
    return {
      id_detalle_pedido: raw.id_detalle_pedido ?? raw.id ?? null,
      id_pedido: raw.id_pedido,
      id_catalogo: raw.id_catalogo,
      cantidad: Number(raw.cantidad),
      precio_unitario: raw.precio_unitario,
      subtotal: raw.subtotal,
    };
  };

  const agregarDetalle = async (id_catalogo) => {
    const idPedido = idPedidoActivo;
    if (!idPedido) return showFlash("error", "No hay pedido activo.");
    if (adding[id_catalogo]) return;
    const cantidad = Number(qtyMap[id_catalogo] ?? 1);
    if (!cantidad || cantidad <= 0) return showFlash("error", "Cantidad inválida.");

    try {
      setAdding((p) => ({ ...p, [id_catalogo]: true }));
      const resp = await axios.post(`${PED_API}/crear-detalle-pedido`, {
        id_pedido: idPedido,
        id_catalogo,
        cantidad,
      });
      const raw = resp?.data?.data ?? resp?.data?.detallePedido ?? resp?.data ?? null;
      const item = normalizeDetalleCreado(raw);
      if (item) {
        setDetallesRows((prev) => {
          const a = Array.isArray(prev) ? prev.slice() : [];
          const i = a.findIndex((x) => x.id_detalle_pedido === item.id_detalle_pedido);
          if (i >= 0) a[i] = { ...a[i], ...item };
          else a.unshift(item);
          return a;
        });
      }

      showFlash("ok", "Detalle agregado.");
      setQtyMap((p) => ({ ...p, [id_catalogo]: "" }));
      await refetchDet();   // sincroniza la tabla de detalles
      await refetchProv();  // sincroniza catálogo (stock)
    } catch (e) {
      console.error(e);
      showFlash("error", "No se pudo agregar el detalle.");
    } finally {
      setAdding((p) => ({ ...p, [id_catalogo]: false }));
    }
  };

  const [editQty, setEditQty] = useState({}); // id_detalle_pedido -> nueva cantidad
  const actualizarDetalle = async (detalle) => {
    const id = detalle?.id_detalle_pedido ?? detalle?.id;
    if (!id) return;
    const nuevaCant = Number(editQty[id] ?? detalle.cantidad);
    if (!nuevaCant || nuevaCant <= 0) return showFlash("error", "Cantidad inválida.");

    try {
      await axios.put(`${PED_API}/actualizar-detalle-pedido/${id}`, { cantidad: nuevaCant });
      showFlash("ok", "Detalle actualizado.");
      setDetallesRows((prev) =>
        prev.map((d) => {
          const did = d?.id_detalle_pedido ?? d?.id;
          return did === id ? { ...d, cantidad: nuevaCant } : d;
        })
      );
      await refetchDet();   // refresca detalles
      await refetchProv();  // refresca catálogo
    } catch (e) {
      console.error(e);
      showFlash("error", "No se pudo actualizar el detalle.");
    }
  };

  const volverLista = () => {
    setMode("list");
    setPedidoSel(null);
    setPedidoNuevoId(null);
    setQtyMap({});
    setEditQty({});
  };

  // ===================== PAGO =====================

  const [pagoOpen, setPagoOpen] = useState(false);
  const [pedidoPagoSel, setPedidoPagoSel] = useState(null);

  const openPago = (pedido) => {
    setPedidoPagoSel(pedido);
    setPagoOpen(true);
  };

  const submitPago = async ({ metodo_pago, observaciones, referencia }) => {
    if (!pedidoPagoSel?.id_pedido) return;
    await axios.post(`${PED_API}/realizar-pago/${pedidoPagoSel.id_pedido}`, {
      metodo_pago,
      observaciones,
      referencia,
    });
    showFlash("ok", "Pago registrado correctamente.");
    await refetch(); // refresca listado (estado puede pasar a PAGADO)
  };

  // ===================== RENDER =====================

  return (
    <div className="card-surface card-light">
      {/* LISTA DE PEDIDOS */}
      {mode === "list" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Pedidos a proveedores</h2>
              <div className="muted text-sm">Listado de pedidos (solo datos del pedido)</div>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-pedido" onClick={abrirCrearPedido}>
                <i className="bi bi-plus-circle me-2" />
                Agregar pedido
              </button>
              <button className="btn-ghost" onClick={refetch}>
                <i className="bi bi-arrow-clockwise me-2" />
                Actualizar
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="table-toolbar">
              <div className="search">
                <i className="bi bi-search" />
                <input
                  style={{ color: "#000" }}
                  placeholder="Buscar por número, estado, NIT, id…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
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
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Número</th>
                      <th>Proveedor</th>
                      <th>Total</th>
                      <th>Fecha pedido</th>
                      <th>Fecha solicitada</th>
                      <th>Estado</th>
                      <th style={{ width: 220 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!filtered?.length && (
                      <tr>
                        <td colSpan={8} className="empty">
                          No hay pedidos
                        </td>
                      </tr>
                    )}
                    {filtered?.map((p) => {
                      const st = String(p?.estado || "").toUpperCase();
                      const isReadOnly = st === "PAGADO" || st === "CONFIRMADO";
                      return (
                        <tr key={p.id_pedido}>
                          <td className="mono">{p.id_pedido}</td>
                          <td>{p.numero_pedido || "—"}</td>
                          <td>
                            <div className="font-semibold">Prov #{p.id_proveedor}</div>
                            <div className="muted text-sm">NIT: {p?.Proveedor?.nit ?? "—"}</div>
                          </td>
                          <td className="mono">{currency(p.total)}</td>
                          <td className="mono">
                            {p.fecha_pedido ? new Date(p.fecha_pedido).toLocaleDateString() : "—"}
                          </td>
                          <td className="mono">
                            {p.fecha_entrega_solicitada
                              ? new Date(p.fecha_entrega_solicitada).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <span className={cls("pill", `state-${(p.estado || "").toLowerCase()}`)}>
                              {p.estado || "—"}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-2 flex-wrap">
                              <button className="btn-pedido" onClick={() => verDetalle(p)}>
                                <i className="bi bi-eye me-1" />
                                {isReadOnly ? "Ver detalle" : "Ver detalle"}
                              </button>
                              {/* Realizar pago visible si NO está PAGADO; puedes limitarlo a CONFIRMADO/PENDIENTE */}
                              {(st == "PENDIENTE") && (
                                <button className="btn" onClick={() => openPago(p)}>
                                  <i className="bi bi-cash-coin me-1" />
                                  Realizar pago
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="table-tip">
                  <i className="bi bi-info-circle" /> Los pedidos en estado <strong>PAGADO</strong> o{" "}
                  <strong>CONFIRMADO</strong> se abren en modo <strong>solo lectura</strong>.
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* CREAR: FORMULARIO */}
      {mode === "crear_form" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Nuevo pedido</h2>
              <div className="muted text-sm">Selecciona proveedor y completa los datos</div>
            </div>
            <button className="btn-ghost" onClick={volverLista}>
              <i className="bi bi-arrow-left me-2" />
              Volver al listado
            </button>
          </div>

          <div className="pane mt-3" style={{ padding: 16 }}>
            <label className="label">Proveedor</label>
            <select
              className="input"
              value={provSelId || ""}
              onChange={(e) => {
                const id = Number(e.target.value) || null;
                if (!id) { setProvSelId(null); setProvSelName(null); setProvSelNit(null); return; }
                const p = proveedores.find(x => x.id_proveedor === id);
                setProvSelId(id);
                setProvSelName(p?.nombre || null);
                setProvSelNit(p?.nit || null);
              }}
            >
              <option value="">Selecciona proveedor…</option>
              {proveedores.map(p => (
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
              <button className="btn-ghost" onClick={volverLista}>Cancelar</button>
              <button className="btn-pedido" onClick={crearPedido} disabled={saving}>
                <i className="bi bi-arrow-right-circle me-2" />
                {saving ? "Creando…" : "Siguiente"}
              </button>
            </div>

            {provSelId && (
              <div className="alert alert-ok" style={{ marginTop: 12 }}>
                <i className="bi bi-person-badge me-2" />
                Proveedor seleccionado: <strong>{provSelName}</strong> · NIT <strong>{provSelNit}</strong>
              </div>
            )}
          </div>
        </>
      )}

      {/* CREAR: DETALLE DEL NUEVO PEDIDO */}
      {mode === "crear_detalle" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Detalle del nuevo pedido</h2>
              <div className="muted text-sm">
                Pedido <strong>#{pedidoNuevoId}</strong> · Proveedor <strong>{provSelName}</strong> (NIT {provSelNit})
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setMode("crear_form")}>
                <i className="bi bi-arrow-left me-2" />
                Volver al formulario
              </button>
              <button className="btn-pedido" onClick={volverLista}>
                <i className="bi bi-check2-circle me-2" />
                Finalizar
              </button>
            </div>
          </div>

          <div className="split mt-3">
            {/* Catálogo del proveedor */}
            <div>
              <div className="table-toolbar sticky">
                <div className="search">
                  <i className="bi bi-search" />
                  <input
                    style={{ color: "#000" }}
                    placeholder="Buscar en catálogo del proveedor…"
                    value={qProv}
                    onChange={(e) => setQProv(e.target.value)}
                  />
                </div>
              </div>

              {loadingProv && <div className="skeleton h-10" />}
              {errorProv && (
                <div className="alert alert-error">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {errorProv}
                </div>
              )}

              {!loadingProv && !errorProv && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Repuesto</th>
                        <th className="hide-sm">Marca</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th style={{ width: 140 }}>Cant.</th>
                        <th style={{ width: 140 }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!filteredProv?.length && (
                        <tr>
                          <td colSpan={6} className="empty">
                            Este proveedor no tiene catálogo.
                          </td>
                        </tr>
                      )}
                      {filteredProv?.map((it) => {
                        const idc = it.id_catalogo;
                        return (
                          <tr key={idc}>
                            <td>
                              <div className="font-semibold">{it?.Repuesto?.nombre}</div>
                              <div className="muted text-sm">{it?.Repuesto?.descripcion}</div>
                            </td>
                            <td className="hide-sm">{it?.Repuesto?.marca_compatible || "—"}</td>
                            <td className="mono">{currency(it?.precio)}</td>
                            <td className="mono">{it?.cantidad_disponible}</td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                className="input"
                                placeholder="Cant."
                                value={qtyMap[idc] ?? ""}
                                onChange={(e) => setQty(idc, e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                className="btn-pedido"
                                onClick={() => agregarDetalle(idc)}
                                disabled={!!adding[idc]}
                                title={adding[idc] ? "Agregando…" : "Agregar al pedido"}
                              >
                                <i className="bi bi-plus-circle me-1" />
                                {adding[idc] ? "Agregando…" : "Agregar"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="table-tip">
                    <i className="bi bi-info-circle" />
                    Agrega tantos productos como necesites. Se guardan uno por uno.
                  </div>
                </div>
              )}
            </div>

            {/* Detalles del pedido */}
            <div className="pane sticky">
              <div className="pane-head">
                <span className="pill">
                  <i className="bi bi-list-check me-1" />
                  Detalle guardado
                </span>
              </div>

              {loadingDet && <div className="skeleton h-10" />}
              {errorDet && (
                <div className="alert alert-error">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {errorDet}
                </div>
              )}

              {!loadingDet && !errorDet && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID producto</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Subtotal</th>
                        <th style={{ width: 200 }}>Editar cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!detalles?.length && (
                        <tr>
                          <td colSpan={5} className="empty">
                            Aún no hay productos en este pedido.
                          </td>
                        </tr>
                      )}
                      {detalles?.map((d) => {
                        const idDet = d?.id_detalle_pedido ?? d?.id;
                        const idCat = d?.id_catalogo;
                        const cant = Number(d?.cantidad);
                        const pu = d?.precio_unitario;
                        const sub = d?.subtotal;

                        return (
                          <tr key={idDet}>
                            <td className="mono">{idCat}</td>
                            <td className="mono">{cant}</td>
                            <td className="mono">{currency(pu)}</td>
                            <td className="mono">{currency(sub)}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  className="input"
                                  placeholder="Nueva cant."
                                  value={String(editQty[idDet] ?? "")}
                                  onChange={(e) =>
                                    setEditQty((prev) => ({ ...prev, [idDet]: e.target.value }))
                                  }
                                />
                                <button
                                  className="btn-pedido"
                                  onClick={() =>
                                    actualizarDetalle({ ...d, id_detalle_pedido: idDet, cantidad: cant })
                                  }
                                >
                                  <i className="bi bi-arrow-repeat me-1" />
                                  Guardar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="table-tip">
                    <i className="bi bi-info-circle" /> Edita la cantidad y presiona{" "}
                    <strong>Guardar</strong>. Se refresca el detalle y el catálogo.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* DETALLE DE UN PEDIDO EXISTENTE - SOLO LECTURA */}
      {mode === "detalle_ro" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Detalle del pedido (solo lectura)</h2>
              <div className="muted text-sm">
                Pedido <strong>#{pedidoSel?.id_pedido}</strong> · Proveedor{" "}
                <strong>#{pedidoSel?.id_proveedor}</strong> (NIT {pedidoSel?.Proveedor?.nit ?? "—"}) ·
                Nº <strong>{pedidoSel?.numero_pedido ?? "—"}</strong> · Estado{" "}
                <strong>{pedidoSel?.estado ?? "—"}</strong>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={volverLista}>
                <i className="bi bi-arrow-left me-2" />
                Volver a pedidos
              </button>
            </div>
          </div>

          <div className="pane mt-3" style={{ padding: 16 }}>
            {loadingDet && <div className="skeleton h-10" />}
            {errorDet && (
              <div className="alert alert-error">
                <i className="bi bi-exclamation-triangle me-2" />
                {errorDet}
              </div>
            )}
            {!loadingDet && !errorDet && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID producto</th>
                      <th>Cantidad</th>
                      <th>Precio unitario</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!detalles?.length && (
                      <tr>
                        <td colSpan={4} className="empty">Este pedido no tiene productos.</td>
                      </tr>
                    )}
                    {detalles?.map((d) => (
                      <tr key={d.id_detalle_pedido ?? d.id}>
                        <td className="mono">{d?.id_catalogo}</td>
                        <td className="mono">{d?.cantidad}</td>
                        <td className="mono">{currency(d?.precio_unitario)}</td>
                        <td className="mono">{currency(d?.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-tip">
                  <i className="bi bi-info-circle" /> Vista informativa sin acciones.
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* DETALLE DE UN PEDIDO EXISTENTE (editable) */}
      {mode === "detalle" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Detalle del pedido</h2>
              <div className="muted text-sm">
                Pedido <strong>#{pedidoSel?.id_pedido}</strong> · Proveedor{" "}
                <strong>#{pedidoSel?.id_proveedor}</strong> (NIT {pedidoSel?.Proveedor?.nit ?? "—"}) ·
                Nº <strong>{pedidoSel?.numero_pedido ?? "—"}</strong> · Estado{" "}
                <strong>{pedidoSel?.estado ?? "—"}</strong>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={volverLista}>
                <i className="bi bi-arrow-left me-2" />
                Volver a pedidos
              </button>
            </div>
          </div>

          <div className="split mt-3">
            {/* Catálogo del proveedor */}
            <div>
              <div className="table-toolbar sticky">
                <div className="search">
                  <i className="bi bi-search" />
                  <input
                    style={{ color: "#000" }}
                    placeholder="Buscar en catálogo del proveedor…"
                    value={qProv}
                    onChange={(e) => setQProv(e.target.value)}
                  />
                </div>
              </div>

              {loadingProv && <div className="skeleton h-10" />}
              {errorProv && (
                <div className="alert alert-error">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {errorProv}
                </div>
              )}

              {!loadingProv && !errorProv && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Repuesto</th>
                        <th className="hide-sm">Marca</th>
                        <th>Precio</th>
                        <th>Stock</th>
                        <th style={{ width: 140 }}>Cant.</th>
                        <th style={{ width: 140 }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!filteredProv?.length && (
                        <tr>
                          <td colSpan={6} className="empty">
                            Este proveedor no tiene catálogo.
                          </td>
                        </tr>
                      )}
                      {filteredProv?.map((it) => {
                        const idc = it.id_catalogo;
                        return (
                          <tr key={idc}>
                            <td>
                              <div className="font-semibold">{it?.Repuesto?.nombre}</div>
                              <div className="muted text-sm">{it?.Repuesto?.descripcion}</div>
                            </td>
                            <td className="hide-sm">{it?.Repuesto?.marca_compatible || "—"}</td>
                            <td className="mono">{currency(it?.precio)}</td>
                            <td className="mono">{it?.cantidad_disponible}</td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                className="input"
                                placeholder="Cant."
                                value={qtyMap[idc] ?? ""}
                                onChange={(e) => setQty(idc, e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                className="btn-pedido"
                                onClick={() => agregarDetalle(idc)}
                                disabled={!!adding[idc]}
                                title={adding[idc] ? "Agregando…" : "Agregar al pedido"}
                              >
                                <i className="bi bi-plus-circle me-1" />
                                {adding[idc] ? "Agregando…" : "Agregar"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="table-tip">
                    <i className="bi bi-info-circle" />
                    Agrega tantos productos como necesites. Se guardan uno por uno.
                  </div>
                </div>
              )}
            </div>

            {/* Detalles del pedido */}
            <div className="pane sticky">
              <div className="pane-head">
                <span className="pill">
                  <i className="bi bi-list-check me-1" />
                  Detalle guardado
                </span>
              </div>

              {loadingDet && <div className="skeleton h-10" />}
              {errorDet && (
                <div className="alert alert-error">
                  <i className="bi bi-exclamation-triangle me-2" />
                  {errorDet}
                </div>
              )}

              {!loadingDet && !errorDet && (
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID producto</th>
                        <th>Cantidad</th>
                        <th>Precio unitario</th>
                        <th>Subtotal</th>
                        <th style={{ width: 200 }}>Editar cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!detalles?.length && (
                        <tr>
                          <td colSpan={5} className="empty">
                            Aún no hay productos en este pedido.
                          </td>
                        </tr>
                      )}
                      {detalles?.map((d) => {
                        const idDet = d?.id_detalle_pedido ?? d?.id;
                        const idCat = d?.id_catalogo;
                        const cant = Number(d?.cantidad);
                        const pu = d?.precio_unitario;
                        const sub = d?.subtotal;

                        return (
                          <tr key={idDet}>
                            <td className="mono">{idCat}</td>
                            <td className="mono">{cant}</td>
                            <td className="mono">{currency(pu)}</td>
                            <td className="mono">{currency(sub)}</td>
                            <td>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  className="input"
                                  placeholder="Nueva cant."
                                  value={String(editQty[idDet] ?? "")}
                                  onChange={(e) =>
                                    setEditQty((prev) => ({ ...prev, [idDet]: e.target.value }))
                                  }
                                />
                                <button
                                  className="btn-pedido"
                                  onClick={() =>
                                    actualizarDetalle({ ...d, id_detalle_pedido: idDet, cantidad: cant })
                                  }
                                >
                                  <i className="bi bi-arrow-repeat me-1" />
                                  Guardar
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <div className="table-tip">
                    <i className="bi bi-info-circle" /> Edita la cantidad y presiona{" "}
                    <strong>Guardar</strong>. Se refresca el detalle y el catálogo.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL DE PAGO */}
      <PagoModal
        open={pagoOpen}
        onClose={()=>setPagoOpen(false)}
        onSubmit={submitPago}
        pedido={pedidoPagoSel}
      />

      {/* Flash */}
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
