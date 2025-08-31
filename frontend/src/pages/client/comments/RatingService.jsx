import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function RatingService() {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const serviceId = searchParams.get('serviceId');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [services, setServices] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');

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

  // Fetch completed services
  useEffect(() => {
    const fetchCompletedServices = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        const allServices = await clientService.getAllServices(user.id_usuario);
        // Filter only completed services
        const completedServices = allServices.filter(service => service.estado === 'COMPLETADO');
        setServices(completedServices);
        
        // If serviceId is provided, set it as the selected service
        if (serviceId) {
          setSelectedServiceId(serviceId);
        } else if (completedServices.length > 0) {
          // If no serviceId provided, set the first service as selected
          setSelectedServiceId(completedServices[0].id_registro);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los servicios completados: ' + err.message);
        setLoading(false);
      }
    };

    fetchCompletedServices();
  }, [user, serviceId]);

  // Handle service selection change
  const handleServiceChange = (e) => {
    setSelectedServiceId(e.target.value);
  };

  // Handle rating form submission
  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (!selectedServiceId) {
      setError('Por favor seleccione un servicio para calificar');
      return;
    }
    
    try {
      setSubmitting(true);
      await clientService.rateService({
        id_registro: selectedServiceId,
        calificacion: rating,
        comentario: comment
      });
      
      setSuccess(true);
      
      // Redirect after a delay
      setTimeout(() => {
        navigate('/client/services');
      }, 2000);
    } catch (err) {
      setError('Error al enviar la calificación: ' + err.message);
      setSubmitting(false);
    }
  };

  // Get selected service details
  const getSelectedService = () => {
    return services.find(service => service.id_registro.toString() === selectedServiceId.toString());
  };

  // Star rating component
  const StarRating = ({ rating, hoverRating, setRating, setHoverRating }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <span
            key={star}
            className={`star ${(hoverRating || rating) >= star ? 'filled' : ''}`}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            style={{ 
              fontSize: '2.5rem', 
              cursor: 'pointer',
              color: (hoverRating || rating) >= star ? '#ffc107' : '#e4e5e9'
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
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

  const selectedService = getSelectedService();
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Calificar Servicio</h1>
        <Button
          as={Link}
          to="/client/services"
          variant="outline-secondary"
        >
          <i className="bi bi-arrow-left me-2"></i>
          Volver a servicios
        </Button>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <Alert.Heading>¡Gracias por su calificación!</Alert.Heading>
          <p>Su opinión es muy importante para nosotros. Será redirigido en unos segundos...</p>
        </Alert>
      )}

      {services.length === 0 ? (
        <Card className="text-center">
          <Card.Body className="py-5">
            <i className="bi bi-star display-1 text-muted mb-3"></i>
            <h3 className="text-muted">No tiene servicios completados para calificar</h3>
            <p className="mb-4">Solo puede calificar servicios que ya hayan sido completados.</p>
            <Button as={Link} to="/client/services" variant="primary">
              Ver mis servicios
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Body>
            <Form onSubmit={handleSubmitRating}>
              <Form.Group className="mb-4">
                <Form.Label>Seleccione el servicio a calificar</Form.Label>
                <Form.Select
                  value={selectedServiceId}
                  onChange={handleServiceChange}
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

              {selectedService && (
                <div className="service-details bg-light p-4 rounded mb-4">
                  <h5 className="border-bottom pb-2 mb-3">Detalles del Servicio</h5>
                  <Row>
                    <Col md={6}>
                      <p><strong>Vehículo:</strong> {selectedService.Vehiculo?.marca} {selectedService.Vehiculo?.modelo}</p>
                      <p><strong>Placa:</strong> {selectedService.Vehiculo?.placa}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Fecha de Ingreso:</strong> {new Date(selectedService.fecha_ingreso).toLocaleDateString('es-MX')}</p>
                      <p><strong>Estado:</strong> <span className="badge bg-success">Completado</span></p>
                    </Col>
                  </Row>
                  <p><strong>Descripción del problema:</strong> {selectedService.descripcion_problema}</p>
                </div>
              )}

              <div className="rating-section text-center py-4">
                <h4 className="mb-3">¿Cómo calificaría el servicio recibido?</h4>
                <StarRating 
                  rating={rating} 
                  hoverRating={hoverRating} 
                  setRating={setRating} 
                  setHoverRating={setHoverRating} 
                />
                <p className="rating-text mt-2">
                  {rating === 1 && "Deficiente - No cumplió con mis expectativas"}
                  {rating === 2 && "Regular - Podría mejorar en varios aspectos"}
                  {rating === 3 && "Bueno - Cumplió con lo básico"}
                  {rating === 4 && "Muy bueno - Satisfecho con el servicio"}
                  {rating === 5 && "Excelente - Superó mis expectativas"}
                </p>
              </div>

              <Form.Group className="mb-4">
                <Form.Label>Comentarios adicionales (opcional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Comparta su experiencia con el servicio..."
                  disabled={submitting}
                />
              </Form.Group>

              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  as={Link}
                  to="/client/services"
                  className="me-2"
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting || !selectedServiceId}
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Calificación'
                  )}
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
