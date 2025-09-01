// src/admin/ProductosList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../../stiles/admin.css";

const PROV_API   = "/api/proveedores";
const PED_API    = "/api/pedidos";

const cls = (...xs) => xs.filter(Boolean).join(" ");
const currency = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return `Bs. ${Number(x).toFixed(2)}`;
};

// ============ Paso 0: catálogo global (para elegir proveedor) ============
function useCatalogosGlobal() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${PROV_API}/listar_catalogos`);
      setRows(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar el catálogo general.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  return { rows, loading, error, refetch: fetchAll };
}

function TablaCatalogosGlobal({ items, onPickProveedor, selectedProveedor }) {
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

// ============ Paso 3: catálogo por proveedor (para detalle de pedido) ============
function useCatalogoProveedor(id_proveedor) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(!!id_proveedor);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    if (!id_proveedor) return;
    setLoading(true);
    setError(null);
    try {
      // (No tocar rutas)
      const { data } = await axios.get(`${PROV_API}/listar_catalogos_proveedor_by_id_proveedor/${id_proveedor}`);
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

      // Tu backend muestra { detallePedido: [...] }
      let list = [];
      if (Array.isArray(data?.detallePedido)) list = data.detallePedido;
      else if (Array.isArray(data?.data)) list = data.data;
      else if (Array.isArray(data)) list = data;
      else if (Array.isArray(data?.detalles)) list = data.detalles;
      else if (Array.isArray(data?.items)) list = data.items;

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

export default function Catalogos() {
  // modos: list -> form -> detalle
  const [mode, setMode] = useState("list");

  const { rows: catGlobal, loading: loadingGlobal, error: errorGlobal } = useCatalogosGlobal();

  // búsqueda general / por proveedor
  const [q, setQ] = useState("");

  // proveedor seleccionado
  const [provSelId, setProvSelId]     = useState(null);
  const [provSelName, setProvSelName] = useState(null);
  const [provSelNit, setProvSelNit]   = useState(null);

  // Pedido (paso 2)
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [obs, setObs] = useState("");
  const [saving, setSaving] = useState(false);
  const [pedidoId, setPedidoId] = useState(null);

  // Paso 3
  const { rows: catProv, loading: loadingProv, error: errorProv, refetch: refetchProv } = useCatalogoProveedor(provSelId);
  const { rows: detalles, loading: loadingDet, error: errorDet, refetch: refetchDet, setRows: setDetallesRows } = useDetallesPedido(pedidoId);

  // Flash
  const [flash, setFlash] = useState(null);
  const showFlash = (type, text, ms = 2200) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), ms);
  };

  // Filtrado global
  const filteredGlobal = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return catGlobal;
    return catGlobal.filter(it =>
      [
        it.Repuesto?.nombre,
        it.Repuesto?.descripcion,
        it.Repuesto?.marca_compatible,
        it?.Proveedor?.Usuario?.nombre_usuario,
        it?.Proveedor?.nit
      ].join(" \u200b ").toLowerCase().includes(term)
    );
  }, [q, catGlobal]);

  // lista de proveedores únicos (para selector)
  const proveedoresUnicos = useMemo(() => {
    const map = new Map();
    catGlobal.forEach(it => {
      const idp = it.id_proveedor;
      const name = it?.Proveedor?.Usuario?.nombre_usuario || "—";
      const nit  = it?.Proveedor?.nit || "—";
      if (!map.has(idp)) map.set(idp, { id_proveedor: idp, nombre: name, nit });
    });
    return Array.from(map.values());
  }, [catGlobal]);

  const onPickProveedor = (id, nombre, nit) => {
    setProvSelId(id);
    setProvSelName(nombre);
    setProvSelNit(nit);
  };

  // ======== Paso 1: Seleccionar proveedor ========
  const goFormPedido = () => {
    if (!provSelId) return showFlash("error", "Selecciona un proveedor primero.");
    setMode("form");
    setFechaEntrega("");
    setObs("");
    setPedidoId(null);
  };

  // ======== Paso 2: Formulario -> crear pedido ========
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
          observaciones: obs
        });
      } catch {
        resp = await axios.post(`${PED_API}/crear`, {
          id_proveedor: provSelId,
          fecha_entrega_solicitada: fechaEntrega,
          observaciones: obs
        });
      }

      const body = resp?.data || {};
      const id = body?.pedido?.id_pedido ?? body?.data?.id_pedido ?? body?.id_pedido ?? body?.data?.id ?? body?.id;
      if (!id) {
        showFlash("error","Se creó el pedido pero no recibí el id_pedido.");
        return;
      }
      setPedidoId(id);
      showFlash("ok","Pedido creado. Ahora agrega el detalle.");
      setMode("detalle");
      refetchProv();
      refetchDet();
    } catch (e) {
      console.error(e);
      showFlash("error","No se pudo crear el pedido.");
    } finally {
      setSaving(false);
    }
  };

  // ======== Paso 3: Agregar detalle ========
  const [qProv, setQProv] = useState("");
  const filteredProv = useMemo(() => {
    const term = qProv.trim().toLowerCase();
    if (!term) return catProv;
    return catProv.filter(it =>
      [
        it.Repuesto?.nombre,
        it.Repuesto?.descripcion,
        it.Repuesto?.marca_compatible
      ].join(" ").toLowerCase().includes(term)
    );
  }, [qProv, catProv]);

  const [qtyMap, setQtyMap] = useState({}); // id_catalogo -> cantidad
  const setQty = (idc, val) => {
    setQtyMap(prev => ({ ...prev, [idc]: val }));
  };

  const [adding, setAdding] = useState({}); // id_catalogo -> loading btn

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
    if (!pedidoId) return showFlash("error","No hay pedido activo.");
    if (adding[id_catalogo]) return;
    const cantidad = Number(qtyMap[id_catalogo] ?? 1);
    if (!cantidad || cantidad <= 0) return showFlash("error","Cantidad inválida.");

    try {
      setAdding(prev => ({ ...prev, [id_catalogo]: true }));
      const resp = await axios.post(`${PED_API}/crear-detalle-pedido`, {
        id_pedido: pedidoId,
        id_catalogo,
        cantidad
      });

      // Optimista con lo que devuelve tu POST (DetallePedido.create({...}))
      const raw = resp?.data?.data ?? resp?.data?.detallePedido ?? resp?.data ?? null;
      const item = normalizeDetalleCreado(raw);
      if (item) {
        setDetallesRows(prev => {
          const arr = Array.isArray(prev) ? prev.slice() : [];
          const i = arr.findIndex(x => x.id_detalle_pedido === item.id_detalle_pedido);
          if (i >= 0) arr[i] = { ...arr[i], ...item };
          else arr.unshift(item);
          return arr;
        });
      }

      showFlash("ok","Detalle agregado.");
      setQtyMap(prev => ({ ...prev, [id_catalogo]: "" }));

      // Refresco para quedarnos con exactamente lo que tu GET devuelve
      await refetchDet();
      await refetchProv();
    } catch (e) {
      console.error(e);
      showFlash("error","No se pudo agregar el detalle.");
    } finally {
      setAdding(prev => ({ ...prev, [id_catalogo]: false }));
    }
  };

  const [editQty, setEditQty] = useState({}); // id_detalle_pedido -> cantidad edicion
  const actualizarDetalle = async (detalle) => {
    const id = detalle?.id_detalle_pedido ?? detalle?.id_detalle ?? detalle?.id;
    if (!id) return;
    const nuevaCant = Number(editQty[id] ?? detalle.cantidad);
    if (!nuevaCant || nuevaCant <= 0) return showFlash("error","Cantidad inválida.");
    try {
      await axios.put(`${PED_API}/actualizar-detalle-pedido/${id}`, {
        cantidad: nuevaCant
      });
      showFlash("ok","Detalle actualizado.");
      setDetallesRows(prev => prev.map(d => {
        const did = d?.id_detalle_pedido ?? d?.id_detalle ?? d?.id;
        return did === id ? { ...d, cantidad: nuevaCant } : d;
      }));
      await refetchDet();
      await refetchProv();
    } catch (e) {
      console.error(e);
      showFlash("error","No se pudo actualizar el detalle.");
    }
  };

  const volverALista = () => {
    setMode("list");
    setPedidoId(null);
    setFechaEntrega("");
    setObs("");
  };

  return (
    <div className="card-surface card-light">
      {/* ======================== PASO 1: LISTA PARA ELEGIR PROVEEDOR ======================== */}
      {mode === "list" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Catálogos de proveedores</h2>
              <div className="muted text-sm">Selecciona un proveedor para poder realizar un pedido.</div>
            </div>

            <button
              className="btn-pedido"
              onClick={goFormPedido}
              disabled={!provSelId}
              title={provSelId ? "Continuar a realizar pedido" : "Selecciona un proveedor primero"}
            >
              <i className="bi bi-receipt me-2" />
              Realizar un pedido
            </button>
          </div>

          <div className="mt-4">
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
            {provSelId && (
              <div className="alert alert-ok" style={{ marginTop: 12 }}>
                <i className="bi bi-person-badge me-2" />
                Proveedor seleccionado: <strong>{provSelName}</strong> · NIT <strong>{provSelNit}</strong>
              </div>
            )}

            {loadingGlobal && <div className="skeleton h-10" />}
            {errorGlobal && (
              <div className="alert alert-error">
                <i className="bi bi-exclamation-triangle me-2" />
                {errorGlobal}
              </div>
            )}
            {!loadingGlobal && !errorGlobal && (
              <TablaCatalogosGlobal
                items={filteredGlobal}
                onPickProveedor={onPickProveedor}
                selectedProveedor={provSelId}
              />
            )}
          </div>
        </>
      )}

      {/* ======================== PASO 2: FORMULARIO DEL PEDIDO ======================== */}
      {mode === "form" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Realizar pedido</h2>
              <div className="muted text-sm">
                Proveedor: <strong>{provSelName}</strong> · NIT <strong>{provSelNit}</strong>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={volverALista}>
                <i className="bi bi-arrow-left me-2" />
                Volver a seleccionar proveedor
              </button>
            </div>
          </div>

          <div className="pane mt-3" style={{ padding: 16 }}>
            <label className="label">Proveedor</label>
            <select
              className="input"
              value={provSelId || ""}
              onChange={(e) => {
                const id = Number(e.target.value) || null;
                if (id) {
                  const p = proveedoresUnicos.find(x => x.id_proveedor === id);
                  setProvSelId(id);
                  setProvSelName(p?.nombre || null);
                  setProvSelNit(p?.nit || null);
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
              <button className="btn-ghost" onClick={volverALista}>Cancelar</button>
              <button className="btn-pedido" onClick={crearPedido} disabled={saving}>
                <i className="bi bi-arrow-right-circle me-2" />
                {saving ? "Creando…" : "Siguiente"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ======================== PASO 3: DETALLE DEL PEDIDO ======================== */}
      {mode === "detalle" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Detalle del pedido</h2>
              <div className="muted text-sm">
                Pedido <strong>#{pedidoId}</strong> · Proveedor <strong>{provSelName}</strong> (NIT {provSelNit})
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => setMode("form")}>
                <i className="bi bi-arrow-left me-2" />
                Volver al formulario
              </button>
              <button className="btn-pedido" onClick={() => showFlash("ok","Pedido listo. Puedes salir o seguir agregando.")}>
                <i className="bi bi-check2-circle me-2" />
                Finalizar
              </button>
            </div>
          </div>

          <div className="split mt-3">
            {/* Catálogo del proveedor (para agregar) */}
            <div>
              <div className="table-toolbar sticky">
                <div className="search">
                  <i className="bi bi-search" />
                  <input
                    style={{ color: "#000" }}
                    placeholder="Buscar en catálogo del proveedor…"
                    value={qProv}
                    onChange={(e)=>setQProv(e.target.value)}
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
                        <th style={{width: 140}}>Cantidad</th>
                        <th style={{width: 140}}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!filteredProv?.length && (
                        <tr><td colSpan={6} className="empty">Este proveedor no tiene catálogo.</td></tr>
                      )}
                      {filteredProv?.map((it) => {
                        const idc = it.id_catalogo;
                        return (
                          <tr key={idc}>
                            <td>
                              <div className="font-semibold">{it.Repuesto?.nombre}</div>
                              <div className="muted text-sm">{it.Repuesto?.descripcion}</div>
                            </td>
                            <td className="hide-sm">{it.Repuesto?.marca_compatible || "—"}</td>
                            <td className="mono">{currency(it.precio)}</td>
                            <td className="mono">{it.cantidad_disponible}</td>
                            <td>
                              <input
                                type="number"
                                min={1}
                                className="input"
                                placeholder="Cant."
                                value={qtyMap[idc] ?? ""}
                                onChange={(e)=>setQty(idc, e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                className="btn-pedido"
                                onClick={()=>agregarDetalle(idc)}
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

            {/* Detalles ya agregados (editable) */}
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
                        <th style={{width: 200}}>Editar cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!detalles?.length && (
                        <tr><td colSpan={5} className="empty">Aún no has agregado productos.</td></tr>
                      )}
                      {detalles?.map((d) => {
                        const idDet  = d?.id_detalle_pedido ?? d?.id_detalle ?? d?.id;
                        const idCat  = d?.id_catalogo ?? d?.catalogo_id ?? d?.idCatalogo;
                        const cant   = Number(d?.cantidad);
                        const pu     = d?.precio_unitario;
                        const sub    = d?.subtotal;

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
                                  onChange={(e)=>setEditQty(prev=>({ ...prev, [idDet]: e.target.value }))}
                                />
                                <button className="btn-pedido" onClick={()=>actualizarDetalle({ ...d, id_detalle_pedido: idDet, cantidad: cant })}>
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
                    <i className="bi bi-info-circle" /> Edita la cantidad y presiona <strong>Guardar</strong>.
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

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
