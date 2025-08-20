import React, { useEffect, useState } from 'react';
import { Card, Table, Button, Spinner, Form, InputGroup, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

export default function VehiclesList() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
     
      const res = await axios.get('/api/vehicles', { params: { q } });
      setVehicles(res.data || []);
      setError(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError('Error al cargar vehículos: ' + msg);
      toast.error('No se pudieron cargar los vehículos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchVehicles();
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

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Vehículos</h1>
        <div>
          <Link to="/admin/vehicles/new" className="btn btn-primary">
            <i className="bi bi-plus-circle me-1" /> Nuevo Vehículo
          </Link>
        </div>
      </div>

      <Card>
        <Card.Body>
          <Form onSubmit={handleSearch} className="mb-3">
            <InputGroup>
              <Form.Control
                placeholder="Buscar por placa, marca o modelo..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <Button type="submit" variant="outline-secondary">
                <i className="bi bi-search" /> Buscar
              </Button>
            </InputGroup>
          </Form>

          <Table hover responsive>
            <thead>
              <tr>
                <th>#</th>
                <th>Placa</th>
                <th>Marca</th>
                <th>Modelo</th>
                <th>Año</th>
                <th>Color</th>
                <th>Kilometraje</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th className="text-end">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center">No hay vehículos registrados</td>
                </tr>
              ) : vehicles.map(v => (
                <tr key={v.id_vehiculo}>
                  <td>{v.id_vehiculo}</td>
                  <td><Badge bg="dark">{v.placa}</Badge></td>
                  <td>{v.marca}</td>
                  <td>{v.modelo}</td>
                  <td>{v.anio || '-'}</td>
                  <td>{v.color || '-'}</td>
                  <td>{Number(v.kilometraje || 0).toLocaleString()}</td>
                  <td>
                    {v.cliente
                      ? `${v.cliente?.nombre} ${v.cliente?.apellido}`
                      : (v.nombre_cliente || '-')}
                  </td>
                  <td>
                    <Badge bg={v.estado === 'ACTIVO' ? 'success' : 'secondary'}>
                      {v.estado || 'ACTIVO'}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <div className="btn-group btn-group-sm">
                      <Link
                        to={`/admin/vehicles/${v.id_vehiculo}/history`}
                        className="btn btn-outline-secondary"
                        title="Historial de servicios"
                      >
                        <i className="bi bi-clock-history" />
                      </Link>
                      <Link
                        to={`/admin/vehicles/${v.id_vehiculo}/edit`}
                        className="btn btn-outline-primary"
                        title="Editar"
                      >
                        <i className="bi bi-pencil-square" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
}
