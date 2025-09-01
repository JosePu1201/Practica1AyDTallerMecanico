import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { requestClientAdminService } from '../../../services/requestClientAdminService';

export default function RequestsDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [additionalServices, setAdditionalServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
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
    
    // Load summary data
    loadInitialData();
  }, [navigate]);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      const services = await requestClientAdminService.getAdditionalServices();
      setAdditionalServices(services);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar los datos: ' + err.message);
      setLoading(false);
    }
  };

  const getPendingServicesCount = () => {
    return additionalServices.filter(service => service.estado === 'PENDIENTE').length;
  };

  return (
    <div className="p-4">
      <h1 className="mb-4">Gestión de Solicitudes de Clientes</h1>
      
      <Row className="mb-4">
        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 border-primary">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon text-primary mb-3">
                <i className="bi bi-tools fs-1"></i>
              </div>
              <Card.Title>Servicios Adicionales</Card.Title>
              <Card.Text>
                Gestione las solicitudes de servicios adicionales enviadas por los clientes.
              </Card.Text>
              <div className="mt-auto">
                {loading ? (
                  <p className="text-muted mb-0">Cargando...</p>
                ) : (
                  <div className="d-flex align-items-center">
                    <span className="badge bg-warning me-2">{getPendingServicesCount()}</span>
                    <span className="text-muted">solicitudes pendientes</span>
                  </div>
                )}
                <Link to="/admin/requests/additional-services" className="btn btn-primary mt-3 w-100">
                  Administrar
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 border-success">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon text-success mb-3">
                <i className="bi bi-cash-coin fs-1"></i>
              </div>
              <Card.Title>Cotizaciones</Card.Title>
              <Card.Text>
                Cree y gestione cotizaciones para los servicios solicitados por los clientes.
              </Card.Text>
              <div className="mt-auto">
                <Link to="/admin/requests/quotations" className="btn btn-success mt-3 w-100">
                  Administrar
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4} md={6} className="mb-4">
          <Card className="h-100 border-info">
            <Card.Body className="d-flex flex-column">
              <div className="feature-icon text-info mb-3">
                <i className="bi bi-list-check fs-1"></i>
              </div>
              <Card.Title>Solicitudes Recientes</Card.Title>
              <Card.Text>
                Visualice todas las solicitudes recientes en un solo lugar.
              </Card.Text>
              <div className="mt-auto">
                <Link to="/admin/requests/all" className="btn btn-info mt-3 w-100">
                  Ver Todas
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col xs={12}>
          <Card>
            <Card.Header as="h5">Acciones Rápidas</Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2">
                <Button variant="outline-primary" onClick={() => navigate('/admin/requests/additional-services')}>
                  <i className="bi bi-tools me-2"></i>
                  Gestionar Servicios Adicionales
                </Button>
                <Button variant="outline-success" onClick={() => navigate('/admin/requests/quotations')}>
                  <i className="bi bi-cash-coin me-2"></i>
                  Gestionar Cotizaciones
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/admin/services/maintenance-types')}>
                  <i className="bi bi-gear me-2"></i>
                  Tipos de Mantenimiento
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
