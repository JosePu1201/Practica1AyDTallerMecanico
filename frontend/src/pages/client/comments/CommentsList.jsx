import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Modal } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function CommentsList() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const serviceId = searchParams.get('serviceId');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '');
  
  // Comment form state
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentFormData, setCommentFormData] = useState({
    id_registro: '',
    id_cliente: '',
    comentario: '',
    tipo_comentario: 'INFORMACION'
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load user from localStorage
  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) {
      try {
        const userData = JSON.parse(s);
        setUser(userData);
        setCommentFormData(prev => ({
          ...prev,
          id_cliente: userData.id_usuario
        }));
      } catch {
        localStorage.removeItem("user");
        navigate("/login", { replace: true });
      }
    } else {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Fetch services with comments
  useEffect(() => {
    const fetchServicesWithComments = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        const data = await clientService.getServicesWithComments(user.id_usuario);
        setServices(data);
        
        // If serviceId is provided, set it as the selected service
        if (serviceId) {
          setSelectedServiceId(serviceId);
          const serviceData = data.find(s => s.id_registro.toString() === serviceId);
          if (serviceData) {
            setCommentFormData(prev => ({
              ...prev,
              id_registro: serviceData.id_registro
            }));
          }
        } else if (data.length > 0) {
          // If no serviceId provided, set the first service as selected
          setSelectedServiceId(data[0].id_registro);
          setCommentFormData(prev => ({
            ...prev,
            id_registro: data[0].id_registro
          }));
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los servicios con comentarios: ' + err.message);
        setLoading(false);
      }
    };

    fetchServicesWithComments();
  }, [user, serviceId]);

  // Handle service selection change
  const handleServiceChange = (e) => {
    const id = e.target.value;
    setSelectedServiceId(id);
    setCommentFormData(prev => ({
      ...prev,
      id_registro: id
    }));
  };

  // Handle comment form input change
  const handleCommentChange = (e) => {
    const { name, value } = e.target;
    setCommentFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit comment form
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    
    if (!commentFormData.comentario || !commentFormData.id_registro) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }
    
    try {
      setSubmitting(true);
      await clientService.addFollowComment(commentFormData);
      setSuccess(true);
      
      // Clear form
      setCommentFormData(prev => ({
        ...prev,
        comentario: '',
        tipo_comentario: 'INFORMACION'
      }));
      
      // Refresh data
      const updatedServices = await clientService.getServicesWithComments(user.id_usuario);
      setServices(updatedServices);
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowCommentModal(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError('Error al enviar el comentario: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Get the selected service details
  const getSelectedService = () => {
    return services.find(service => service.id_registro.toString() === selectedServiceId);
  };

  // Format date
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

  // Get comment type badge
  const getCommentTypeBadge = (type) => {
    switch (type) {
      case 'PREGUNTA':
        return <Badge bg="primary">Pregunta</Badge>;
      case 'QUEJA':
        return <Badge bg="danger">Queja</Badge>;
      case 'SUGERENCIA':
        return <Badge bg="warning">Sugerencia</Badge>;
      case 'INFORMACION':
        return <Badge bg="info">Información</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando comentarios...</p>
      </div>
    );
  }

  const selectedService = getSelectedService();

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Comentarios de Seguimiento</h1>
        <Button 
          variant="primary" 
          onClick={() => setShowCommentModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>
          Nuevo Comentario
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
          <Form.Group className="mb-3">
            <Form.Label>Seleccionar Servicio</Form.Label>
            <Form.Select 
              value={selectedServiceId} 
              onChange={handleServiceChange}
              disabled={loading}
            >
              <option value="">Seleccione un servicio</option>
              {services.map(service => (
                <option key={service.id_registro} value={service.id_registro}>
                  #{service.id_registro} - {service.Vehiculo?.marca} {service.Vehiculo?.modelo} ({service.Vehiculo?.placa})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedService && (
            <div className="bg-light p-3 rounded mb-3">
              <h6>Detalles del Servicio Seleccionado</h6>
              <div className="mb-2">
                <strong>Vehículo:</strong> {selectedService.Vehiculo?.marca} {selectedService.Vehiculo?.modelo}
              </div>
              <div className="mb-2">
                <strong>Placa:</strong> {selectedService.Vehiculo?.placa}
              </div>
              <div className="mb-2">
                <strong>Descripción del Problema:</strong> {selectedService.descripcion_problema}
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
          {!selectedServiceId ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-square-text display-4 text-muted"></i>
              <p className="mt-3">Seleccione un servicio para ver sus comentarios</p>
            </div>
          ) : !selectedService?.ComentariosSeguimientoClientes?.length ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-square display-4 text-muted"></i>
              <p className="mt-3">No hay comentarios para este servicio</p>
              <Button 
                variant="primary" 
                onClick={() => setShowCommentModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Agregar el primer comentario
              </Button>
            </div>
          ) : (
            <Table hover>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                {selectedService.ComentariosSeguimientoClientes
                  .filter(comment => 
                    comment.comentario?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    comment.tipo_comentario?.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .sort((a, b) => new Date(b.fecha_comentario) - new Date(a.fecha_comentario))
                  .map(comment => (
                    <tr key={comment.id_comentario}>
                      <td>{formatDate(comment.fecha_comentario)}</td>
                      <td>{getCommentTypeBadge(comment.tipo_comentario)}</td>
                      <td>{comment.comentario}</td>
                    </tr>
                  ))
                }
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Comment Modal */}
      <Modal 
        show={showCommentModal} 
        onHide={() => setShowCommentModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Nuevo Comentario</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {success && (
            <Alert variant="success">
              <i className="bi bi-check-circle me-2"></i>
              Comentario enviado exitosamente
            </Alert>
          )}
          
          <Form onSubmit={handleSubmitComment}>
            <Form.Group className="mb-3">
              <Form.Label>Servicio</Form.Label>
              <Form.Select
                name="id_registro"
                value={commentFormData.id_registro}
                onChange={handleCommentChange}
                disabled={submitting || !!serviceId}
                required
              >
                <option value="">Seleccione un servicio</option>
                {services.map(service => (
                  <option key={service.id_registro} value={service.id_registro}>
                    #{service.id_registro} - {service.Vehiculo?.marca} {service.Vehiculo?.modelo} ({service.Vehiculo?.placa})
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Comentario</Form.Label>
              <Form.Select
                name="tipo_comentario"
                value={commentFormData.tipo_comentario}
                onChange={handleCommentChange}
                disabled={submitting}
                required
              >
                <option value="INFORMACION">Información</option>
                <option value="PREGUNTA">Pregunta</option>
                <option value="SUGERENCIA">Sugerencia</option>
                <option value="QUEJA">Queja</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Comentario</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="comentario"
                value={commentFormData.comentario}
                onChange={handleCommentChange}
                placeholder="Escriba su comentario aquí"
                disabled={submitting}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button 
                variant="secondary" 
                onClick={() => setShowCommentModal(false)} 
                className="me-2"
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Enviando...
                  </>
                ) : 'Enviar Comentario'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
}
