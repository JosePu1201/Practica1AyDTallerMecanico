import React, { useEffect, useState } from 'react';
import { Card, Table, Spinner, Badge } from 'react-bootstrap';
import { useParams, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function VehicleHistory() {
  const { id } = useParams();
  const location = useLocation();
  // Opcional: si vienes desde la lista puedes pasar el vehículo en state
  const vehiculoFromState = location.state?.vehicle || null;

  const [vehiculo] = useState(vehiculoFromState); // solo lectura si llega por state
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      // ÚNICA llamada: registros por id_vehiculo
      const hRes = await axios.get(`/api/vehiculos/listarRegistrosDeServicio/${id}`);
      const registros = Array.isArray(hRes.data) ? hRes.data : (hRes.data?.registros || []);
      setHistorial(registros);
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cargar el historial');
    } finally {
      setLoading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('es-GT') : '-';

  const prioridadBadge = (p) => {
    const val = (p || '').toUpperCase();
    const map = { URGENTE: 'danger', ALTA: 'warning', MEDIA: 'info', BAJA: 'secondary' };
    return <Badge bg={map[val] || 'secondary'}>{p || '-'}</Badge>;
  };

  const estadoBadge = (e) => {
    const val = (e || '').toUpperCase();
    const map = { COMPLETADO: 'success', EN_PROCESO: 'primary', PENDIENTE: 'warning', CANCELADO: 'secondary' };
    return <Badge bg={map[val] || 'secondary'}>{e || '-'}</Badge>;
  };

  const estrellas = (n) => {
    if (n == null) return '-';
    const full = Math.max(0, Math.min(5, Number(n)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Historial de servicios</h1>
        <div>
          <Link to="/admin/vehicles" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left" /> Volver
          </Link>
        </div>
      </div>

      {/* Cabecera opcional: solo si viene info del vehículo por state */}
      {vehiculo && (
        <Card className="mb-3">
          <Card.Body className="d-flex flex-wrap gap-4">
            <div>
              <div className="fw-bold">Vehículo</div>
              <div>{vehiculo.marca} {vehiculo.modelo} {vehiculo.anio ? `(${vehiculo.anio})` : ''}</div>
            </div>
            <div>
              <div className="fw-bold">Placa</div>
              <div><Badge bg="dark">{vehiculo.placa}</Badge></div>
            </div>
            <div>
              <div className="fw-bold">Cliente</div>
              <div>
                {vehiculo.cliente
                  ? `${vehiculo.cliente?.nombre} ${vehiculo.cliente?.apellido}`
                  : (vehiculo.nombre_cliente || vehiculo.id_cliente || '-')}
              </div>
            </div>
            <div>
              <div className="fw-bold">Estado</div>
              <div>
                <Badge bg={vehiculo.estado === 'ACTIVO' ? 'success' : 'secondary'}>
                  {vehiculo.estado || 'ACTIVO'}
                </Badge>
              </div>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card>
        <Card.Body>
          <Table hover responsive>
            <thead>
              <tr>
                <th>Ingreso</th>
                <th>Est. finalización</th>
                <th>Finalización real</th>
                <th>Problema / Servicio</th>
                <th>Prioridad</th>
                <th>Estado</th>
                <th>Calif.</th>
                <th>Observaciones iniciales</th>
              </tr>
            </thead>
            <tbody>
              {historial.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center">Sin registros</td>
                </tr>
              ) : historial.map((r) => (
                <tr key={r.id_registro}>
                  <td>{fmt(r.fecha_ingreso)}</td>
                  <td>{fmt(r.fecha_estimada_finalizacion)}</td>
                  <td>{fmt(r.fecha_finalizacion_real)}</td>
                  <td>{r.descripcion_problema || '-'}</td>
                  <td>{prioridadBadge(r.prioridad)}</td>
                  <td>{estadoBadge(r.estado)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{estrellas(r.calificacion)}</td>
                  <td>{r.observaciones_iniciales || '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
