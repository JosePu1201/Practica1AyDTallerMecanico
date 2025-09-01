import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Table, Row, Col, Badge, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import './styles/Reports.css';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ProviderExpensesReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [providerId, setProviderId] = useState('');
  const [providers, setProviders] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeProviderId, setActiveProviderId] = useState(null);

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

    // Set default date range to last 3 months
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    
    setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);

    // Load providers for the filter
    const fetchProviders = async () => {
      try {
        const data = await reportService.getProviders();
        setProviders(data);
        setLoadingProviders(false);
      } catch (err) {
        console.error("Error fetching providers:", err);
        setLoadingProviders(false);
      }
    };

    fetchProviders();
  }, [navigate]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor seleccione fechas de inicio y fin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getProviderExpenses(startDate, endDate, providerId || null);
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

  // Filter payments based on search term
  const filteredPayments = reportData?.allPayments.filter(payment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      
      payment.provider?.toLowerCase().includes(searchLower) ||
      payment.reference?.toLowerCase().includes(searchLower) ||
      payment.paymentMethod?.toLowerCase().includes(searchLower) ||
      payment.registeredBy?.toLowerCase().includes(searchLower)
    );
  });

  // Prepare chart data for top providers
  const topProvidersChartData = reportData?.summary.topProviders ? {
    labels: reportData.summary.topProviders.map(p => p.name),
    datasets: [
      {
        data: reportData.summary.topProviders.map(p => p.amount),
        backgroundColor: [
          '#4bc0c0', '#36a2eb', '#ff6384', '#ff9f40', '#9966ff',
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reporte de Gastos por Proveedor</h1>
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
                <Form.Label>Proveedor (opcional)</Form.Label>
                <Form.Select
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                  disabled={loadingProviders}
                >
                  <option value="">Todos</option>
                  {!loadingProviders && providers.map(provider => (
                    <option key={provider.id_proveedor} value={provider.id_proveedor}>
                      {provider.Usuario.nombre_usuario}
                    </option>
                  ))}
                </Form.Select>
                {loadingProviders && <div className="mt-2 small text-muted">Cargando proveedores...</div>}
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
            <Card.Header>Resumen de Gastos</Card.Header>
            <Card.Body>
              <Row>
                <Col md={7}>
                  <div className="stats-container">
                    <Row>
                      <Col xs={6} md={4} className="stat-item">
                        <div className="stat-value text-danger">{formatCurrency(reportData.summary.totalExpenses)}</div>
                        <div className="stat-label">Total de Gastos</div>
                      </Col>
                      <Col xs={6} md={4} className="stat-item">
                        <div className="stat-value text-primary">{reportData.summary.totalProviders}</div>
                        <div className="stat-label">Proveedores</div>
                      </Col>
                      <Col xs={6} md={4} className="stat-item">
                        <div className="stat-value text-info">
                          {reportData.summary.totalProviders > 0 ? 
                            formatCurrency(reportData.summary.totalExpenses / reportData.summary.totalProviders) : 
                            'Q0.00'}
                        </div>
                        <div className="stat-label">Promedio por Proveedor</div>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col md={5}>
                  {topProvidersChartData && (
                    <div style={{ height: '200px' }}>
                      <Doughnut 
                        data={topProvidersChartData} 
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
                              text: 'Top Proveedores por Gasto'
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

          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Gastos por Proveedor</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                {reportData.providerExpenses.map((provider, index) => (
                  <Col lg={6} key={index} className="mb-3">
                    <Card className={`h-100 ${activeProviderId === provider.providerId ? 'border-primary' : ''}`}>
                      <Card.Header 
                        className={`d-flex justify-content-between align-items-center ${activeProviderId === provider.providerId ? 'bg-primary text-white' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => setActiveProviderId(activeProviderId === provider.providerId ? null : provider.providerId)}
                      >
                        <h5 className="mb-0">{provider.providerName}</h5>
                        <div className="d-flex align-items-center">
                          <span className="fw-bold me-2">{formatCurrency(provider.totalPaid)}</span>
                          <i className={`bi ${activeProviderId === provider.providerId ? 'bi-chevron-up' : 'bi-chevron-down'}`}></i>
                        </div>
                      </Card.Header>
                      {activeProviderId === provider.providerId && (
                        <div className="table-responsive">
                          <Table hover className="mb-0">
                            <thead>
                              <tr>
                                <th>Fecha</th>
                                <th>Referencia</th>
                                <th>Método</th>
                                <th className="text-end">Monto</th>
                              </tr>
                            </thead>
                            <tbody>
                              {provider.payments.map((payment, payIdx) => (
                                <tr key={payIdx}>
                                  <td>{formatDate(payment.date)}</td>
                                  <td>{payment.reference || 'N/A'}</td>
                                  <td>{payment.paymentMethod}</td>
                                  <td className="text-end">{formatCurrency(payment.amount)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="table-light">
                              <tr>
                                <td colSpan="3" className="text-end fw-bold">Total:</td>
                                <td className="text-end fw-bold">{formatCurrency(provider.totalPaid)}</td>
                              </tr>
                            </tfoot>
                          </Table>
                        </div>
                      )}
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Todos los Pagos a Proveedores</h5>
                <InputGroup style={{ width: '300px' }}>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar pagos..."
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
                    <th>Fecha</th>
                    <th>Método</th>
                    <th>Registrado por</th>
                    <th className="text-end">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments?.length > 0 ? (
                    filteredPayments.map(payment => (
                      <tr key={payment.paymentId}>
                        <td>{payment.paymentId}</td>
                        <td>{formatDate(payment.date)}</td>
                        <td>{payment.paymentMethod}</td>
                        <td>{payment.registeredBy}</td>
                        <td className="text-end">{formatCurrency(payment.amount)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-3">
                        {searchTerm ? 'No se encontraron resultados para la búsqueda.' : 'No hay pagos a proveedores para mostrar en el período seleccionado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredPayments?.length > 0 && (
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="6" className="text-end fw-bold">Total:</td>
                      <td className="text-end fw-bold">
                        {formatCurrency(filteredPayments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0))}
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
