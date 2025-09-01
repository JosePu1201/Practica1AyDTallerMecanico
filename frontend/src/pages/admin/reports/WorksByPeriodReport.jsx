import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Table, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './styles/Reports.css';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function WorksByPeriodReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

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

    // Set default date range to current month
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, [navigate]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor seleccione fechas de inicio y fin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getWorksByPeriod(startDate, endDate, status || null);
      setReportData(data);
      setLoading(false);
    } catch (err) {
      setError(`Error al generar el reporte: ${err.message}`);
      setLoading(false);
    }
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
      case 'ASIGNADO':
        return <Badge bg="info">Asignado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
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

  // Filter works based on search term
  const filteredWorks = reportData?.works.filter(work => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      work.descripcion?.toLowerCase().includes(searchLower) ||
      work.TipoMantenimiento?.nombre_tipo?.toLowerCase().includes(searchLower) ||
      work.empleadoAsignado?.nombre_usuario?.toLowerCase().includes(searchLower) ||
      work.empleadoAsignado?.Persona?.nombre?.toLowerCase().includes(searchLower) ||
      work.empleadoAsignado?.Persona?.apellido?.toLowerCase().includes(searchLower) ||
      work.RegistroServicioVehiculo?.Vehiculo?.marca?.toLowerCase().includes(searchLower) ||
      work.RegistroServicioVehiculo?.Vehiculo?.modelo?.toLowerCase().includes(searchLower) ||
      work.RegistroServicioVehiculo?.Vehiculo?.placa?.toLowerCase().includes(searchLower)
    );
  });

  // Prepare chart data
  const statusChartData = reportData ? {
    labels: ['Completados', 'Pendientes', 'En Proceso', 'Cancelados'],
    datasets: [
      {
        data: [
          reportData.stats.completedWorks,
          reportData.stats.pendingWorks,
          reportData.stats.inProgressWorks,
          reportData.stats.canceledWorks
        ],
        backgroundColor: [
          '#28a745', // success
          '#ffc107', // warning
          '#0d6efd', // primary
          '#dc3545'  // danger
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reporte de Trabajos por Período</h1>
        <Link to="/admin/reportes" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a Reportes
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Header>Filtros del Reporte</Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Inicial</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Final</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Estado (opcional)</Form.Label>
                <Form.Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="PENDIENTE">Pendiente</option>
                  <option value="ASIGNADO">Asignado</option>
                  <option value="EN_PROCESO">En Proceso</option>
                  <option value="COMPLETADO">Completado</option>
                  <option value="CANCELADO">Cancelado</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end">
            <Button 
              variant="primary" 
              onClick={generateReport}
              disabled={loading}
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
          </div>
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
            <Card.Header>Resumen del Reporte</Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <h5>Estadísticas de Trabajos</h5>
                  <Row className="stats-container">
                    <Col xs={6} md={3} className="stat-item">
                      <div className="stat-value text-primary">{reportData.stats.totalWorks}</div>
                      <div className="stat-label">Total Trabajos</div>
                    </Col>
                    <Col xs={6} md={3} className="stat-item">
                      <div className="stat-value text-success">{reportData.stats.completedWorks}</div>
                      <div className="stat-label">Completados</div>
                    </Col>
                    <Col xs={6} md={3} className="stat-item">
                      <div className="stat-value text-warning">{reportData.stats.pendingWorks}</div>
                      <div className="stat-label">Pendientes</div>
                    </Col>
                    <Col xs={6} md={3} className="stat-item">
                      <div className="stat-value text-info">{reportData.stats.inProgressWorks}</div>
                      <div className="stat-label">En Proceso</div>
                    </Col>
                    <Col xs={6} md={3} className="stat-item">
                      <div className="stat-value text-danger">{reportData.stats.canceledWorks}</div>
                      <div className="stat-label">Cancelados</div>
                    </Col>
                    <Col xs={6} md={3} className="stat-item">
                      <div className="stat-value text-success">{reportData.stats.completionRate}</div>
                      <div className="stat-label">Tasa Completado</div>
                    </Col>
                  </Row>
                </Col>
                <Col md={4}>
                  {statusChartData && <Pie data={statusChartData} options={{ maintainAspectRatio: false }} />}
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Detalle de Trabajos</h5>
                <InputGroup style={{ width: '300px' }}>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar trabajos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </div>
            </Card.Header>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tipo de Trabajo</th>
                    <th>Empleado</th>
                    <th>Vehículo</th>
                    <th>Fecha Asignación</th>
                    <th>Fecha Finalización</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorks?.length > 0 ? (
                    filteredWorks.map(work => (
                      <tr key={work.id_asignacion}>
                        <td>{work.id_asignacion}</td>
                        <td>{work.TipoMantenimiento?.nombre_tipo}</td>
                        <td>
                          {work.empleadoAsignado?.Persona?.nombre} {work.empleadoAsignado?.Persona?.apellido}
                          <div className="small text-muted">{work.empleadoAsignado?.nombre_usuario}</div>
                        </td>
                        <td>
                          {work.RegistroServicioVehiculo?.Vehiculo?.marca} {work.RegistroServicioVehiculo?.Vehiculo?.modelo}
                          <div className="small text-muted">{work.RegistroServicioVehiculo?.Vehiculo?.placa}</div>
                        </td>
                        <td>{formatDate(work.fecha_asignacion)}</td>
                        <td>{formatDate(work.fecha_finalizacion) || 'Pendiente'}</td>
                        <td>{getStatusBadge(work.estado)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-3">
                        {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay trabajos para mostrar en el período seleccionado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
