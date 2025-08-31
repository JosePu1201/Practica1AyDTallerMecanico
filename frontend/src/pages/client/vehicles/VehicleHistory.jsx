import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Accordion, Badge, Button, Spinner, Alert, Table } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function VehicleHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [services, setServices] = useState([]);

  // Load user from localStorage
  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        setUser(JSON.parse(s));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Fetch vehicle and service history
  useEffect(() => {
    const fetchVehicleHistory = async () => {
      if (!user?.id_usuario || !id) return;

      try {
        setLoading(true);
        
        // Fetch vehicles to find the current one
        const vehicles = await clientService.getMyVehicles(user.id_usuario);
        const currentVehicle = vehicles.find(v => v.id_vehiculo.toString() === id);
        
        if (!currentVehicle) {
          setError('Vehículo no encontrado');
          setLoading(false);
          return;
        }
        
        setVehicle(currentVehicle);
        
        // Fetch service details for this vehicle
        const services = await clientService.getServicesDetailByVehicle(id);
        setServices(services);
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar el historial del vehículo: ' + err.message);
        setLoading(false);
      }
    };

    fetchVehicleHistory();
  }, [id, user]);

  // Status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="success">Completado</Badge>;
      case 'CANCELADO':
        return <Badge bg="danger">Cancelado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No establecida';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando historial del vehículo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <div className="d-flex justify-content-end">
          <Button variant="outline-danger" onClick={() => navigate('/client/vehicles')}>
            Volver a mis vehículos
          </Button>
        </div>
      </Alert>
    );
  }

  if (!vehicle) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Vehículo no encontrado</Alert.Heading>
        <p>El vehículo solicitado no existe o no tienes permisos para verlo.</p>
        <div className="d-flex justify-content-end">
          <Button variant="outline-warning" onClick={() => navigate('/client/vehicles')}>
            Volver a mis vehículos
          </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Historial del Vehículo</h1>
        <Button as={Link} to="/client/vehicles" variant="outline-primary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a mis vehículos
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <div className="vehicle-header d-flex mb-3">
            <div className="vehicle-icon me-3">
              <i className="bi bi-car-front fs-1 text-primary"></i>
            </div>
            <div>
              <h2 className="mb-1">{vehicle.marca} {vehicle.modelo}</h2>
              <p className="mb-0 text-muted">
                Año: {vehicle.anio} | Placa: {vehicle.placa} | Color: {vehicle.color}
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>

      <h4 className="mb-3">Historial de Servicios</h4>
      
      {services.length === 0 ? (
        <Alert variant="info">
          <Alert.Heading>No hay historial de servicios</Alert.Heading>
          <p>Este vehículo aún no tiene servicios registrados.</p>
        </Alert>
      ) : (
        <Accordion defaultActiveKey="0" className="mb-4">
          {services.map((service, index) => (
            <Accordion.Item key={service.id_registro} eventKey={index.toString()}>
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                  <div>
                    <span className="fw-bold">Servicio #{service.id_registro}</span>
                    <span className="text-muted ms-3">
                      {formatDate(service.fecha_ingreso)}
                    </span>
                  </div>
                  <div>{getStatusBadge(service.estado)}</div>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <h5 className="mb-2">Descripción del Problema</h5>
                    <p>{service.descripcion_problema}</p>
                    
                    <h5 className="mb-2 mt-4">Fechas</h5>
                    <p>
                      <strong>Ingreso:</strong> {formatDate(service.fecha_ingreso)}
                      <br />
                      <strong>Estimada de finalización:</strong> {formatDate(service.fecha_estimada_finalizacion)}
                    </p>
                  </Col>
                  <Col md={6}>
                    <h5 className="mb-3">Trabajos Realizados</h5>
                    {service.AsignacionTrabajos && service.AsignacionTrabajos.length > 0 ? (
                      <Table bordered hover size="sm">
                        <thead>
                          <tr>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th>Precio</th>
                          </tr>
                        </thead>
                        <tbody>
                          {service.AsignacionTrabajos.map(trabajo => (
                            <tr key={trabajo.id_asignacion}>
                              <td>
                                {trabajo.descripcion}
                                <div className="small text-muted">
                                  {trabajo.TipoMantenimiento?.nombre_tipo}
                                </div>
                              </td>
                              <td>{getStatusBadge(trabajo.estado)}</td>
                              <td>Q{Number(trabajo.precio).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="2" className="text-end fw-bold">Total:</td>
                            <td className="fw-bold">
                              Q{service.AsignacionTrabajos.reduce((sum, t) => sum + Number(t.precio), 0).toFixed(2)}
                            </td>
                          </tr>
                        </tfoot>
                      </Table>
                    ) : (
                      <p className="text-muted">No hay trabajos registrados para este servicio.</p>
                    )}
                  </Col>
                </Row>

                {/* Daños adicionales */}
                {service.AsignacionTrabajos?.some(t => t.DaniosAdicionales?.length > 0) && (
                  <div className="mt-4">
                    <h5 className="mb-3">Daños Adicionales Detectados</h5>
                    <Table bordered size="sm">
                      <thead>
                        <tr>
                          <th>Descripción</th>
                          <th>Fecha</th>
                          <th>Costo Estimado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.AsignacionTrabajos.flatMap(trabajo => 
                          trabajo.DaniosAdicionales?.map(danio => (
                            <tr key={danio.id_danio}>
                              <td>{danio.descripcion_danio}</td>
                              <td>{formatDate(danio.fecha_danio)}</td>
                              <td>Q{Number(danio.costo_estimado).toFixed(2)}</td>
                            </tr>
                          )) || []
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}

                {/* Repuestos utilizados */}
                {service.AsignacionTrabajos?.some(t => t.SolicitudUsoRepuestos?.length > 0) && (
                  <div className="mt-4">
                    <h5 className="mb-3">Repuestos Utilizados</h5>
                    <Table bordered size="sm">
                      <thead>
                        <tr>
                          <th>Repuesto</th>
                          <th>Cantidad</th>
                          <th>Precio Unitario</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.AsignacionTrabajos.flatMap(trabajo => 
                          trabajo.SolicitudUsoRepuestos?.map(solicitud => (
                            <tr key={solicitud.id_solicitud_uso_repuesto}>
                              <td>
                                {solicitud.Inventario?.Repuesto?.nombre}
                                <div className="small text-muted">
                                  {solicitud.Inventario?.Repuesto?.descripcion}
                                </div>
                              </td>
                              <td>{solicitud.cantidad}</td>
                              <td>Q{Number(solicitud.Inventario?.precio_unitario).toFixed(2)}</td>
                              <td>
                                Q{Number(solicitud.cantidad * solicitud.Inventario?.precio_unitario).toFixed(2)}
                              </td>
                            </tr>
                          )) || []
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}

                <div className="d-flex justify-content-end mt-3">
                  <Button 
                    variant="primary"
                    size="sm"
                    as={Link}
                    to={`/client/services/detail/${service.id_registro}`}
                  >
                    Ver Detalles Completos
                  </Button>
                </div>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </div>
  );
}
