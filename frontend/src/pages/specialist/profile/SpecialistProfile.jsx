import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';
import '../styles/specialist.css';
import { useNavigate } from 'react-router-dom';

export default function SpecialistProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [specialistData, setSpecialistData] = useState(null);
  const [statistics, setStatistics] = useState({
    totalWorks: 0,
    completedWorks: 0,
    pendingWorks: 0,
    totalDiagnostics: 0
  });
  const [recentWorks, setRecentWorks] = useState([]);
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
    const loadSpecialistData = async () => {
      if (!user || !user.id_usuario) return;
      
      try {
        setLoading(true);
        
        // Fetch specialist details
        const specialists = await serviceSpecialistService.getSpecialists();
        const currentSpecialist = specialists.find(
          specialist => specialist.id_usuario === user.id_usuario
        );
        console.log(currentSpecialist);
        setSpecialistData(currentSpecialist);
        console.log(user);
        
        // Fetch works assigned to the specialist
        const works = await serviceSpecialistService.getWorksAssigned(user.id_usuario);
        
        // Calculate statistics
        setStatistics({
          totalWorks: works.length,
          completedWorks: works.filter(work => work.estado === 'COMPLETADO').length,
          pendingWorks: works.filter(work => work.estado === 'PENDIENTE' || work.estado === 'ASIGNADO' || work.estado === 'EN_PROCESO').length,
          totalDiagnostics: 0 // You would need to fetch diagnostics count
        });
        
        // Get recent works (last 5)
        setRecentWorks(works.slice(0, 5));
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar datos de perfil: ' + err.message);
        setLoading(false);
      }
    };
    
    loadSpecialistData();
  }, [user]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando perfil...</p>
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

  if (!specialistData) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Información no disponible</Alert.Heading>
        <p>No se pudo encontrar la información del especialista.</p>
      </Alert>
    );
  }

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
        return <Badge bg="secondary">{status}</Badge>;
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

  return (
    <div>
      <h1 className="mb-4">Mi Perfil</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex specialist-profile">
            <div className="specialist-avatar">
              <i className="bi bi-person"></i>
            </div>
            <div className="specialist-info">
              <h2>{specialistData.Persona?.nombre} {specialistData.Persona?.apellido}</h2>
              <p className="mb-1"><strong>Usuario:</strong> {user.nombre_usuario}</p>
              <p className="mb-1">
                <strong>Especialidad:</strong> {
                  specialistData.UsuarioEspecialista?.[0]?.AreaEspecialistum?.nombre_area || 'No asignada'
                }
              </p>
              <p className="mb-0">
                <strong>Tipo de Técnico:</strong> {
                  specialistData.UsuarioEspecialista?.[0]?.TipoTecnico?.nombre_tipo || 'No asignado'
                }
              </p>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <h3 className="mb-3">Resumen de Actividad</h3>
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100">
            <Card.Body>
              <h1 className="display-4 mb-0">{statistics.totalWorks}</h1>
              <p className="text-muted">Total Trabajos</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-success text-white">
            <Card.Body>
              <h1 className="display-4 mb-0">{statistics.completedWorks}</h1>
              <p className="text-white-50">Trabajos Completados</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-warning">
            <Card.Body>
              <h1 className="display-4 mb-0">{statistics.pendingWorks}</h1>
              <p className="text-dark">Trabajos Pendientes</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center h-100 bg-info text-white">
            <Card.Body>
              <h1 className="display-4 mb-0">{statistics.totalDiagnostics}</h1>
              <p className="text-white-50">Diagnósticos</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <h3 className="mb-3">Trabajos Recientes</h3>
      <Card>
        <Card.Body>
          {recentWorks.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-0">No hay trabajos recientes</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehículo</th>
                    <th>Tipo de Trabajo</th>
                    <th>Fecha de Asignación</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {recentWorks.map(work => (
                    <tr key={work.id_asignacion}>
                      <td>{work.id_asignacion}</td>
                      <td>
                        {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                        <div className="small text-muted">{work.RegistroServicioVehiculo?.Vehiculo?.placa}</div>
                      </td>
                      <td>{work.TipoMantenimiento?.nombre_tipo}</td>
                      <td>{formatDate(work.fecha_asignacion)}</td>
                      <td>{getStatusBadge(work.estado)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
