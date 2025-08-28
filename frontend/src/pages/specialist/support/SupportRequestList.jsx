import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function SupportRequestList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [supportRequests, setSupportRequests] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseForm, setResponseForm] = useState({
    estado: 'ACEPTADO',
    observaciones_respuesta: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);

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
    const fetchSupportRequests = async () => {
      if (!user || !user.id_usuario) return;
      
      try {
        setLoading(true);
        const requests = await serviceSpecialistService.getSupportRequestsBySpecialist(user.id_usuario);
        setSupportRequests(requests);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar solicitudes: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchSupportRequests();
  }, [user]);

  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setResponseForm({
      estado: 'ACEPTADO',
      observaciones_respuesta: ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const handleResponseChange = (e) => {
    const { name, value } = e.target;
    setResponseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    
    if (!selectedRequest) return;
    
    try {
      setSubmitting(true);
      
      await serviceSpecialistService.respondToSupportRequest({
        id: selectedRequest.id_solicitud_apoyo,
        estado: responseForm.estado,
        observaciones_respuesta: responseForm.observaciones_respuesta
      });
      
      // Refresh the list
      const updatedRequests = await serviceSpecialistService.getSupportRequestsBySpecialist(user.id_usuario);
      setSupportRequests(updatedRequests);
      
      setSubmitting(false);
      handleCloseModal();
    } catch (err) {
      setError('Error al enviar respuesta: ' + err.message);
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'ACEPTADO':
        return <Badge bg="success">Aceptado</Badge>;
      case 'RECHAZADO':
        return <Badge bg="danger">Rechazado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
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

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando solicitudes de apoyo...</p>
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
        <h1>Solicitudes de Apoyo</h1>
        <Button as={Link} to="/specialist/support/create" variant="primary">
          <i className="bi bi-plus-circle me-2"></i> Nueva Solicitud
        </Button>
      </div>

      <Card>
        <Card.Body>
          {supportRequests.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-question-circle display-4 text-muted"></i>
              <p className="mt-3">No hay solicitudes de apoyo</p>
              <Link to="/specialist/support/create" className="btn btn-primary mt-2">
                <i className="bi bi-plus-circle me-2"></i>
                Crear nueva solicitud
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Estado</th>
                    <th>Respuesta</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {supportRequests.map(request => (
                    <tr key={request.id_solicitud_apoyo}>
                      <td>{request.id_solicitud_apoyo}</td>
                      <td>{formatDate(request.fecha_apoyo)}</td>
                      <td>
                        <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {request.descripcion_apoyo}
                        </div>
                      </td>
                      <td>{getStatusBadge(request.estado)}</td>
                      <td>
                        {request.observaciones_respuesta ? (
                          <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {request.observaciones_respuesta}
                          </div>
                        ) : (
                          <span className="text-muted">Sin respuesta</span>
                        )}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleOpenModal(request)}
                          disabled={request.estado !== 'PENDIENTE'}
                        >
                          <i className="bi bi-reply"></i>
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

      {/* Response Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Responder Solicitud de Apoyo</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitResponse}>
          <Modal.Body>
            {selectedRequest && (
              <>
                <div className="mb-3">
                  <h6>Descripción de la solicitud:</h6>
                  <p className="border rounded p-2">{selectedRequest.descripcion_apoyo}</p>
                </div>
                
                <Form.Group className="mb-3">
                  <Form.Label>Estado de la solicitud</Form.Label>
                  <Form.Select
                    name="estado"
                    value={responseForm.estado}
                    onChange={handleResponseChange}
                    required
                  >
                    <option value="ACEPTADO">Aceptar</option>
                    <option value="RECHAZADO">Rechazar</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Observaciones</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="observaciones_respuesta"
                    value={responseForm.observaciones_respuesta}
                    onChange={handleResponseChange}
                    rows={3}
                    required
                    placeholder="Ingrese una respuesta o comentarios sobre esta solicitud..."
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal} disabled={submitting}>
              Cancelar
            </Button>
            <Button 
              variant="primary" 
              type="submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner as="span" animation="border" size="sm" className="me-2" />
                  Enviando...
                </>
              ) : (
                'Enviar Respuesta'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}