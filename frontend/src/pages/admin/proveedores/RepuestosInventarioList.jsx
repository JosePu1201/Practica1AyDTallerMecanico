// src/admin/inventario/RepuestosList.jsx
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const INV_API = "/api/inventario";

const currency = (n) => {
  const x = Number(n);
  if (Number.isNaN(x)) return "Q. 0.00";
  return `Q. ${x.toFixed(2)}`;
};
const fmtFecha = (f) => {
  if (!f) return "—";
  const d = new Date(f);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

function useInventarioRepuestos() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    setErr(null);
    try {
      const { data } = await axios.get(`${INV_API}/repuestos`);
      // El backend devuelve un array de Inventario con include de Repuesto -> Proveedor
      console.log(data);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setErr("No se pudo cargar el inventario de repuestos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  return { rows, loading, err, refetch: fetchAll };
}

export default function RepuestosInventarioList() {
  const { rows, loading, err, refetch } = useInventarioRepuestos();

  // búsqueda
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((it) => {
      const rep = it?.Repuesto || {};
      const prov = rep?.Proveedor || {};
      return [
        it?.id_inventario_repuesto,
        it?.id_repuesto,
        rep?.id_repuesto,
        rep?.nombre,
        rep?.descripcion,
        prov?.nit,
        prov?.estado,
      ]
        .join("  ")
        .toLowerCase()
        .includes(term);
    });
  }, [q, rows]);

  // totales
  const totalItems = useMemo(
    () => filtered.reduce((acc, it) => acc + Number(it?.cantidad ?? 0), 0),
    [filtered]
  );
  const totalValor = useMemo(
    () => filtered.reduce((acc, it) => acc + Number(it?.cantidad ?? 0) * Number(it?.precio_unitario ?? 0), 0),
    [filtered]
  );

  return (
    <div className="card-surface card-light">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="m-0">Listado de repuestos</h2>
          <div className="muted text-sm">
            Inventario con repuestos asociados, ordenado por <strong>cantidad</strong>.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="search">
            <i className="bi bi-search" />
            <input
              placeholder="Buscar por nombre, NIT, descripción, ID…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ color: "#000" }}
            />
          </div>
          <button className="btn-ghost" onClick={refetch}>
            <i className="bi bi-arrow-clockwise me-2" />
            Actualizar
          </button>
        </div>
      </div>

      <div className="mt-3">
        {loading && <div className="skeleton h-10" />}
        {err && (
          <div className="alert alert-error">
            <i className="bi bi-exclamation-triangle me-2" />
            {err}
          </div>
        )}

        {!loading && !err && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th># Inv</th>
                  <th>ID repuesto</th>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>NIT proveedor</th>
                  <th>Cantidad</th>
                  <th>Precio unitario</th>
                  <th>Valor stock</th>
                  <th>Últ. actualización</th>
                </tr>
              </thead>
              <tbody>
                {!filtered.length && (
                  <tr>
                    <td className="empty" colSpan={9}>No hay repuestos en inventario.</td>
                  </tr>
                )}

                {filtered.map((it) => {
                  const rep = it?.Repuesto || {};
                  const prov = rep?.Proveedor || {};
                  const valor = Number(it?.cantidad ?? 0) * Number(it?.precio_unitario ?? 0);
                  const low = Number(it?.cantidad ?? 0) <= 5; // umbral bajo
                  return (
                    <tr key={it.id_inventario_repuesto}>
                      <td className="mono">{it.id_inventario_repuesto}</td>
                      <td className="mono">{rep?.id_repuesto ?? it?.id_repuesto}</td>
                      <td>{rep?.nombre || "—"}</td>
                      <td className="muted">{rep?.descripcion || "—"}</td>
                      <td className="mono">{prov?.nit || "—"}</td>
                      <td>
                        <span className={`badge ${low ? "badge-error" : "badge-ok"}`}>
                          {Number(it?.cantidad ?? 0)}
                        </span>
                      </td>
                      <td className="mono">{currency(Number(it?.precio_unitario ?? 0))}</td>
                      <td className="mono">{currency(valor)}</td>
                      <td className="mono">{fmtFecha(it?.fecha_ultima_actualizacion)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={5} className="muted">Totales (filtrados)</td>
                  <td className="mono"><strong>{totalItems}</strong></td>
                  <td />
                  <td className="mono"><strong>{currency(totalValor)}</strong></td>
                  <td />
                </tr>
              </tfoot>
            </table>

            <div className="table-tip">
              <i className="bi bi-info-circle" /> El backend ya envía los resultados ordenados por cantidad
              descendente. El umbral “bajo” está en ≤ 5 unidades (ajústalo fácil en el código).
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
