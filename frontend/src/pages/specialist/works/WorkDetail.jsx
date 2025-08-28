import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Button, Tab, Tabs, Spinner, Alert, Form } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function WorkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [activeTab, setActiveTab] = useState('details');
  const [user, setUser] = useState(null);
  
  // Form states
  const [formLoading, setFormLoading] = useState(false);
  const [statusForm, setStatusForm] = useState({
    estado: '',
    observaciones_finalizacion: ''
  });

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

  useEffect(() => {
    const fetchWorkDetail = async () => {
      if (!user || !user.id_usuario) return;
      
      try {
        setLoading(true);
        // Get assigned works to find the current one
        const works = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        const currentWork = works.find(w => w.id_asignacion.toString() === id);
        
        if (!currentWork) {
          setError('Trabajo no encontrado o no tiene acceso a este trabajo');
          setLoading(false);
          return;
        }
        
        setWork(currentWork);
        setStatusForm({
          estado: currentWork.estado,
          observaciones_finalizacion: currentWork.observaciones_finalizacion || ''
        });
        
        // Load comments
        const workComments = await serviceSpecialistService.getCommentsByAssignment(id);
        setComments(workComments);
        
        // Load recommendations
        const workRecommendations = await serviceSpecialistService.getRecommendationsByAssignment(id);
        setRecommendations(workRecommendations);
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los detalles del trabajo: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchWorkDetail();
  }, [id, user]);

  const handleStatusChange = async (e) => {
    e.preventDefault();
    try {
      setFormLoading(true);
      
      await serviceSpecialistService.updateWorkAssignment(id, statusForm);
      
      // Update local state
      setWork({
        ...work,
        estado: statusForm.estado,
        observaciones_finalizacion: statusForm.observaciones_finalizacion
      });
      
      setFormLoading(false);
      alert('Estado actualizado correctamente');
    } catch (err) {
      setError('Error al actualizar el estado: ' + err.message);
      setFormLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
      case 'ASIGNADO':
        return <Badge bg="warning" className="fs-6">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary" className="fs-6">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="success" className="fs-6">Completado</Badge>;
      default:
        return <Badge bg="secondary" className="fs-6">{status}</Badge>;
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'No establecida';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
    return (
      <Alert variant="danger">
        <Alert.Heading>Error</Alert.Heading>
        <p>{error}</p>
        <hr />
        <div>
          <Link to="/specialist/works" className="btn btn-outline-primary">
            Volver a la lista de trabajos
          </Link>
        </div>
      </Alert>
    );
  }

  if (!work) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Trabajo no encontrado</Alert.Heading>
        <p>El trabajo solicitado no existe o no tiene acceso.</p>
        <hr />
        <div>
          <Link to="/specialist/works" className="btn btn-outline-primary">
            Volver a la lista de trabajos
          </Link>
        </div>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Detalle del Trabajo #{work.id_asignacion}</h1>
        <div className="d-flex gap-2">
          <Link to="/specialist/works" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-1"></i> Volver
          </Link>
          <Link to={`/specialist/works/${id}/update`} className="btn btn-primary">
            <i className="bi bi-pencil me-1"></i> Actualizar Estado
          </Link>
        </div>
      </div>

      <Row className="mb-4">
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-info-circle me-2"></i>
              Información del Trabajo
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-5">Tipo de Trabajo:</dt>
                    <dd className="col-sm-7">{work.TipoMantenimiento?.nombre_tipo}</dd>
                    
                    <dt className="col-sm-5">Estado:</dt>
                    <dd className="col-sm-7">{getStatusBadge(work.estado)}</dd>
                    
                    <dt className="col-sm-5">Fecha de Asignación:</dt>
                    <dd className="col-sm-7">{formatDate(work.fecha_asignacion)}</dd>
                    
                    <dt className="col-sm-5">Fecha de Inicio:</dt>
                    <dd className="col-sm-7">{work.fecha_inicio_real ? formatDate(work.fecha_inicio_real) : 'No iniciado'}</dd>
                  </dl>
                </Col>
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-5">ID del Servicio:</dt>
                    <dd className="col-sm-7">#{work.id_registro}</dd>
                    
                    <dt className="col-sm-5">Precio:</dt>
                    <dd className="col-sm-7">Q{work.precio}</dd>
                    
                    <dt className="col-sm-5">Fecha de Finalización:</dt>
                    <dd className="col-sm-7">{work.fecha_finalizacion ? formatDate(work.fecha_finalizacion) : 'No finalizado'}</dd>
                  </dl>
                </Col>
              </Row>
              
              <div className="mt-3">
                <h6>Descripción del Trabajo</h6>
                <p>{work.descripcion}</p>
              </div>
              
              {work.observaciones_finalizacion && (
                <div className="mt-3">
                  <h6>Observaciones de Finalización</h6>
                  <p>{work.observaciones_finalizacion}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-car-front me-2"></i>
              Información del Vehículo
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-4">Marca:</dt>
                    <dd className="col-sm-8">{work.RegistroServicioVehiculo?.Vehiculo?.marca}</dd>
                    
                    <dt className="col-sm-4">Modelo:</dt>
                    <dd className="col-sm-8">{work.RegistroServicioVehiculo?.Vehiculo?.modelo}</dd>
                    
                    <dt className="col-sm-4">Año:</dt>
                    <dd className="col-sm-8">{work.RegistroServicioVehiculo?.Vehiculo?.anio}</dd>
                  </dl>
                </Col>
                <Col md={6}>
                  <dl className="row">
                    <dt className="col-sm-4">Placa:</dt>
                    <dd className="col-sm-8">{work.RegistroServicioVehiculo?.Vehiculo?.placa}</dd>
                    
                    <dt className="col-sm-4">Color:</dt>
                    <dd className="col-sm-8">{work.RegistroServicioVehiculo?.Vehiculo?.color}</dd>
                  </dl>
                </Col>
              </Row>
              
              <div className="mt-3">
                <h6>Descripción del Problema</h6>
                <p>{work.RegistroServicioVehiculo?.descripcion_problema}</p>
              </div>
              
              {work.RegistroServicioVehiculo?.observaciones_iniciales && (
                <div className="mt-3">
                  <h6>Observaciones Iniciales</h6>
                  <p>{work.RegistroServicioVehiculo?.observaciones_iniciales}</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="d-flex align-items-center">
              <i className="bi bi-clock-history me-2"></i>
              Actualizar Estado
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleStatusChange}>
                <Form.Group className="mb-3">
                  <Form.Label>Estado del Trabajo</Form.Label>
                  <Form.Select 
                    value={statusForm.estado} 
                    onChange={(e) => setStatusForm({...statusForm, estado: e.target.value})}
                    required
                  >
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="ASIGNADO">Asignado</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="COMPLETADO">Completado</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Observaciones de Finalización</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    value={statusForm.observaciones_finalizacion} 
                    onChange={(e) => setStatusForm({...statusForm, observaciones_finalizacion: e.target.value})}
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button variant="primary" type="submit" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                        Actualizando...
                      </>
                    ) : (
                      'Actualizar Estado'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-chat-square-text me-2"></i>
                Comentarios
              </div>
              <Link to={`/specialist/comments/create?workId=${id}`} className="btn btn-sm btn-outline-primary">
                <i className="bi bi-plus-circle me-1"></i> Agregar
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {comments.length === 0 ? (
                <div className="text-center p-3">
                  <p className="text-muted mb-0">No hay comentarios registrados</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {comments.map(comment => (
                    <div key={comment.id_comentario} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {new Date(comment.fecha_comentario).toLocaleDateString()}
                        </small>
                        <Badge bg="info">{comment.tipo_comentario}</Badge>
                      </div>
                      <p className="mb-0 mt-1">{comment.comentario}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-lightbulb me-2"></i>
                Recomendaciones
              </div>
              <Link to={`/specialist/recommendations/create?workId=${id}`} className="btn btn-sm btn-outline-primary">
                <i className="bi bi-plus-circle me-1"></i> Agregar
              </Link>
            </Card.Header>
            <Card.Body className="p-0">
              {recommendations.length === 0 ? (
                <div className="text-center p-3">
                  <p className="text-muted mb-0">No hay recomendaciones registradas</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {recommendations.map(recommendation => (
                    <div key={recommendation.id_recomendacion} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">
                          {new Date(recommendation.fecha_recomendacion).toLocaleDateString()}
                        </small>
                        <Badge bg={
                          recommendation.prioridad === 'alta' ? 'danger' :
                          recommendation.prioridad === 'media' ? 'warning' : 'info'
                        }>{recommendation.prioridad}</Badge>
                      </div>
                      <p className="mb-1 mt-1">{recommendation.recomendacion}</p>
                      <small className="text-muted">Tipo: {recommendation.tipo_recomendacion}</small>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={12}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <i className="bi bi-tools me-2"></i>
                Herramientas de Diagnóstico
              </div>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-3 justify-content-center">
                <Button 
                  as={Link} 
                  to={`/specialist/diagnostics/create?workId=${id}`} 
                  variant="outline-primary" 
                  className="p-3 d-flex flex-column align-items-center" 
                  style={{ width: '180px' }}
                >
                  <i className="bi bi-clipboard-check fs-2 mb-2"></i>
                  Crear Diagnóstico
                </Button>
                
                <Button 
                  as={Link} 
                  to={`/specialist/tests/create?workId=${id}`} 
                  variant="outline-info" 
                  className="p-3 d-flex flex-column align-items-center" 
                  style={{ width: '180px' }}
                >
                  <i className="bi bi-speedometer2 fs-2 mb-2"></i>
                  Nueva Prueba Técnica
                </Button>
                
                <Button 
                  as={Link} 
                  to={`/specialist/support/create?workId=${id}`} 
                  variant="outline-secondary" 
                  className="p-3 d-flex flex-column align-items-center" 
                  style={{ width: '180px' }}
                >
                  <i className="bi bi-people fs-2 mb-2"></i>
                  Solicitar Apoyo
                </Button>
                
                <Button 
                  as={Link} 
                  to={`/specialist/history/${work.RegistroServicioVehiculo?.Vehiculo?.id_vehiculo}`} 
                  variant="outline-dark" 
                  className="p-3 d-flex flex-column align-items-center" 
                  style={{ width: '180px' }}
                >
                  <i className="bi bi-clock-history fs-2 mb-2"></i>
                  Historial del Vehículo
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
