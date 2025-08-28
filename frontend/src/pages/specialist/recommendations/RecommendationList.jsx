import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function RecommendationList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState([]);
  const [works, setWorks] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWork, setSelectedWork] = useState('');
  const [user, setUser] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState(null);
  const [workDetails, setWorkDetails] = useState(null);

  // Get user from localStorage
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

  // Fetch works assigned to this specialist
  useEffect(() => {
    const fetchWorks = async () => {
      if (!user?.id_usuario) return;
      
      try {
        setLoading(true);
        const data = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        setWorks(data);
        
        // If we have works, fetch recommendations for the first one by default
        if (data.length > 0) {
          setSelectedWork(data[0].id_asignacion);
          const recData = await serviceSpecialistService.getRecommendationsByAssignment(data[0].id_asignacion);
          setRecommendations(recData);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchWorks();
  }, [user]);

  // When selected work changes, fetch recommendations for that work
  const handleWorkChange = async (workId) => {
    setSelectedWork(workId);
    
    if (!workId) {
      setRecommendations([]);
      return;
    }
    
    try {
      setLoading(true);
      const data = await serviceSpecialistService.getRecommendationsByAssignment(workId);
      setRecommendations(data);
      
      // Store work details for reference in modal
      const workDetail = works.find(w => w.id_asignacion.toString() === workId);
      setWorkDetails(workDetail);
      
      setLoading(false);
    } catch (err) {
      setError('Error al cargar las recomendaciones: ' + err.message);
      setLoading(false);
    }
  };

  // Open modal with recommendation details
  const handleViewRecommendation = (recommendation) => {
    setSelectedRecommendation(recommendation);
    setShowModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRecommendation(null);
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'ALTA':
      case 'URGENTE':
        return <Badge bg="danger">{priority}</Badge>;
      case 'MEDIA':
        return <Badge bg="warning">{priority}</Badge>;
      case 'BAJA':
        return <Badge bg="info">{priority}</Badge>;
      default:
        return <Badge bg="secondary">{priority}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get formatted type
  const getFormattedType = (type) => {
    if (!type) return '';
    
    // Convert from backend format to readable format
    switch (type.toUpperCase()) {
      case 'MANTENIMIENTO_PREVENTIVO':
        return 'Mantenimiento Preventivo';
      case 'REPARACION_FUTURA':
        return 'Reparación Futura';
      case 'CAMBIO_HABITOS':
        return 'Cambio de Hábitos';
      default:
        return type;
    }
  };

  // Filter recommendations based on search term
  const filteredRecommendations = recommendations.filter(rec =>
    rec.recomendacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.tipo_recomendacion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.prioridad?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && !recommendations.length) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando recomendaciones...</p>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Recomendaciones</h1>
        <Button as={Link} to="/specialist/recommendations/create" variant="primary">
          <i className="bi bi-plus-circle me-2"></i> Nueva Recomendación
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Seleccionar Trabajo</Form.Label>
            <Form.Select 
              value={selectedWork} 
              onChange={(e) => handleWorkChange(e.target.value)}
            >
              <option value="">Todos los trabajos</option>
              {works.map(work => (
                <option key={work.id_asignacion} value={work.id_asignacion}>
                  #{work.id_asignacion} - {work.TipoMantenimiento?.nombre_tipo} - {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          
          {/* Display selected work information */}
          {selectedWork && workDetails && (
            <div className="selected-work-info bg-light p-3 rounded mb-3">
              <h6 className="mb-2">Información del trabajo seleccionado</h6>
              <Row>
                <Col md={6}>
                  <div className="mb-1">
                    <strong>Vehículo:</strong> {workDetails.RegistroServicioVehiculo?.Vehiculo?.marca} {workDetails.RegistroServicioVehiculo?.Vehiculo?.modelo}
                  </div>
                  <div className="mb-1">
                    <strong>Placa:</strong> {workDetails.RegistroServicioVehiculo?.Vehiculo?.placa}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-1">
                    <strong>Estado:</strong> {workDetails.estado}
                  </div>
                  <div>
                    <strong>Tipo:</strong> {workDetails.TipoMantenimiento?.nombre_tipo}
                  </div>
                </Col>
              </Row>
            </div>
          )}
          
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar recomendaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" size="sm">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <span className="ms-2">Cargando...</span>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-lightbulb display-4 text-muted"></i>
              <p className="mt-3">No se encontraron recomendaciones</p>
              {selectedWork && (
                <Link to={`/specialist/recommendations/create?workId=${selectedWork}`} className="btn btn-primary mt-2">
                  <i className="bi bi-plus-circle me-2"></i>
                  Agregar recomendación para este trabajo
                </Link>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Recomendación</th>
                    <th>Prioridad</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecommendations.map(rec => (
                    <tr key={rec.id_recomendacion}>
                      <td>{rec.id_recomendacion}</td>
                      <td>{formatDate(rec.fecha_recomendacion)}</td>
                      <td>{getFormattedType(rec.tipo_recomendacion)}</td>
                      <td>
                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {rec.recomendacion}
                        </div>
                      </td>
                      <td>{getPriorityBadge(rec.prioridad)}</td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewRecommendation(rec)}
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Recommendation Detail Modal */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>
            <div className="d-flex align-items-center">
              <i className="bi bi-lightbulb me-2 text-warning"></i>
              <span>Detalle de la Recomendación</span>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRecommendation && (
            <>
              <div className="recommendation-header d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Recomendación #{selectedRecommendation.id_recomendacion}</h5>
                <div>
                  <span className="me-2">Prioridad:</span>
                  {getPriorityBadge(selectedRecommendation.prioridad)}
                </div>
              </div>
              
              <Row className="mb-4">
                <Col md={6}>
                  <div className="detail-item mb-2">
                    <strong>Fecha:</strong> {formatDate(selectedRecommendation.fecha_recomendacion)}
                  </div>
                  <div className="detail-item">
                    <strong>Tipo:</strong> {getFormattedType(selectedRecommendation.tipo_recomendacion)}
                  </div>
                </Col>
                <Col md={6}>
                  <div className="detail-item mb-2">
                    <strong>ID Trabajo:</strong> #{selectedRecommendation.id_asignacion_trabajo}
                  </div>
                </Col>
              </Row>
              
              <div className="recommendation-content p-3 bg-light rounded mb-3">
                <h6 className="border-bottom pb-2 mb-3">Texto de la Recomendación</h6>
                <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>{selectedRecommendation.recomendacion}</p>
              </div>
              
              {workDetails && (
                <div className="vehicle-details border-top pt-3 mt-3">
                  <h6 className="mb-3">Información del Vehículo</h6>
                  <Row>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <strong>Marca/Modelo:</strong> {workDetails.RegistroServicioVehiculo?.Vehiculo?.marca} {workDetails.RegistroServicioVehiculo?.Vehiculo?.modelo}
                      </div>
                      <div className="detail-item">
                        <strong>Placa:</strong> {workDetails.RegistroServicioVehiculo?.Vehiculo?.placa}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div className="detail-item mb-2">
                        <strong>Año:</strong> {workDetails.RegistroServicioVehiculo?.Vehiculo?.anio}
                      </div>
                      <div className="detail-item">
                        <strong>Color:</strong> {workDetails.RegistroServicioVehiculo?.Vehiculo?.color}
                      </div>
                    </Col>
                  </Row>
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cerrar
          </Button>
          {selectedRecommendation && (
            <Link 
              to={`/specialist/works/${selectedRecommendation.id_asignacion_trabajo}`} 
              className="btn btn-primary"
            >
              Ver Trabajo Relacionado
            </Link>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
