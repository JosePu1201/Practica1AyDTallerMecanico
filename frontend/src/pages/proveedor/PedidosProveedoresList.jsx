// src/proveedor/PedidosProveedoresList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../stiles/proveedor.css";

const PROV_API = "/api/proveedores";

const cls = (...xs) => xs.filter(Boolean).join(" ");
const currency = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "—";
  return `Q. ${x.toFixed(2)}`;
};

function useProveedorId() {
  const [idProveedor, setIdProveedor] = useState(null);
  const [userRaw, setUserRaw] = useState(null);
  useEffect(() => {
    const raw = localStorage.getItem("user");
    setUserRaw(raw);
    try {
      const u = raw ? JSON.parse(raw) : null;
      setIdProveedor(u?.id_usuario ?? null); // en tu backend mapeas a id_proveedor
    } catch {
      setIdProveedor(null);
    }
  }, []);
  return { idProveedor, userRaw };
}

function usePagosProveedor(id_proveedor) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(!!id_proveedor);
  const [error, setError] = useState(null);

  const fetchAll = async () => {
    if (!id_proveedor) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get(`${PROV_API}/listar_pago_proveedor/${id_proveedor}`);
      // Backend: { message, pedidoProveedor: [...] }
      const list = Array.isArray(data?.pedidoProveedor)
        ? data.pedidoProveedor
        : Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];
      setRows(list);
    } catch (e) {
      console.error(e);
      setError("No se pudo cargar los pedidos pagados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id_proveedor]);

  return { rows, loading, error, refetch: fetchAll, setRows };
}

export default function PedidosProveedoresList() {
  const { idProveedor } = useProveedorId();
  const { rows: pedidos, loading, error, refetch } = usePagosProveedor(idProveedor);

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
        // Algunos backends tienen PagosProveedor como array/objeto:
        ...(Array.isArray(p?.PagosProveedors) ? p.PagosProveedors.map(px => px?.estado) : [p?.PagosProveedor?.estado]),
      ]
        .join(" \u200b ")
        .toLowerCase()
        .includes(term)
    );
  }, [q, pedidos]);

  const [mode, setMode] = useState("list"); // "list" | "detalle"
  const [pedidoSel, setPedidoSel] = useState(null);

  const verDetalle = (p) => {
    setPedidoSel(p);
    setMode("detalle");
  };

  const volver = () => {
    setMode("list");
    setPedidoSel(null);
  };

  // ayuda para manejar que DetallePedido pueda venir como DetallePedido[], DetallePedidos, o data anidada
  const getDetalles = (p) => {
    if (!p) return [];
    if (Array.isArray(p.DetallePedidos)) return p.DetallePedidos;
    if (Array.isArray(p.DetallePedido)) return p.DetallePedido;
    if (Array.isArray(p?.Detalle)) return p.Detalle;
    return [];
  };

  // Algunos backends nombran PagosProveedor como arreglo: PagosProveedors
  const getPagos = (p) => {
    if (!p) return [];
    if (Array.isArray(p.PagosProveedors)) return p.PagosProveedors;
    if (Array.isArray(p.PagosProveedor)) return p.PagosProveedor;
    if (p.PagosProveedor && typeof p.PagosProveedor === "object") return [p.PagosProveedor];
    return [];
  };

  // Opcional: totales desde detalle
  const detalles = getDetalles(pedidoSel);
  const totalDetalle = useMemo(() => {
    return detalles.reduce((acc, d) => acc + Number(d.subtotal ?? 0), 0);
  }, [detalles]);

  // Flash mínimo (por si deseas mostrar notificaciones)
  const [flash, setFlash] = useState(null);
  const showFlash = (type, text, ms = 2200) => {
    setFlash({ type, text });
    setTimeout(() => setFlash(null), ms);
  };

  return (
    <div className="card-surface card-light">
      {/* LISTA */}
      {mode === "list" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Pedidos pagados</h2>
              <div className="muted text-sm">
                Se muestran únicamente pedidos con pagos en estado <strong>PAGADO</strong>.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="search">
                <i className="bi bi-search" />
                <input
                  style={{ color: "#000" }}
                  placeholder="Buscar por número, estado, id…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>
              <button className="btn-ghost" onClick={refetch}>
                <i className="bi bi-arrow-clockwise me-2" />
                Actualizar
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

            {!loading && !error && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Número</th>
                      <th>Total</th>
                      <th>Fecha pedido</th>
                      <th>Fecha solicitada</th>
                      <th>Estado</th>
                      <th>Pagos</th>
                      <th style={{ width: 130 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {!filtered?.length && (
                      <tr>
                        <td colSpan={8} className="empty">No hay pedidos pagados</td>
                      </tr>
                    )}
                    {filtered?.map((p) => {
                      const pagos = getPagos(p);
                      const pagosCount = pagos.length;
                      const pagosMonto = pagos.reduce((acc, x) => acc + Number(x?.monto ?? 0), 0);
                      return (
                        <tr key={p.id_pedido}>
                          <td className="mono">{p.id_pedido}</td>
                          <td>{p.numero_pedido || "—"}</td>
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
                            <div className="font-semibold">{pagosCount} pago(s)</div>
                            <div className="muted text-sm">Total pagos: {currency(pagosMonto)}</div>
                          </td>
                          <td>
                            <button className="btn-pedido" onClick={() => verDetalle(p)}>
                              <i className="bi bi-eye me-1" />
                              Ver detalle
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="table-tip">
                  <i className="bi bi-info-circle" /> Usa <strong>Ver detalle</strong> para revisar los
                  productos del pedido. (Solo lectura)
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* DETALLE (solo lectura) */}
      {mode === "detalle" && (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="m-0">Detalle del pedido</h2>
              <div className="muted text-sm">
                Pedido <strong>#{pedidoSel?.id_pedido}</strong> · Nº{" "}
                <strong>{pedidoSel?.numero_pedido ?? "—"}</strong> · Estado{" "}
                <strong>{pedidoSel?.estado ?? "—"}</strong>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={volver}>
                <i className="bi bi-arrow-left me-2" />
                Volver
              </button>
            </div>
          </div>

          <div className="split mt-3">
            {/* Panel izquierdo: lista de pagos (opcional, solo visual) */}
            <div>
              <div className="pane" style={{ padding: 16 }}>
                <div className="pane-head">
                  <span className="pill">
                    <i className="bi bi-cash-coin me-1" />
                    Pagos marcados como PAGADO
                  </span>
                </div>

                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>ID pago</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const pagos = getPagos(pedidoSel);
                        if (!pagos.length) {
                          return (
                            <tr>
                              <td colSpan={4} className="empty">Sin pagos</td>
                            </tr>
                          );
                        }
                        return pagos.map(pg => (
                          <tr key={pg.id_pago ?? `${pg.estado}-${pg.monto}-${pg.createdAt}`}>
                            <td className="mono">{pg.id_pago ?? "—"}</td>
                            <td className="mono">{currency(pg.monto ?? 0)}</td>
                            <td>
                              <span className={cls("pill", `state-${String(pg.estado || "").toLowerCase()}`)}>
                                {pg.estado ?? "—"}
                              </span>
                            </td>
                            <td className="mono">
                              {pg.fecha_pago
                                ? new Date(pg.fecha_pago).toLocaleDateString()
                                : (pg.createdAt ? new Date(pg.createdAt).toLocaleDateString() : "—")}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="muted">
                    Total del pedido: <strong>{currency(pedidoSel?.total ?? 0)}</strong>
                  </div>
                  <div className="muted">
                    Total desde detalle: <strong>{currency(totalDetalle)}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Panel derecho: detalle del pedido (solo lectura) */}
            <div className="pane sticky">
              <div className="pane-head">
                <span className="pill">
                  <i className="bi bi-list-check me-1" />
                  Detalle del pedido (solo lectura)
                </span>
              </div>

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
                      <tr key={d.id_detalle_pedido}>
                        <td className="mono">{d.id_catalogo}</td>
                        <td className="mono">{d.cantidad}</td>
                        <td className="mono">{currency(d.precio_unitario)}</td>
                        <td className="mono">{currency(d.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="table-tip">
                  <i className="bi bi-info-circle" /> Esta vista es informativa, no editable.
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
