import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Row, Col, Tabs, Tab, ListGroup } from 'react-bootstrap';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [service, setService] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

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

  // Fetch service details
  useEffect(() => {
    const fetchServiceDetail = async () => {
      if (!user?.id_usuario || !id) return;

      try {
        setLoading(true);
        const services = await clientService.getAllServices(user.id_usuario);
        const currentService = services.find(s => s.id_registro.toString() === id);
        
        if (!currentService) {
          setError('Servicio no encontrado');
          setLoading(false);
          return;
        }
        
        setService(currentService);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los detalles del servicio: ' + err.message);
        setLoading(false);
      }
    };

    fetchServiceDetail();
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

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando detalles del servicio...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-danger" onClick={() => navigate('/client/services')}>
            Volver a la lista
          </Button>
        </div>
      </Alert>
    );
  }

  if (!service) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Servicio no encontrado</Alert.Heading>
        <p>El servicio solicitado no existe o ha sido eliminado.</p>
        <hr />
        <div className="d-flex justify-content-end">
          <Button variant="outline-warning" onClick={() => navigate('/client/services')}>
            Volver a la lista
          </Button>
        </div>
      </Alert>
    );
  }

  // Calculate total cost
  const getTotalCost = () => {
    if (!service.AsignacionTrabajos || service.AsignacionTrabajos.length === 0) {
      return 0;
    }
    return service.AsignacionTrabajos.reduce((sum, work) => sum + Number(work.precio || 0), 0);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Detalle del Servicio #{service.id_registro}</h1>
        <Link to="/client/services" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a la lista
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={8}>
              <div className="d-flex align-items-center mb-3">
                <div className="vehicle-icon me-3 bg-light p-3 rounded">
                  <i className="bi bi-car-front fs-3 text-primary"></i>
                </div>
                <div>
                  <h3 className="mb-1">
                    {service.Vehiculo?.marca} {service.Vehiculo?.modelo}
                  </h3>
                  <p className="text-muted mb-0">
                    Placa: <strong>{service.Vehiculo?.placa}</strong>
                  </p>
                </div>
              </div>
            </Col>
            <Col md={4}>
              <div className="bg-light p-3 rounded text-center">
                <h6>Estado</h6>
                <div className="mt-2 fs-5">
                  {getStatusBadge(service.estado)}
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        id="service-detail-tabs"
        className="mb-4"
      >
        <Tab eventKey="details" title="Detalles">
          <Card>
            <Card.Body>
              <Row className="mb-4">
                <Col md={6}>
                  <h5 className="border-bottom pb-2 mb-3">Información General</h5>
                  <ListGroup variant="flush">
                    <ListGroup.Item>
                      <strong>Fecha de Ingreso:</strong> {formatDate(service.fecha_ingreso)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Fecha Estimada de Finalización:</strong> {formatDate(service.fecha_estimada_finalizacion)}
                    </ListGroup.Item>
                    <ListGroup.Item>
                      <strong>Estado:</strong> {getStatusBadge(service.estado)}
                    </ListGroup.Item>
                  </ListGroup>
                </Col>
                <Col md={6}>
                  <h5 className="border-bottom pb-2 mb-3">Descripción del Problema</h5>
                  <div className="p-3 bg-light rounded">
                    {service.descripcion_problema}
                  </div>
                </Col>
              </Row>

              {service.estado === 'PENDIENTE' && (
                <div className="mb-4">
                  <Alert variant="info">
                    <i className="bi bi-info-circle me-2"></i>
                    Este servicio está pendiente de aprobación. Puede autorizar o rechazar este servicio.
                  </Alert>
                  <div className="d-flex justify-content-end gap-2">
                    <Button 
                      variant="success" 
                      onClick={async () => {
                        try {
                          await clientService.authorizeService(service.id_registro);
                          setService({...service, estado: 'EN_PROCESO'});
                        } catch (err) {
                          setError('Error al autorizar el servicio: ' + err.message);
                        }
                      }}
                    >
                      <i className="bi bi-check-circle me-2"></i>
                      Autorizar Servicio
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={async () => {
                        try {
                          await clientService.notAuthorizeService(service.id_registro);
                          setService({...service, estado: 'CANCELADO'});
                        } catch (err) {
                          setError('Error al rechazar el servicio: ' + err.message);
                        }
                      }}
                    >
                      <i className="bi bi-x-circle me-2"></i>
                      Rechazar Servicio
                    </Button>
                  </div>
                </div>
              )}

              <h5 className="border-bottom pb-2 mb-3">Trabajos Asignados</h5>
              {!service.AsignacionTrabajos || service.AsignacionTrabajos.length === 0 ? (
                <Alert variant="info">
                  <i className="bi bi-info-circle me-2"></i>
                  No hay trabajos asignados para este servicio aún.
                </Alert>
              ) : (
                <Table responsive striped>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Descripción</th>
                      <th>Empleado</th>
                      <th>Estado</th>
                      <th>Precio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {service.AsignacionTrabajos.map(work => (
                      <tr key={work.id_asignacion}>
                        <td>{work.id_asignacion}</td>
                        <td>{work.descripcion}</td>
                        <td>
                          {work.empleadoAsignado?.Persona?.nombre} {work.empleadoAsignado?.Persona?.apellido}
                        </td>
                        <td>{getStatusBadge(work.estado)}</td>
                        <td className="text-end">{formatCurrency(work.precio)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" className="text-end fw-bold">Total:</td>
                      <td className="text-end fw-bold">{formatCurrency(getTotalCost())}</td>
                    </tr>
                  </tfoot>
                </Table>
              )}

              <div className="mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Acciones Disponibles</h5>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <Button 
                    variant="primary" 
                    as={Link} 
                    to={`/client/comments?serviceId=${service.id_registro}`}
                  >
                    <i className="bi bi-chat-text me-2"></i>
                    Agregar Comentario
                  </Button>
                  {service.estado === 'COMPLETADO' && (
                    <Button 
                      variant="success" 
                      as={Link} 
                      to={`/client/rating?serviceId=${service.id_registro}`}
                    >
                      <i className="bi bi-star me-2"></i>
                      Calificar Servicio
                    </Button>
                  )}
                  <Button 
                    variant="outline-secondary" 
                    as={Link} 
                    to={`/client/services/additional?serviceId=${service.id_registro}`}
                  >
                    <i className="bi bi-plus-circle me-2"></i>
                    Solicitar Servicio Adicional
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="comments" title="Comentarios">
          <Card>
            <Card.Body>
              <div className="text-center py-5">
                <i className="bi bi-chat-square-text display-4 text-muted"></i>
                <h3 className="mt-3 text-muted">Comentarios de Seguimiento</h3>
                <p>Aquí podrá ver todos los comentarios relacionados con este servicio.</p>
                <Button 
                  as={Link} 
                  to={`/client/comments?serviceId=${service.id_registro}`}
                  variant="primary"
                >
                  <i className="bi bi-plus-circle me-2"></i>
                  Agregar Nuevo Comentario
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>
        
        <Tab eventKey="history" title="Historial">
          <Card>
            <Card.Body>
              <div className="text-center py-5">
                <i className="bi bi-clock-history display-4 text-muted"></i>
                <h3 className="mt-3 text-muted">Historial del Servicio</h3>
                <p>Aquí podrá ver el historial completo de este servicio.</p>
                <Button 
                  as={Link} 
                  to={`/client/vehicles/history/${service.Vehiculo?.id_vehiculo}`}
                  variant="primary"
                >
                  <i className="bi bi-car-front me-2"></i>
                  Ver Historial del Vehículo
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>
    </div>
  );
}
