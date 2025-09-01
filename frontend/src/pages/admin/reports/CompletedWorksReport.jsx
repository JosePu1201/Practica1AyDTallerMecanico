import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Table, Badge, Row, Col, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './styles/Reports.css';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CompletedWorksReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mechanicId, setMechanicId] = useState('');
  const [mechanics, setMechanics] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingMechanics, setLoadingMechanics] = useState(true);
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
    const lastDay = new Date();
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);

    // Load mechanics for the filter
    const fetchMechanics = async () => {
      try {
        const data = await reportService.getMechanics();
        setMechanics(data);
        setLoadingMechanics(false);
      } catch (err) {
        console.error("Error fetching mechanics:", err);
        setLoadingMechanics(false);
      }
    };

    fetchMechanics();
  }, [navigate]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor seleccione fechas de inicio y fin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getCompletedWorks(startDate, endDate, mechanicId || null);
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

  // Filter works based on search term
  const filteredWorks = reportData?.completedWorks.filter(work => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      work.workType?.toLowerCase().includes(searchLower) ||
      work.mechanic?.toLowerCase().includes(searchLower) ||
      work.vehicle?.toLowerCase().includes(searchLower) ||
      work.observations?.toLowerCase().includes(searchLower)
    );
  });

  // Prepare chart data for works by type
  const worksByTypeChartData = reportData ? {
    labels: Object.keys(reportData.worksByType),
    datasets: [
      {
        label: 'Cantidad de trabajos',
        data: Object.values(reportData.worksByType),
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
        <h1>Reporte de Trabajos Completados</h1>
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
                <Form.Label>Mecánico/Especialista (opcional)</Form.Label>
                <Form.Select
                  value={mechanicId}
                  onChange={(e) => setMechanicId(e.target.value)}
                  disabled={loadingMechanics}
                >
                  <option value="">Todos</option>
                  {!loadingMechanics && mechanics.map(mechanic => (
                    <option key={mechanic.id_usuario} value={mechanic.id_usuario}>
                      {mechanic.Persona.nombre} {mechanic.Persona.apellido}
                    </option>
                  ))}
                </Form.Select>
                {loadingMechanics && <div className="mt-2 small text-muted">Cargando mecánicos...</div>}
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
                <Col md={6}>
                  <div className="stats-container">
                    <Row>
                      <Col xs={6} md={6} className="stat-item">
                        <div className="stat-value text-success">{reportData.totalCompletedWorks}</div>
                        <div className="stat-label">Trabajos Completados</div>
                      </Col>
                      <Col xs={6} md={6} className="stat-item">
                        <div className="stat-value text-primary">{Object.keys(reportData.worksByMechanic).length}</div>
                        <div className="stat-label">Mecánicos Activos</div>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="chart-container">
                    {worksByTypeChartData && (
                      <Bar
                        data={worksByTypeChartData}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false
                            },
                            title: {
                              display: true,
                              text: 'Distribución por Tipo de Trabajo'
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Desempeño por Mecánico</h5>
            </Card.Header>
            <Card.Body>
              <div className="row">
                {Object.entries(reportData.worksByMechanic).map(([mechanicName, works], index) => (
                  <div key={index} className="col-md-6 col-lg-4 mb-3">
                    <Card>
                      <Card.Body>
                        <div className="d-flex align-items-center mb-3">
                          <div className="avatar-lg bg-light rounded-circle d-flex align-items-center justify-content-center me-3">
                            <i className="bi bi-person-fill text-primary fs-3"></i>
                          </div>
                          <div>
                            <h5 className="mb-1">{mechanicName}</h5>
                            <div className="text-muted small">Trabajos completados: {works.length}</div>
                          </div>
                        </div>
                        <div className="mb-2 small">
                          <strong>Tipos de trabajo:</strong> {Array.from(new Set(works.map(w => w.workType))).join(', ')}
                        </div>
                        <div className="mb-2 small">
                          <strong>Ingresos generados:</strong> {formatCurrency(works.reduce((sum, w) => sum + Number(w.price || 0), 0))}
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Detalle de Trabajos Completados</h5>
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
                    <th>Mecánico</th>
                    <th>Vehículo</th>
                    <th>Fecha Asignación</th>
                    <th>Fecha Finalización</th>
                    <th>Precio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorks?.length > 0 ? (
                    filteredWorks.map(work => (
                      <tr key={work.workId}>
                        <td>{work.workId}</td>
                        <td>{work.workType}</td>
                        <td>{work.mechanic}</td>
                        <td>{work.vehicle}</td>
                        <td>{formatDate(work.assignmentDate)}</td>
                        <td>{formatDate(work.completionDate)}</td>
                        <td className="text-end">{formatCurrency(work.price)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-3">
                        {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay trabajos completados para mostrar en el período seleccionado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredWorks?.length > 0 && (
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="6" className="text-end fw-bold">Total:</td>
                      <td className="text-end fw-bold">
                        {formatCurrency(filteredWorks.reduce((sum, work) => sum + Number(work.price || 0), 0))}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
