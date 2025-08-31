import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Spinner, Alert, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../../services/clientService';

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [pendingPayments, setPendingPayments] = useState([]);

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        
        // Fetch vehicles
        const vehiclesData = await clientService.getMyVehicles(user.id_usuario);
        setVehicles(vehiclesData);

        // Fetch active services
        const servicesData = await clientService.getAllServices(user.id_usuario);
        const activeServicesData = servicesData.filter(service => 
          service.estado !== 'COMPLETADO' && service.estado !== 'CANCELADO'
        );
        setActiveServices(activeServicesData);

        // Fetch invoices
        const invoicesData = await clientService.getInvoices(user.id_usuario);
        const pendingPaymentsData = invoicesData.filter(invoice => 
          invoice.estado_pago === 'PENDIENTE'
        );
        setPendingPayments(pendingPaymentsData);

        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos del dashboard: ' + err.message);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
      </Alert>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Bienvenido, {user?.nombre_usuario}</h1>

      <Row className="mb-4">
        <Col md={4} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Mis Vehículos</h5>
                <div className="dashboard-icon bg-primary-light">
                  <i className="bi bi-car-front text-primary"></i>
                </div>
              </div>
              <div className="text-center">
                <h2 className="mb-0">{vehicles.length}</h2>
                <p className="text-muted mb-3">vehículos registrados</p>
                <Button as={Link} to="/client/vehicles" variant="outline-primary" size="sm">
                  Ver vehículos
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Servicios Activos</h5>
                <div className="dashboard-icon bg-warning-light">
                  <i className="bi bi-tools text-warning"></i>
                </div>
              </div>
              <div className="text-center">
                <h2 className="mb-0">{activeServices.length}</h2>
                <p className="text-muted mb-3">servicios en progreso</p>
                <Button as={Link} to="/client/services" variant="outline-warning" size="sm">
                  Ver servicios
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Pagos Pendientes</h5>
                <div className="dashboard-icon bg-danger-light">
                  <i className="bi bi-cash text-danger"></i>
                </div>
              </div>
              <div className="text-center">
                <h2 className="mb-0">{pendingPayments.length}</h2>
                <p className="text-muted mb-3">facturas por pagar</p>
                <Button as={Link} to="/client/invoices" variant="outline-danger" size="sm">
                  Ver facturas
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={7} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Servicios Activos</h5>
                <Button as={Link} to="/client/services" size="sm" variant="primary">
                  Ver todos
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {activeServices.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-tools display-4 text-muted"></i>
                  <p className="mt-3 mb-0">No tienes servicios activos</p>
                </div>
              ) : (
                activeServices.slice(0, 5).map((service) => (
                  <div key={service.id_registro} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">
                          {service.Vehiculo?.marca} {service.Vehiculo?.modelo} ({service.Vehiculo?.placa})
                        </h6>
                        <p className="small mb-0">
                          {service.descripcion_problema?.substring(0, 100)}
                          {service.descripcion_problema?.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(service.estado)}
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                      <Button
                        as={Link}
                        to={`/client/services/detail/${service.id_registro}`}
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                      >
                        Ver detalles
                      </Button>
                      {service.estado === 'PENDIENTE' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline-success"
                            className="me-2"
                            onClick={() => {
                              clientService.authorizeService(service.id_registro)
                                .then(() => {
                                  // Refresh data
                                  service.estado = 'EN_PROCESO';
                                  setActiveServices([...activeServices]);
                                })
                                .catch((error) => {
                                  console.error('Error al autorizar servicio', error);
                                });
                            }}
                          >
                            Autorizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => {
                              clientService.notAuthorizeService(service.id_registro)
                                .then(() => {
                                  // Refresh data
                                  service.estado = 'CANCELADO';
                                  setActiveServices(activeServices.filter(s => s.id_registro !== service.id_registro));
                                })
                                .catch((error) => {
                                  console.error('Error al rechazar servicio', error);
                                });
                            }}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={5} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Cotizaciones Recientes</h5>
                <Button as={Link} to="/client/services/quotes" size="sm" variant="primary">
                  Ver todas
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {/* You can add real-time quotes data here if available */}
              <div className="text-center py-4">
                <i className="bi bi-file-earmark-text display-4 text-muted"></i>
                <p className="mt-3 mb-0">Consulta tus cotizaciones pendientes</p>
                <Link to="/client/services/quotes" className="btn btn-primary mt-2">
                  Ver mis cotizaciones
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={7} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Servicios Activos</h5>
                <Button as={Link} to="/client/services" size="sm" variant="primary">
                  Ver todos
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {activeServices.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-tools display-4 text-muted"></i>
                  <p className="mt-3 mb-0">No tienes servicios activos</p>
                </div>
              ) : (
                activeServices.slice(0, 5).map((service) => (
                  <div key={service.id_registro} className="mb-3 p-3 border rounded">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="mb-1">
                          {service.Vehiculo?.marca} {service.Vehiculo?.modelo} ({service.Vehiculo?.placa})
                        </h6>
                        <p className="small mb-0">
                          {service.descripcion_problema?.substring(0, 100)}
                          {service.descripcion_problema?.length > 100 ? '...' : ''}
                        </p>
                      </div>
                      <div>
                        {getStatusBadge(service.estado)}
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                      <Button
                        as={Link}
                        to={`/client/services/detail/${service.id_registro}`}
                        size="sm"
                        variant="outline-primary"
                        className="me-2"
                      >
                        Ver detalles
                      </Button>
                      {service.estado === 'PENDIENTE' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline-success"
                            className="me-2"
                            onClick={() => {
                              clientService.authorizeService(service.id_registro)
                                .then(() => {
                                  // Refresh data
                                  service.estado = 'EN_PROCESO';
                                  setActiveServices([...activeServices]);
                                })
                                .catch((error) => {
                                  console.error('Error al autorizar servicio', error);
                                });
                            }}
                          >
                            Autorizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => {
                              clientService.notAuthorizeService(service.id_registro)
                                .then(() => {
                                  // Refresh data
                                  service.estado = 'CANCELADO';
                                  setActiveServices(activeServices.filter(s => s.id_registro !== service.id_registro));
                                })
                                .catch((error) => {
                                  console.error('Error al rechazar servicio', error);
                                });
                            }}
                          >
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
        <Col md={5} className="mb-3">
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Mis Vehículos</h5>
                <Button as={Link} to="/client/vehicles" size="sm" variant="primary">
                  Ver todos
                </Button>
              </div>
            </Card.Header>
            <Card.Body style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {vehicles.length === 0 ? (
                <div className="text-center py-4">
                  <i className="bi bi-car-front display-4 text-muted"></i>
                  <p className="mt-3 mb-0">No tienes vehículos registrados</p>
                </div>
              ) : (
                vehicles.slice(0, 5).map((vehicle) => (
                  <div key={vehicle.id_vehiculo} className="mb-3 p-3 border rounded">
                    <div className="d-flex align-items-center">
                      <div className="vehicle-icon me-3">
                        <i className="bi bi-car-front fs-3 text-primary"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">{vehicle.marca} {vehicle.modelo}</h6>
                        <div className="small mb-1">
                          <span className="text-muted">Placa:</span> {vehicle.placa}
                        </div>
                        <div className="small">
                          <span className="text-muted">Año:</span> {vehicle.anio} | 
                          <span className="text-muted ms-2">Color:</span> {vehicle.color}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex justify-content-end mt-2">
                      <Button
                        as={Link}
                        to={`/client/vehicles/history/${vehicle.id_vehiculo}`}
                        size="sm"
                        variant="outline-primary"
                      >
                        Ver historial
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
