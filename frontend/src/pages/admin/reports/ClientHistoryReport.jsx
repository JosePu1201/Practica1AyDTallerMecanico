import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Table, Badge, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import './styles/Reports.css';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ClientHistoryReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

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

    // Fetch clients
    const fetchClients = async () => {
      try {
        const data = await reportService.getClients();
        setClients(data);
        setFetchingClients(false);
      } catch (err) {
        setError(`Error al cargar los clientes: ${err.message}`);
        setFetchingClients(false);
      }
    };

    fetchClients();
  }, [navigate]);

  const generateReport = async () => {
    if (!selectedClientId) {
      setError('Por favor seleccione un cliente');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getServiceHistoryByClient(selectedClientId);
      setReportData(data);
      setLoading(false);
    } catch (err) {
      setError(`Error al generar el reporte: ${err.message}`);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Q0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETADO':
        return <Badge bg="success">Completado</Badge>;
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'CANCELADO':
        return <Badge bg="danger">Cancelado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Prepare chart data for service types
  const serviceTypesChartData = reportData?.summary?.serviceTypesSummary ? {
    labels: reportData.summary.serviceTypesSummary.map(item => item.type),
    datasets: [
      {
        data: reportData.summary.serviceTypesSummary.map(item => item.count),
        backgroundColor: [
          '#4bc0c0', '#36a2eb', '#ff6384', '#ff9f40', '#9966ff',
          '#ffcd56', '#c9cbcf', '#4bc0c0', '#36a2eb', '#ff6384'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Historial de Servicios por Cliente</h1>
        <Link to="/admin/reportes" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a Reportes
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Header>Selección de Cliente</Card.Header>
        <Card.Body>
          {fetchingClients ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Cargando clientes...
            </div>
          ) : (
            <>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Cliente</Form.Label>
                    <Form.Select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Seleccione un cliente</option>
                      {clients.map(client => (
                        <option key={client.id_usuario} value={client.id_usuario}>
                          {client.Persona.nombre} {client.Persona.apellido} ({client.nombre_usuario})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button 
                    variant="primary" 
                    onClick={generateReport}
                    disabled={loading || !selectedClientId}
                    className="w-100"
                  >
                    {loading ? (
                      <>
                        <Spinner size="sm" animation="border" className="me-2" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-file-earmark-text me-2"></i>
                        Generar Reporte
                      </>
                    )}
                  </Button>
                </Col>
              </Row>
            </>
          )}
        </Card.Body>
      </Card>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}

      {reportData && (
        <>
          <Card className="mb-4">
            <Card.Header>Información del Cliente</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar-lg me-3 bg-light rounded-circle d-flex align-items-center justify-content-center">
                      <i className="bi bi-person-fill text-primary fs-1"></i>
                    </div>
                    <div>
                      <h3 className="mb-1">{reportData.client.fullName}</h3>
                      <p className="text-muted mb-0">
                        Usuario: <strong>{reportData.client.username}</strong>
                      </p>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="mb-1">
                      <i className="bi bi-envelope me-2"></i>
                      {reportData.client.email || 'No disponible'}
                    </p>
                    <p className="mb-1">
                      <i className="bi bi-telephone me-2"></i>
                      {reportData.client.phone || 'No disponible'}
                    </p>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="stats-container">
                    <Row>
                      <Col xs={6} md={4} className="stat-item">
                        <div className="stat-value text-primary">{reportData.summary.totalVehicles}</div>
                        <div className="stat-label">Vehículos</div>
                      </Col>
                      <Col xs={6} md={4} className="stat-item">
                        <div className="stat-value text-info">{reportData.summary.totalServices}</div>
                        <div className="stat-label">Servicios</div>
                      </Col>
                      <Col xs={6} md={4} className="stat-item">
                        <div className="stat-value text-success">{reportData.summary.completionRate}</div>
                        <div className="stat-label">Tasa Completados</div>
                      </Col>
                      <Col xs={12} md={12} className="stat-item">
                        <div className="stat-value text-success">{formatCurrency(reportData.summary.totalSpent)}</div>
                        <div className="stat-label">Total Gastado</div>
                        <div className="small text-muted">
                          Promedio por servicio: {formatCurrency(reportData.summary.averagePerService)}
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>
              
              <Row className="mt-4">
                <Col md={7}>
                  <h5 className="border-bottom pb-2 mb-3">Tipos de Servicios Realizados</h5>
                  <div className="table-responsive">
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Tipo de Servicio</th>
                          <th className="text-center">Cantidad</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.summary.serviceTypesSummary.map((item, index) => (
                          <tr key={index}>
                            <td>{item.type}</td>
                            <td className="text-center">{item.count}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Col>
                <Col md={5}>
                  {serviceTypesChartData && (
                    <div style={{ height: '200px' }}>
                      <Pie 
                        data={serviceTypesChartData} 
                        options={{ 
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                              labels: {
                                boxWidth: 12
                              }
                            },
                            title: {
                              display: true,
                              text: 'Distribución de Servicios'
                            }
                          }
                        }} 
                      />
                    </div>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-4"
          >
            <Tab eventKey="summary" title="Resumen por Vehículos">
              <Row>
                {Object.values(reportData.servicesByVehicle).map((vehicle, index) => (
                  <Col lg={6} key={index} className="mb-4">
                    <Card className="h-100">
                      <Card.Header>
                        <div className="d-flex align-items-center">
                          <i className="bi bi-car-front me-2 fs-4 text-primary"></i>
                          <h5 className="mb-0">{vehicle.brand} {vehicle.model}</h5>
                        </div>
                        <div className="text-muted small">{vehicle.plate}</div>
                      </Card.Header>
                      <Card.Body>
                        <div className="d-flex justify-content-around mb-3">
                          <div className="text-center">
                            <div className="fs-4 fw-bold">{vehicle.servicesCount}</div>
                            <div className="text-muted small">Servicios</div>
                          </div>
                          <div className="text-center">
                            <div className="fs-4 fw-bold">{formatCurrency(vehicle.totalSpent)}</div>
                            <div className="text-muted small">Gastado</div>
                          </div>
                        </div>
                        
                        <h6>Historial de Servicios</h6>
                        <div className="table-responsive">
                          <Table hover size="sm" className="mb-0">
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Estado</th>
                                <th className="text-end">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {vehicle.serviceHistory.slice(0, 5).map((service, idx) => (
                                <tr key={idx}>
                                  <td>{formatDate(service.serviceDate)}</td>
                                  <td>{getStatusBadge(service.status)}</td>
                                  <td className="text-end">{formatCurrency(service.totalAmount)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Tab>
            
            <Tab eventKey="details" title="Detalle de Servicios">
              {Object.values(reportData.servicesByVehicle).map((vehicle, index) => (
                <Card key={index} className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-car-front me-2"></i>
                      {vehicle.brand} {vehicle.model} - {vehicle.plate}
                    </h5>
                  </Card.Header>
                  <div className="table-responsive">
                    <Table hover className="mb-0">
                      <thead>
                        <tr>
                          <th>Fecha</th>
                          <th>Descripción</th>
                          <th>Trabajos</th>
                          <th>Estado</th>
                          <th>Calificación</th>
                          <th className="text-end">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicle.serviceHistory.map((service, idx) => (
                          <tr key={idx}>
                            <td>{formatDate(service.serviceDate)}</td>
                            <td>
                              <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {service.problemDescription}
                              </div>
                            </td>
                            <td>
                              {service.works.map((work, i) => (
                                <Badge key={i} bg="secondary" className="me-1 mb-1">{work.workType}</Badge>
                              ))}
                            </td>
                            <td>{getStatusBadge(service.status)}</td>
                            <td>
                              {service.rating ? 
                                <div className="d-flex align-items-center">
                                  <span className="me-1">{service.rating}</span>
                                  <i className="bi bi-star-fill text-warning"></i>
                                </div> : 
                                <span className="text-muted">N/A</span>
                              }
                            </td>
                            <td className="text-end fw-bold">{formatCurrency(service.totalAmount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan="5" className="text-end fw-bold">Total:</td>
                          <td className="text-end fw-bold">{formatCurrency(vehicle.totalSpent)}</td>
                        </tr>
                      </tfoot>
                    </Table>
                  </div>
                </Card>
              ))}
            </Tab>
          </Tabs>
        </>
      )}
    </div>
  );
}
