import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function AdditionalServices() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const serviceId = searchParams.get('serviceId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Request form state
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [maintenanceTypes, setMaintenanceTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [requestFormData, setRequestFormData] = useState({
    id_registro: serviceId || '',
    id_tipo_trabajo: '',
    descripcion: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

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

  // Fetch additional services and active services
  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        
        // Fetch additional services
        const additionalServicesData = await clientService.getAdditionalServices(user.id_usuario);
        setAdditionalServices(additionalServicesData);
        
        // Fetch active services for form selection
        const servicesData = await clientService.getAllServices(user.id_usuario);
        const activeServicesData = servicesData.filter(service => 
          service.estado === 'EN_PROCESO' || service.estado === 'PENDIENTE'
        );
        setActiveServices(activeServicesData);
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los servicios adicionales: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch maintenance types when opening the modal
  useEffect(() => {
    const fetchMaintenanceTypes = async () => {
      if (!showRequestModal) return;
      
      try {
        setLoadingTypes(true);
        const types = await clientService.getMaintenanceTypes();
        setMaintenanceTypes(types);
        setLoadingTypes(false);
      } catch (err) {
        setError('Error al cargar los tipos de mantenimiento: ' + err.message);
        setLoadingTypes(false);
      }
    };
    
    fetchMaintenanceTypes();
  }, [showRequestModal]);

  // Handle form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRequestFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit request form
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    
    if (!requestFormData.id_registro || !requestFormData.id_tipo_trabajo || !requestFormData.descripcion) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }
    
    try {
      setSubmitting(true);
      await clientService.addAdditionalService(requestFormData);
      setSuccess(true);
      
      // Refresh data and reset form
      const updatedServices = await clientService.getAdditionalServices(user.id_usuario);
      setAdditionalServices(updatedServices);
      
      setRequestFormData({
        id_registro: '',
        id_tipo_trabajo: '',
        descripcion: ''
      });
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowRequestModal(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Error al solicitar el servicio adicional: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Get service status badge
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

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Q0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  // Filter additional services based on search term
  const filteredServices = additionalServices.filter(service => {
    const searchLower = searchTerm.toLowerCase();
    return (
      service.descripcion?.toLowerCase().includes(searchLower) ||
      service.TipoMantenimiento?.nombre_tipo?.toLowerCase().includes(searchLower) ||
      service.RegistroServicioVehiculo?.Vehiculo?.marca?.toLowerCase().includes(searchLower) ||
      service.RegistroServicioVehiculo?.Vehiculo?.modelo?.toLowerCase().includes(searchLower) ||
      service.RegistroServicioVehiculo?.Vehiculo?.placa?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando servicios adicionales...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Servicios Adicionales</h1>
        <Button 
          variant="primary" 
          onClick={() => setShowRequestModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Solicitar Servicio Adicional
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
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar servicios adicionales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          {additionalServices.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-tools display-4 text-muted"></i>
              <p className="mt-3">No tiene servicios adicionales solicitados</p>
              <Button 
                variant="primary" 
                onClick={() => setShowRequestModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Solicitar mi primer servicio adicional
              </Button>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-4">
              <p>No se encontraron resultados para "{searchTerm}"</p>
              <Button 
                variant="outline-secondary"
                onClick={() => setSearchTerm('')}
              >
                Limpiar búsqueda
              </Button>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Vehículo</th>
                    <th>Tipo</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Costo Est.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map(service => (
                    <tr key={service.id_servicio_adicional}>
                      <td>{formatDate(service.fecha_solicitud)}</td>
                      <td>
                        <div>{service.RegistroServicioVehiculo?.Vehiculo?.marca} {service.RegistroServicioVehiculo?.Vehiculo?.modelo}</div>
                        <small className="text-muted">{service.RegistroServicioVehiculo?.Vehiculo?.placa}</small>
                      </td>
                      <td>{service.TipoMantenimiento?.nombre_tipo}</td>
                      <td style={{ maxWidth: '300px' }}>{service.descripcion}</td>
                      <td>{getStatusBadge(service.estado)}</td>
                      <td>{service.costo_estimado ? formatCurrency(service.costo_estimado) : 'Pendiente'}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Request Additional Service Modal */}
      <Modal 
        show={showRequestModal} 
        onHide={() => setShowRequestModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Solicitar Servicio Adicional</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {success && (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              Solicitud enviada exitosamente
            </Alert>
          )}
          
          <Form onSubmit={handleSubmitRequest}>
            <Form.Group className="mb-3">
              <Form.Label>Servicio Actual</Form.Label>
              <Form.Select
                name="id_registro"
                value={requestFormData.id_registro}
                onChange={handleFormChange}
                disabled={submitting || !!serviceId}
                required
              >
                <option value="">Seleccione un servicio</option>
                {activeServices.map(service => (
                  <option key={service.id_registro} value={service.id_registro}>
                    #{service.id_registro} - {service.Vehiculo?.marca} {service.Vehiculo?.modelo} ({service.Vehiculo?.placa})
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                Seleccione el servicio al que desea agregar este servicio adicional.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Mantenimiento</Form.Label>
              {loadingTypes ? (
                <div className="d-flex align-items-center mb-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  <span>Cargando tipos de mantenimiento...</span>
                </div>
              ) : (
                <Form.Select
                  name="id_tipo_trabajo"
                  value={requestFormData.id_tipo_trabajo}
                  onChange={handleFormChange}
                  disabled={submitting}
                  required
                >
                  <option value="">Seleccione un tipo de mantenimiento</option>
                  {maintenanceTypes.map(type => (
                    <option key={type.id_tipo_trabajo} value={type.id_tipo_trabajo}>
                      {type.nombre_tipo} - Precio Base: {formatCurrency(type.precio_base)}
                    </option>
                  ))}
                </Form.Select>
              )}
              <Form.Text className="text-muted">
                El precio final puede variar según la inspección técnica.
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="descripcion"
                value={requestFormData.descripcion}
                onChange={handleFormChange}
                placeholder="Describa el servicio adicional que necesita..."
                disabled={submitting}
                required
              />
              <Form.Text className="text-muted">
                Sea lo más específico posible sobre lo que necesita.
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end mt-4">
              <Button
                variant="secondary"
                onClick={() => setShowRequestModal(false)}
                className="me-2"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={submitting || !requestFormData.id_registro || !requestFormData.id_tipo_trabajo}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enviando...
                  </>
                ) : (
                  'Enviar Solicitud'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
