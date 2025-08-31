import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Row, Col, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function ServicesList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [modalAction, setModalAction] = useState(null); // 'authorize' or 'reject'

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

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        const data = await clientService.getAllServices(user.id_usuario);
        setServices(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los servicios: ' + err.message);
        setLoading(false);
      }
    };

    fetchServices();
  }, [user]);

  // Filter services based on search term and status
  const filteredServices = services.filter(service => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      service.descripcion_problema?.toLowerCase().includes(searchTermLower) ||
      service.Vehiculo?.marca?.toLowerCase().includes(searchTermLower) ||
      service.Vehiculo?.modelo?.toLowerCase().includes(searchTermLower) ||
      service.Vehiculo?.placa?.toLowerCase().includes(searchTermLower);
    
    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && service.estado === filterStatus;
  });

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
      month: 'short',
      year: 'numeric'
    });
  };

  // Handle service authorization modal
  const openAuthorizeModal = (service) => {
    setSelectedService(service);
    setModalAction('authorize');
    setShowModal(true);
  };

  // Handle service rejection modal
  const openRejectModal = (service) => {
    setSelectedService(service);
    setModalAction('reject');
    setShowModal(true);
  };

  // Handle service authorization
  const handleAuthorizeService = async () => {
    try {
      await clientService.authorizeService(selectedService.id_registro);
      // Update the service in the list
      setServices(services.map(service => 
        service.id_registro === selectedService.id_registro 
          ? { ...service, estado: 'EN_PROCESO' } 
          : service
      ));
      setShowModal(false);
    } catch (err) {
      setError('Error al autorizar el servicio: ' + err.message);
    }
  };

  // Handle service rejection
  const handleRejectService = async () => {
    try {
      await clientService.notAuthorizeService(selectedService.id_registro);
      // Update the service in the list
      setServices(services.map(service => 
        service.id_registro === selectedService.id_registro 
          ? { ...service, estado: 'CANCELADO' } 
          : service
      ));
      setShowModal(false);
    } catch (err) {
      setError('Error al rechazar el servicio: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando servicios...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Mis Servicios</h1>
        <Button as={Link} to="/client/services/quote" variant="primary">
          <i className="bi bi-plus-circle me-2"></i>
          Solicitar Cotización
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={8}>
              <InputGroup>
                <InputGroup.Text>
                  <i className="bi bi-search"></i>
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar servicios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Todos los estados</option>
                <option value="PENDIENTE">Pendientes</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="COMPLETADO">Completados</option>
                <option value="CANCELADO">Cancelados</option>
              </Form.Select>
            </Col>
          </Row>
          
          {filteredServices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-tools display-4 text-muted"></i>
              <p className="mt-3">No se encontraron servicios</p>
              <Link to="/client/services/quote" className="btn btn-primary mt-2">
                <i className="bi bi-plus-circle me-2"></i>
                Solicitar Cotización
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehículo</th>
                    <th>Problema</th>
                    <th>Fecha Ingreso</th>
                    <th>Fecha Estimada</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id_registro}>
                      <td>{service.id_registro}</td>
                      <td>
                        <div>{service.Vehiculo?.marca} {service.Vehiculo?.modelo}</div>
                        <small className="text-muted">{service.Vehiculo?.placa}</small>
                      </td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {service.descripcion_problema}
                        </div>
                      </td>
                      <td>{formatDate(service.fecha_ingreso)}</td>
                      <td>{formatDate(service.fecha_estimada_finalizacion)}</td>
                      <td>{getStatusBadge(service.estado)}</td>
                      <td>
                        <div className="d-flex gap-1">
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            as={Link}
                            to={`/client/services/detail/${service.id_registro}`}
                            title="Ver detalles"
                          >
                            <i className="bi bi-eye"></i>
                          </Button>
                          
                          {service.estado === 'PENDIENTE' && (
                            <>
                              <Button 
                                variant="outline-success" 
                                size="sm"
                                onClick={() => openAuthorizeModal(service)}
                                title="Autorizar servicio"
                              >
                                <i className="bi bi-check-lg"></i>
                              </Button>
                              
                              <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => openRejectModal(service)}
                                title="Rechazar servicio"
                              >
                                <i className="bi bi-x-lg"></i>
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Confirmation Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalAction === 'authorize' ? 'Autorizar Servicio' : 'Rechazar Servicio'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedService && (
            <div>
              <p>
                {modalAction === 'authorize' 
                  ? '¿Está seguro que desea autorizar este servicio?' 
                  : '¿Está seguro que desea rechazar este servicio?'
                }
              </p>
              <div className="bg-light p-3 rounded">
                <h6>Detalles del Servicio:</h6>
                <p><strong>Vehículo:</strong> {selectedService.Vehiculo?.marca} {selectedService.Vehiculo?.modelo}</p>
                <p><strong>Placa:</strong> {selectedService.Vehiculo?.placa}</p>
                <p><strong>Problema:</strong> {selectedService.descripcion_problema}</p>
              </div>
              {modalAction === 'reject' && (
                <div className="mt-3">
                  <Alert variant="warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    Rechazar un servicio cancelará todas las tareas asociadas y no podrá revertirse.
                  </Alert>
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant={modalAction === 'authorize' ? 'success' : 'danger'} 
            onClick={modalAction === 'authorize' ? handleAuthorizeService : handleRejectService}
          >
            {modalAction === 'authorize' ? 'Autorizar' : 'Rechazar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
