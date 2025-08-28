import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { serviceSpecialistService } from '../../services/serviceSpecialistService';
import './styles/specialist.css';

export default function SpecialistDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [works, setWorks] = useState([]);
  const [recentWorks, setRecentWorks] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
  });
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    // Get user from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || !user.id_usuario) {
        return;
      }

      try {
        setLoading(true);
        
        // Fetch works assigned to the specialist
        const works = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        
        setWorks(works);
        
        // Calculate stats
        const total = works.length;
        const pending = works.filter(work => work.estado === 'PENDIENTE' || work.estado === 'ASIGNADO').length;
        const inProgress = works.filter(work => work.estado === 'EN_PROCESO').length;
        const completed = works.filter(work => work.estado === 'COMPLETADO').length;
        
        setStats({
          total,
          pending,
          inProgress,
          completed,
        });
        
        // Get recent works (most recent 5)
        const sorted = [...works].sort((a, b) => new Date(b.fecha_asignacion) - new Date(a.fecha_asignacion));
        setRecentWorks(sorted.slice(0, 5));
        
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
      case 'ASIGNADO':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="success">Completado</Badge>;
      default:
        return <Badge bg="secondary">{status || 'Desconocido'}</Badge>;
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
        <p className="mt-2">Cargando información...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        Error al cargar los datos: {error}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1 className="mb-4">Dashboard del Especialista</h1>
      
      {/* Stats Cards */}
      <Row className="mb-4 g-3">
        <Col lg={3} md={6}>
          <Card className="dashboard-card h-100">
            <Card.Body className="d-flex flex-column align-items-center">
              <h1 className="display-4 mb-0">{stats.total}</h1>
              <p className="text-muted mb-0">Trabajos Totales</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="dashboard-card h-100 bg-warning text-dark">
            <Card.Body className="d-flex flex-column align-items-center">
              <h1 className="display-4 mb-0">{stats.pending}</h1>
              <p className="text-dark mb-0">Pendientes</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="dashboard-card h-100 bg-primary text-white">
            <Card.Body className="d-flex flex-column align-items-center">
              <h1 className="display-4 mb-0">{stats.inProgress}</h1>
              <p className="text-white mb-0">En Progreso</p>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={3} md={6}>
          <Card className="dashboard-card h-100 bg-success text-white">
            <Card.Body className="d-flex flex-column align-items-center">
              <h1 className="display-4 mb-0">{stats.completed}</h1>
              <p className="text-white mb-0">Completados</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Recent Works */}
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Trabajos Recientes</h5>
          <Link to="/specialist/works" className="btn btn-sm btn-primary">
            Ver Todos
          </Link>
        </Card.Header>
        <Card.Body>
          {recentWorks.length === 0 ? (
            <p className="text-center text-muted my-4">
              No hay trabajos asignados recientemente.
            </p>
          ) : (
            <div className="list-group">
              {recentWorks.map(work => (
                <Link 
                  key={work.id_asignacion} 
                  to={`/specialist/works/${work.id_asignacion}`}
                  className="list-group-item list-group-item-action d-flex justify-content-between align-items-center work-item"
                >
                  <div>
                    <h6 className="mb-1">{work.descripcion}</h6>
                    <p className="mb-1 text-muted small">
                      <span className="me-3">
                        <i className="bi bi-car-front me-1"></i>
                        {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                      </span>
                      <span>
                        <i className="bi bi-calendar-event me-1"></i>
                        {formatDate(work.fecha_asignacion)}
                      </span>
                    </p>
                  </div>
                  <div>
                    {getStatusBadge(work.estado)}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Actions */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">Acciones Rápidas</h5>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <Card className="specialist-card h-100 text-center">
                <Card.Body>
                  <div className="mb-3">
                    <i className="bi bi-clipboard-pulse display-4 text-primary"></i>
                  </div>
                  <h5>Registrar Diagnóstico</h5>
                  <p className="text-muted small">
                    Crea un nuevo diagnóstico para un trabajo asignado
                  </p>
                  <Link to="/specialist/diagnostics/create" className="btn btn-primary">
                    Crear Diagnóstico
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="specialist-card h-100 text-center">
                <Card.Body>
                  <div className="mb-3">
                    <i className="bi bi-lightbulb display-4 text-warning"></i>
                  </div>
                  <h5>Agregar Recomendación</h5>
                  <p className="text-muted small">
                    Añade recomendaciones para el mantenimiento del vehículo
                  </p>
                  <Link to="/specialist/recommendations/create" className="btn btn-warning">
                    Crear Recomendación
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="specialist-card h-100 text-center">
                <Card.Body>
                  <div className="mb-3">
                    <i className="bi bi-question-circle display-4 text-info"></i>
                  </div>
                  <h5>Solicitar Apoyo</h5>
                  <p className="text-muted small">
                    Solicita ayuda de otro especialista para un trabajo
                  </p>
                  <Link to="/specialist/support/create" className="btn btn-info">
                    Solicitar Apoyo
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
}