import React, { useState, useEffect } from 'react';
import { Card, Button, Spinner, Alert, Form, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function QuoteRequest() {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    id_vehiculo: '',
    descripcion_problema: ''
  });

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

  // Fetch user vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!user?.id_usuario) return;

      try {
        setLoading(true);
        const data = await clientService.getMyVehicles(user.id_usuario);
        setVehicles(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los vehículos: ' + err.message);
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [user]);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit quote request
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.id_vehiculo || !formData.descripcion_problema) {
      setError('Por favor complete todos los campos requeridos');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      await clientService.requestQuote(formData);
      
      setSuccess(true);
      setFormData({
        id_vehiculo: '',
        descripcion_problema: ''
      });
      
      // Redirect to services page after a delay
      setTimeout(() => {
        navigate('/client/services');
      }, 2000);
    } catch (err) {
      setError('Error al solicitar cotización: ' + err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando vehículos...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Solicitar Cotización</h1>
        <div>
          <Button
            as={Link}
            to="/client/services/quotes"
            variant="outline-primary"
            className="me-2"
          >
            <i className="bi bi-list me-2"></i>
            Ver Mis Cotizaciones
          </Button>
          <Button
            as={Link}
            to="/client/services"
            variant="outline-secondary"
          >
            <i className="bi bi-arrow-left me-2"></i>
            Volver a servicios
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      {success && (
        <Alert variant="success">
          <Alert.Heading>¡Cotización Solicitada!</Alert.Heading>
          <p>
            Su solicitud de cotización ha sido enviada exitosamente. Nos pondremos en contacto con usted lo más pronto posible.
            Será redirigido en unos segundos...
          </p>
        </Alert>
      )}

      {vehicles.length === 0 ? (
        <Card className="text-center">
          <Card.Body className="py-5">
            <i className="bi bi-car-front display-1 text-muted mb-3"></i>
            <h3 className="text-muted">No tiene vehículos registrados</h3>
            <p className="mb-4">Debe registrar un vehículo antes de solicitar una cotización.</p>
            <Button as={Link} to="/client/vehicles" variant="primary">
              Registrar Vehículo
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <Card>
          <Card.Header className="bg-light">
            <h5 className="mb-0">Formulario de Solicitud de Cotización</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={12} lg={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Seleccione su Vehículo</Form.Label>
                    <Form.Select
                      name="id_vehiculo"
                      value={formData.id_vehiculo}
                      onChange={handleChange}
                      disabled={submitting || success}
                      required
                    >
                      <option value="">Seleccione un vehículo</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id_vehiculo} value={vehicle.id_vehiculo}>
                          {vehicle.marca} {vehicle.modelo} - {vehicle.placa} ({vehicle.anio})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  {formData.id_vehiculo && (
                    <div className="selected-vehicle bg-light p-3 rounded mb-4">
                      {vehicles.map(vehicle => (
                        vehicle.id_vehiculo.toString() === formData.id_vehiculo.toString() && (
                          <div key={vehicle.id_vehiculo}>
                            <h6>Vehículo Seleccionado</h6>
                            <p className="mb-1"><strong>Marca:</strong> {vehicle.marca}</p>
                            <p className="mb-1"><strong>Modelo:</strong> {vehicle.modelo}</p>
                            <p className="mb-1"><strong>Placa:</strong> {vehicle.placa}</p>
                            <p className="mb-1"><strong>Año:</strong> {vehicle.anio}</p>
                            <p className="mb-0"><strong>Color:</strong> {vehicle.color}</p>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </Col>

                <Col md={12} lg={6}>
                  <Form.Group className="mb-4">
                    <Form.Label>Descripción del Problema</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={6}
                      name="descripcion_problema"
                      value={formData.descripcion_problema}
                      onChange={handleChange}
                      placeholder="Describa detalladamente el problema o servicio que necesita..."
                      disabled={submitting || success}
                      required
                    />
                    <Form.Text className="text-muted">
                      Por favor, sea lo más específico posible para que podamos proporcionarle una cotización precisa.
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex justify-content-end">
                <Button
                  variant="secondary"
                  as={Link}
                  to="/client/services"
                  className="me-2"
                  disabled={submitting || success}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submitting || success || !formData.id_vehiculo}
                >
                  {submitting ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Enviando...
                    </>
                  ) : (
                    'Solicitar Cotización'
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
