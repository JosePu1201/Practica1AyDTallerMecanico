import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { clientService } from '../../../services/clientService';

export default function ClientProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);

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

  // Fetch client data
  useEffect(() => {
    const loadClientData = async () => {
      if (!user?.id_usuario) return;
      
      try {
        setLoading(true);
        
        // Fetch vehicles
        const vehiclesData = await clientService.getMyVehicles(user.id_usuario);
        setVehicles(vehiclesData);
        
        // Fetch services
        const servicesData = await clientService.getAllServices(user.id_usuario);
        const activeServicesData = servicesData.filter(service => 
          service.estado === 'PENDIENTE' || service.estado === 'EN_PROCESO'
        );
        setActiveServices(activeServicesData);
        
        // Fetch invoices
        const invoicesData = await clientService.getInvoices(user.id_usuario);
        const pendingInvoicesData = invoicesData.filter(invoice => invoice.estado_pago === 'PENDIENTE');
        setPendingInvoices(pendingInvoicesData);
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los datos del cliente: ' + err.message);
        setLoading(false);
      }
    };
    
    loadClientData();
  }, [user]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-MX');
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return 'Q0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Get status badge
  const getServiceStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="success">Completado</Badge>;
      case 'CANCELADO':
        return <Badge bg="danger">Cancelado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

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

  return (
    <div>
      <h1 className="mb-4">Mi Perfil</h1>
      
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <div className="profile-avatar me-3">
              <i className="bi bi-person-circle display-5 text-primary"></i>
            </div>
            <div>
              <h2 className="mb-1">{user?.nombre_usuario || 'Cliente'}</h2>
              <p className="text-muted mb-0">Cliente desde: {user?.fecha_creacion ? formatDate(user.fecha_creacion) : 'N/A'}</p>
            </div>
          </div>
        </Card.Body>
      </Card>
      
      <h3 className="mb-3">Resumen</h3>
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <div className="py-2">
                <i className="bi bi-car-front display-6 text-primary"></i>
              </div>
              <h3 className="mt-2 mb-0">{vehicles.length}</h3>
              <p className="text-muted">Vehículos Registrados</p>
              <Link to="/client/vehicles" className="btn btn-outline-primary btn-sm">Ver Vehículos</Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <div className="py-2">
                <i className="bi bi-tools display-6 text-warning"></i>
              </div>
              <h3 className="mt-2 mb-0">{activeServices.length}</h3>
              <p className="text-muted">Servicios Activos</p>
              <Link to="/client/services" className="btn btn-outline-warning btn-sm">Ver Servicios</Link>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center h-100 shadow-sm">
            <Card.Body>
              <div className="py-2">
                <i className="bi bi-cash-coin display-6 text-danger"></i>
              </div>
              <h3 className="mt-2 mb-0">{pendingInvoices.length}</h3>
              <p className="text-muted">Facturas Pendientes</p>
              <Link to="/client/invoices" className="btn btn-outline-danger btn-sm">Ver Facturas</Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-light">
              <h5 className="mb-0">Mis Vehículos</h5>
              <Link to="/client/vehicles" className="btn btn-sm btn-outline-primary">Ver Todos</Link>
            </Card.Header>
            <Card.Body className="p-0">
              {vehicles.length === 0 ? (
                <div className="text-center py-4">
                  <p className="mb-0 text-muted">No tiene vehículos registrados</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Marca & Modelo</th>
                        <th>Placa</th>
                        <th>Año</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.slice(0, 5).map(vehicle => (
                        <tr key={vehicle.id_vehiculo}>
                          <td>{vehicle.marca} {vehicle.modelo}</td>
                          <td>{vehicle.placa}</td>
                          <td>{vehicle.anio}</td>
                          <td>
                            <Link 
                              to={`/client/vehicles/history/${vehicle.id_vehiculo}`} 
                              className="btn btn-sm btn-outline-secondary"
                            >
                              <i className="bi bi-clock-history"></i>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6} className="mb-4">
          <Card className="h-100 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-light">
              <h5 className="mb-0">Servicios Activos</h5>
              <Link to="/client/services" className="btn btn-sm btn-outline-primary">Ver Todos</Link>
            </Card.Header>
            <Card.Body className="p-0">
              {activeServices.length === 0 ? (
                <div className="text-center py-4">
                  <p className="mb-0 text-muted">No tiene servicios activos</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead>
                      <tr>
                        <th>Vehículo</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeServices.slice(0, 5).map(service => (
                        <tr key={service.id_registro}>
                          <td>
                            {service.Vehiculo?.marca} {service.Vehiculo?.modelo}
                            <div className="small text-muted">{service.Vehiculo?.placa}</div>
                          </td>
                          <td>{formatDate(service.fecha_ingreso)}</td>
                          <td>{getServiceStatusBadge(service.estado)}</td>
                          <td>
                            <Link 
                              to={`/client/services/detail/${service.id_registro}`} 
                              className="btn btn-sm btn-outline-primary"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Card className="mb-4 shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <h5 className="mb-0">Facturas Pendientes</h5>
          <Link to="/client/invoices" className="btn btn-sm btn-outline-primary">Ver Todas</Link>
        </Card.Header>
        <Card.Body className="p-0">
          {pendingInvoices.length === 0 ? (
            <div className="text-center py-4">
              <p className="mb-0 text-muted">No tiene facturas pendientes</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Nº Factura</th>
                    <th>Vehículo</th>
                    <th>Fecha Emisión</th>
                    <th>Vencimiento</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingInvoices.slice(0, 5).map(invoice => (
                    <tr key={invoice.id_factura}>
                      <td>{invoice.numero_factura}</td>
                      <td>
                        {invoice.RegistroServicioVehiculo?.Vehiculo?.marca} {invoice.RegistroServicioVehiculo?.Vehiculo?.modelo}
                        <div className="small text-muted">{invoice.RegistroServicioVehiculo?.Vehiculo?.placa}</div>
                      </td>
                      <td>{formatDate(invoice.fecha_emision)}</td>
                      <td>{formatDate(invoice.fecha_vencimiento)}</td>
                      <td className="text-end fw-bold">{formatCurrency(invoice.total)}</td>
                      <td>
                        <Link 
                          to="/client/invoices" 
                          className="btn btn-sm btn-outline-success"
                        >
                          <i className="bi bi-credit-card"></i>
                        </Link>
                      </td>
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
