import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Spinner, Alert, Nav, Tab, Row, Col, Form, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { requestClientAdminService } from '../../../services/requestClientAdminService';
import { userService } from '../../../services/adminService';

export default function AllRequestsManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [additionalServices, setAdditionalServices] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('additionalServices');
  const [searchTerm, setSearchTerm] = useState('');
  
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
    
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch additional services
      const servicesData = await requestClientAdminService.getAdditionalServices();
      setAdditionalServices(servicesData);
      
      // Fetch clients
      const clientsData = await userService.getAllUsers();
      const onlyClients = clientsData.filter(u => u.Rol?.nombre_rol === 'CLIENTE');
      setClients(onlyClients);
      
      // Fetch quotes for first client if exists
      if (onlyClients.length > 0) {
        const firstClientId = onlyClients[0].id_usuario;
        const quotesData = await requestClientAdminService.getPriceServiceQuotes(firstClientId);
        setQuotes(quotesData);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
      setLoading(false);
    }
  };

  const loadClientQuotes = async (clientId) => {
    try {
      const quotesData = await requestClientAdminService.getPriceServiceQuotes(clientId);
      setQuotes(quotesData);
    } catch (err) {
      console.error('Error loading client quotes:', err);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'APROBADO':
        return <Badge bg="success">Aprobado</Badge>;
      case 'RECHAZADO':
        return <Badge bg="danger">Rechazado</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="info">Completado</Badge>;
      case 'ENVIADO':
        return <Badge bg="success">Enviado</Badge>;
      case 'ACEPTADO':
        return <Badge bg="info">Aceptado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const filteredServices = additionalServices.filter(service => {
    if (!searchTerm) return true;
    
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (service.RegistroServicioVehiculo?.Vehiculo?.marca || '').toLowerCase().includes(searchTermLower) ||
      (service.RegistroServicioVehiculo?.Vehiculo?.modelo || '').toLowerCase().includes(searchTermLower) ||
      (service.RegistroServicioVehiculo?.Vehiculo?.placa || '').toLowerCase().includes(searchTermLower) ||
      (service.TipoMantenimiento?.nombre_tipo || '').toLowerCase().includes(searchTermLower) ||
      (service.descripcion || '').toLowerCase().includes(searchTermLower)
    );
  });

  const pendingServicesCount = additionalServices.filter(s => s.estado === 'PENDIENTE').length;
  const pendingQuotesCount = quotes.filter(q => q.estado === 'PENDIENTE').length;

  // Calculate total for a quote
  const calculateQuoteTotal = (quote) => {
    if (!quote.TrabajosCotizacions || quote.TrabajosCotizacions.length === 0) {
      return 0;
    }
    
    return quote.TrabajosCotizacions.reduce((total, work) => total + parseFloat(work.precio || 0), 0);
  };

  const renderTabs = () => (
    <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
      <Row>
        <Col sm={12}>
          <Nav variant="tabs" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="additionalServices">
                Servicios Adicionales
                {pendingServicesCount > 0 && (
                  <Badge bg="warning" pill className="ms-1">
                    {pendingServicesCount}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="quotations">
                Cotizaciones
                {pendingQuotesCount > 0 && (
                  <Badge bg="warning" pill className="ms-1">
                    {pendingQuotesCount}
                  </Badge>
                )}
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Col>
        <Col sm={12}>
          <Tab.Content>
            <Tab.Pane eventKey="additionalServices">
              <Card>
                <Card.Header className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Servicios Adicionales</h5>
                    <InputGroup style={{ width: '300px' }}>
                      <InputGroup.Text>
                        <i className="bi bi-search"></i>
                      </InputGroup.Text>
                      <Form.Control
                        placeholder="Buscar servicios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </InputGroup>
                  </div>
                </Card.Header>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Vehículo</th>
                        <th>Tipo de Trabajo</th>
                        <th>Descripción</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2 mb-0">Cargando servicios adicionales...</p>
                          </td>
                        </tr>
                      ) : filteredServices.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            {searchTerm ? (
                              <>
                                <i className="bi bi-search fs-1 text-muted"></i>
                                <p className="mt-2 mb-0">No se encontraron servicios que coincidan con "{searchTerm}"</p>
                              </>
                            ) : (
                              <>
                                <i className="bi bi-inbox fs-1 text-muted"></i>
                                <p className="mt-2 mb-0">No hay servicios adicionales disponibles</p>
                              </>
                            )}
                          </td>
                        </tr>
                      ) : (
                        filteredServices.map(service => (
                          <tr key={service.id_servicio_adicional}>
                            <td>{service.id_servicio_adicional}</td>
                            <td>
                              <div>{service.RegistroServicioVehiculo?.Vehiculo?.marca} {service.RegistroServicioVehiculo?.Vehiculo?.modelo}</div>
                              <small className="text-muted">{service.RegistroServicioVehiculo?.Vehiculo?.placa}</small>
                            </td>
                            <td>{service.TipoMantenimiento?.nombre_tipo}</td>
                            <td>
                              <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {service.descripcion}
                              </div>
                            </td>
                            <td>
                              {new Date(service.fecha_solicitud).toLocaleDateString('es-ES', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </td>
                            <td>{getStatusBadge(service.estado)}</td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button 
                                  variant="primary" 
                                  size="sm" 
                                  as={Link}
                                  to="/admin/requests/additional-services"
                                  title="Ver Detalles"
                                >
                                  <i className="bi bi-eye"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </Tab.Pane>
            <Tab.Pane eventKey="quotations">
              <Card className="mb-4">
                <Card.Header>
                  <h5 className="mb-0">Seleccionar Cliente</h5>
                </Card.Header>
                <Card.Body>
                  <Form.Group>
                    <Form.Label>Cliente</Form.Label>
                    <Form.Select onChange={(e) => loadClientQuotes(e.target.value)}>
                      <option value="">Seleccione un cliente</option>
                      {clients.map(client => (
                        <option key={client.id_usuario} value={client.id_usuario}>
                          {client.Persona?.nombre} {client.Persona?.apellido} ({client.nombre_usuario})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Card.Body>
              </Card>

              <Card>
                <Card.Header>
                  <h5 className="mb-0">Cotizaciones del Cliente</h5>
                </Card.Header>
                <div className="table-responsive">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Vehículo</th>
                        <th>Problema</th>
                        <th>Fecha</th>
                        <th>Trabajos</th>
                        <th>Total</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <i className="bi bi-clipboard-x fs-1 text-muted"></i>
                            <p className="mt-2 mb-0">No hay cotizaciones disponibles para este cliente</p>
                          </td>
                        </tr>
                      ) : (
                        quotes.map(quote => (
                          <tr key={quote.id_registro_cotizacion}>
                            <td>{quote.id_registro_cotizacion}</td>
                            <td>
                              <div>{quote.Vehiculo?.marca} {quote.Vehiculo?.modelo}</div>
                              <small className="text-muted">{quote.Vehiculo?.placa}</small>
                            </td>
                            <td>
                              <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {quote.descripcion_problema}
                              </div>
                            </td>
                            <td>
                              {new Date(quote.fecha_cotizacion).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </td>
                            <td className="text-center">
                              <Badge bg="info">{quote.TrabajosCotizacions?.length || 0}</Badge>
                            </td>
                            <td className="text-end">
                              Q{calculateQuoteTotal(quote).toFixed(2)}
                            </td>
                            <td>{getStatusBadge(quote.estado)}</td>
                            <td>
                              <Button 
                                variant="primary" 
                                size="sm"
                                as={Link}
                                to="/admin/requests/quotations"
                                title="Ver Detalles"
                              >
                                <i className="bi bi-eye"></i>
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </div>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Tab.Container>
  );

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Todas las Solicitudes</h1>
        <div>
          <Link to="/admin/requests" className="btn btn-outline-secondary me-2">
            <i className="bi bi-arrow-left me-1"></i>
            Volver al Dashboard
          </Link>
          <Button variant="primary" onClick={fetchData}>
            <i className="bi bi-arrow-clockwise me-1"></i>
            Actualizar
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </Alert>
      )}
      
      <div className="mb-4">
        <Row>
          <Col md={3}>
            <Card className="bg-light h-100">
              <Card.Body className="d-flex flex-column">
                <div className="mb-3 text-warning">
                  <i className="bi bi-exclamation-triangle-fill display-4"></i>
                </div>
                <h3>Pendientes</h3>
                <p className="text-muted">Servicios y cotizaciones que requieren atención</p>
                <div className="mt-auto">
                  <h2>{pendingServicesCount + pendingQuotesCount}</h2>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="bg-light h-100">
              <Card.Body className="d-flex flex-column">
                <div className="mb-3 text-success">
                  <i className="bi bi-check-circle-fill display-4"></i>
                </div>
                <h3>Aprobados</h3>
                <p className="text-muted">Solicitudes que han sido aprobadas</p>
                <div className="mt-auto">
                  <h2>{additionalServices.filter(s => s.estado === 'APROBADO').length}</h2>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="bg-light h-100">
              <Card.Body className="d-flex flex-column">
                <div className="mb-3 text-danger">
                  <i className="bi bi-x-circle-fill display-4"></i>
                </div>
                <h3>Rechazados</h3>
                <p className="text-muted">Solicitudes que han sido rechazadas</p>
                <div className="mt-auto">
                  <h2>{additionalServices.filter(s => s.estado === 'RECHAZADO').length}</h2>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="bg-light h-100">
              <Card.Body className="d-flex flex-column">
                <div className="mb-3 text-info">
                  <i className="bi bi-people-fill display-4"></i>
                </div>
                <h3>Clientes</h3>
                <p className="text-muted">Clientes con solicitudes</p>
                <div className="mt-auto">
                  <h2>{clients.length}</h2>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
      
      {/* Tabs for services and quotations */}
      {renderTabs()}
    </div>
  );
}
