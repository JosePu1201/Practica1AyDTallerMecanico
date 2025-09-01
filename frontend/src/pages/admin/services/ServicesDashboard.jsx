import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { serviceManagementService } from '../../../services/serviceManagementService';

export default function ServicesDashboard() {
  const [stats, setStats] = useState({
    pendingServices: 0,
    inProgressServices: 0,
    completedServices: 0,
    totalEmployees: 0,
    totalSpecialists: 0,
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Get services
        const services = await serviceManagementService.getServices();
        // Get employees
        const employees = await serviceManagementService.getEmployees();
        // Get specialists
        const specialists = await serviceManagementService.getSpecialists();
        
        // Calculate stats
        const pendingServices = services.filter(s => s.estado === 'PENDIENTE').length;
        const inProgressServices = services.filter(s => s.estado === 'EN_PROCESO').length;
        const completedServices = services.filter(s => s.estado === 'COMPLETADO').length;
        
        setStats({
          pendingServices,
          inProgressServices,
          completedServices,
          totalEmployees: employees.length,
          totalSpecialists: specialists.length,
        });
        
        setLoading(false);
      } catch (err) {
        setError('Error cargando datos del dashboard');
        setLoading(false);
        console.error('Error loading dashboard data:', err);
      }
    };
    
    fetchDashboardData();
  }, []);

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestión de Servicios</h1>
        <div>
          <Link to="/admin/services/register" className="btn btn-primary">
            <i className="bi bi-plus-circle me-2"></i>
            Registrar Nuevo Servicio
          </Link>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      
      <Row>
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary p-3 me-3">
                  <i className="bi bi-tools text-white fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Servicios Pendientes</h6>
                  <h2 className="mb-0">{loading ? '...' : stats.pendingServices}</h2>
                </div>
              </div>
              <hr />
              <Link to="/admin/services/list?estado=PENDIENTE" className="btn btn-sm btn-outline-primary">
                Ver Servicios Pendientes
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-warning p-3 me-3">
                  <i className="bi bi-gear-fill text-white fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Servicios En Proceso</h6>
                  <h2 className="mb-0">{loading ? '...' : stats.inProgressServices}</h2>
                </div>
              </div>
              <hr />
              <Link to="/admin/services/list?estado=EN_PROCESO" className="btn btn-sm btn-outline-warning">
                Ver Servicios En Proceso
              </Link>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={4} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-success p-3 me-3">
                  <i className="bi bi-check-circle-fill text-white fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-1">Servicios Completados</h6>
                  <h2 className="mb-0">{loading ? '...' : stats.completedServices}</h2>
                </div>
              </div>
              <hr />
              <Link to="/admin/services/list?estado=COMPLETADO" className="btn btn-sm btn-outline-success">
                Ver Servicios Completados
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-3">
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header>
              <h5 className="mb-0">Personal Disponible</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-around">
                <div className="text-center">
                  <div className="rounded-circle bg-info p-3 mx-auto mb-2" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-person-fill text-white fs-4"></i>
                  </div>
                  <h4>{loading ? '...' : stats.totalEmployees}</h4>
                  <p className="text-muted">Empleados</p>
                  
                </div>
                <div className="text-center">
                  <div className="rounded-circle bg-secondary p-3 mx-auto mb-2" style={{ width: '60px', height: '60px' }}>
                    <i className="bi bi-person-badge-fill text-white fs-4"></i>
                  </div>
                  <h4>{loading ? '...' : stats.totalSpecialists}</h4>
                  <p className="text-muted">Especialistas</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header>
              <h5 className="mb-0">Opciones de Gestión</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col xs={6} className="mb-3">
                  <Link to="/admin/services/list" className="btn btn-outline-dark w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3">
                    <i className="bi bi-list-check fs-3 mb-2"></i>
                    <span>Listar Todos los Servicios</span>
                  </Link>
                </Col>
                
                <Col xs={6} className='mb-3'>
                  <Link to="/admin/services/maintenance-types" className="btn btn-outline-dark w-100 h-100 d-flex flex-column align-items-center justify-content-center py-3">
                    <i className="bi bi-wrench fs-3 mb-2"></i>
                    <span>Tipos de Mantenimiento</span>
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
