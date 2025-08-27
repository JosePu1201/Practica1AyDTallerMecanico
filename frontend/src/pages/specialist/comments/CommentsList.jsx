import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function CommentsList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadingWorks, setLoadingWorks] = useState(true);
  const [user, setUser] = useState(null);
  const [works, setWorks] = useState([]);
  const [selectedWorkId, setSelectedWorkId] = useState('');
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedComment, setSelectedComment] = useState(null);

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

  // Fetch assigned works for dropdown when user is loaded
  useEffect(() => {
    const fetchAssignedWorks = async () => {
      if (!user?.id_usuario) return;
      
      try {
        setLoadingWorks(true);
        const works = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        setWorks(works);
        
        // If we have works, select the first one and fetch its comments
        if (works.length > 0) {
          setSelectedWorkId(works[0].id_asignacion.toString());
        }
        
        setLoadingWorks(false);
      } catch (err) {
        setError('Error al cargar los trabajos asignados: ' + err.message);
        setLoadingWorks(false);
      }
    };
    
    fetchAssignedWorks();
  }, [user]);

  // Fetch comments when work is selected
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedWorkId) {
        setComments([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const comments = await serviceSpecialistService.getCommentsByAssignment(selectedWorkId);
        setComments(comments);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los comentarios: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchComments();
  }, [selectedWorkId]);

  const handleWorkChange = (e) => {
    setSelectedWorkId(e.target.value);
  };

  const handleViewComment = (comment) => {
    setSelectedComment(comment);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedComment(null);
  };

  const getCommentTypeBadge = (type) => {
    switch (type.toLowerCase()) {
      case 'problema':
        return <Badge bg="danger">{type}</Badge>;
      case 'advertencia':
        return <Badge bg="warning">{type}</Badge>;
      case 'observación':
        return <Badge bg="info">{type}</Badge>;
      case 'nota':
        return <Badge bg="secondary">{type}</Badge>;
      default:
        return <Badge bg="primary">{type}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter comments based on search
  const filteredComments = comments.filter(comment => 
    comment.comentario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comment.tipo_comentario?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedWorkDetails = () => {
    if (!selectedWorkId) return null;
    return works.find(work => work.id_asignacion.toString() === selectedWorkId);
  };

  if (loadingWorks) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando trabajos...</p>
      </div>
    );
  }

  const selectedWork = getSelectedWorkDetails();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Comentarios de Trabajos</h1>
        <Button 
          as={Link} 
          to="/specialist/comments/create" 
          variant="primary"
        >
          <i className="bi bi-plus-circle me-2"></i>
          Nuevo Comentario
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      <Card className="mb-4">
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Seleccionar Trabajo</Form.Label>
            <Form.Select
              value={selectedWorkId}
              onChange={handleWorkChange}
              disabled={loading}
            >
              <option value="">Seleccione un trabajo</option>
              {works.map(work => (
                <option key={work.id_asignacion} value={work.id_asignacion}>
                  #{work.id_asignacion} - {work.TipoMantenimiento?.nombre_tipo} - 
                  {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {/* Display selected work info */}
          {selectedWork && (
            <div className="selected-work bg-light p-3 rounded mb-3">
              <h6>Información del Trabajo Seleccionado</h6>
              <Row>
                <Col md={6}>
                  <div><strong>Vehículo:</strong> {selectedWork.RegistroServicioVehiculo?.Vehiculo?.marca} {selectedWork.RegistroServicioVehiculo?.Vehiculo?.modelo}</div>
                  <div><strong>Placa:</strong> {selectedWork.RegistroServicioVehiculo?.Vehiculo?.placa}</div>
                </Col>
                <Col md={6}>
                  <div><strong>Tipo:</strong> {selectedWork.TipoMantenimiento?.nombre_tipo}</div>
                  <div><strong>Estado:</strong> {selectedWork.estado}</div>
                </Col>
              </Row>
              <div className="mt-2">
                <strong>Descripción:</strong> {selectedWork.descripcion}
              </div>
            </div>
          )}

          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar comentarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Body>
      </Card>

      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </Spinner>
              <p className="mt-2">Cargando comentarios...</p>
            </div>
          ) : !selectedWorkId ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-square-text display-4 text-muted"></i>
              <p className="mt-3">Seleccione un trabajo para ver sus comentarios</p>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-square display-4 text-muted"></i>
              <p className="mt-3">No hay comentarios para este trabajo</p>
              <Link 
                to={`/specialist/comments/create?workId=${selectedWorkId}`}
                className="btn btn-primary"
              >
                <i className="bi bi-plus-circle me-2"></i>
                Agregar Comentario
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Comentario</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComments.map(comment => (
                    <tr key={comment.id_comentario}>
                      <td>{formatDate(comment.fecha_comentario)}</td>
                      <td>{getCommentTypeBadge(comment.tipo_comentario)}</td>
                      <td>
                        <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {comment.comentario}
                        </div>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleViewComment(comment)}
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

      {/* Comment Detail Modal */}
      <Modal show={showModal} onHide={closeModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {getCommentTypeBadge(selectedComment?.tipo_comentario || '')}
            <span className="ms-2">Detalle del Comentario</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedComment && (
            <>
              <div className="mb-3">
                <small className="text-muted">Fecha:</small>
                <p>{formatDate(selectedComment.fecha_comentario)}</p>
              </div>
              
              <div>
                <small className="text-muted">Comentario:</small>
                <p className="p-3 bg-light rounded">{selectedComment.comentario}</p>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
