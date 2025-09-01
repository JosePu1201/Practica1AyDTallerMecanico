import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Table, Row, Col, InputGroup } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import './styles/Reports.css';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function PartUsageReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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

    // Set default date range to last month
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    
    setStartDate(oneMonthAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, [navigate]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor seleccione fechas de inicio y fin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getPartUsageByPeriod(startDate, endDate);
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

  // Filter parts based on search term
  const filteredParts = reportData?.usageByPart?.filter(part => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      part.partName.toLowerCase().includes(searchLower) ||
      part.description?.toLowerCase().includes(searchLower) ||
      part.partCode?.toLowerCase().includes(searchLower)
    );
  });

  // Prepare chart data for top 10 most used parts
  const topPartsChartData = reportData?.summary?.mostUsedParts ? {
    labels: reportData.summary.mostUsedParts.slice(0, 10).map(part => part.partName),
    datasets: [
      {
        data: reportData.summary.mostUsedParts.slice(0, 10).map(part => part.totalQuantity),
        backgroundColor: [
          '#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff',
          '#ff9f40', '#c9cbcf', '#8c9eff', '#81c784', '#ffab91'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reporte de Uso de Repuestos</h1>
        <Link to="/admin/reportes" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a Reportes
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Header>Filtros del Reporte</Card.Header>
        <Card.Body>
          <Row>
            <Col md={5}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Inicial</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={5}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Final</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button 
                variant="primary" 
                onClick={generateReport}
                disabled={loading}
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
                    Generar
                  </>
                )}
              </Button>
            </Col>
          </Row>
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
            <Card.Header>Resumen de Uso de Repuestos</Card.Header>
            <Card.Body>
              <Row>
                <Col md={8}>
                  <div className="stats-container">
                    <Row>
                      <Col xs={6} md={3} className="stat-item">
                        <div className="stat-value text-primary">{reportData.summary.totalPartsUsed}</div>
                        <div className="stat-label">Total Repuestos Usados</div>
                      </Col>
                      <Col xs={6} md={3} className="stat-item">
                        <div className="stat-value text-success">{formatCurrency(reportData.summary.totalCost)}</div>
                        <div className="stat-label">Costo Total</div>
                      </Col>
                      <Col xs={6} md={3} className="stat-item">
                        <div className="stat-value text-info">{reportData.summary.uniquePartsCount}</div>
                        <div className="stat-label">Tipos de Repuestos</div>
                      </Col>
                      <Col xs={6} md={3} className="stat-item">
                        <div className="stat-value text-warning">
                          {formatCurrency(reportData.summary.totalPartsUsed > 0 
                            ? reportData.summary.totalCost / reportData.summary.totalPartsUsed
                            : 0
                          )}
                        </div>
                        <div className="stat-label">Costo Promedio</div>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col md={4}>
                  {topPartsChartData && (
                    <div style={{height: "250px", position: "relative"}}>
                      <h6 className="text-center mb-3">Repuestos Más Utilizados</h6>
                      <Pie 
                        data={topPartsChartData} 
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'right',
                              display: true,
                              labels: {
                                boxWidth: 12,
                                font: {
                                  size: 10
                                }
                              }
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
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Repuestos Más Utilizados</h5>
                <InputGroup style={{ width: '300px' }}>
                  <InputGroup.Text>
                    <i className="bi bi-search"></i>
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar repuestos..."
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
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Descripción</th>
                    <th className="text-center">Cantidad Usada</th>
                    <th className="text-end">Costo Total</th>
                    <th className="text-end">Costo Unitario Prom.</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredParts?.length > 0 ? (
                    filteredParts.map((part, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{part.partName}</strong>
                        </td>
                        <td>{part.partCode || 'N/A'}</td>
                        <td>
                          <div style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {part.description || 'Sin descripción'}
                          </div>
                        </td>
                        <td className="text-center">{part.totalQuantity}</td>
                        <td className="text-end">{formatCurrency(part.totalCost)}</td>
                        <td className="text-end">{formatCurrency(part.totalQuantity > 0 ? part.totalCost / part.totalQuantity : 0)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-3">
                        {searchTerm ? 'No se encontraron repuestos que coincidan con la búsqueda.' : 'No hay uso de repuestos para mostrar en el período seleccionado.'}
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredParts?.length > 0 && (
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="3" className="text-end fw-bold">Total:</td>
                      <td className="text-center fw-bold">
                        {filteredParts.reduce((sum, part) => sum + part.totalQuantity, 0)}
                      </td>
                      <td className="text-end fw-bold">
                        {formatCurrency(filteredParts.reduce((sum, part) => sum + part.totalCost, 0))}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            </div>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Detalle de Uso por Vehículo</h5>
            </Card.Header>
            <Card.Body>
              <div className="accordion" id="usageDetailsAccordion">
                {reportData.usageByPart.slice(0, 5).map((part, index) => (
                  <div className="accordion-item" key={index}>
                    <h2 className="accordion-header">
                      <button 
                        className="accordion-button collapsed" 
                        type="button" 
                        data-bs-toggle="collapse" 
                        data-bs-target={`#collapse${index}`}
                      >
                        <span className="fw-bold">{part.partName}</span>
                        <span className="badge bg-primary ms-2">{part.totalQuantity} unidades</span>
                      </button>
                    </h2>
                    <div 
                      id={`collapse${index}`} 
                      className="accordion-collapse collapse" 
                      data-bs-parent="#usageDetailsAccordion"
                    >
                      <div className="accordion-body p-0">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Fecha de Uso</th>
                              <th>Vehículo</th>
                              <th>Tipo de Trabajo</th>
                              <th className="text-center">Cantidad</th>
                              <th className="text-end">Costo</th>
                              <th>Aprobado por</th>
                            </tr>
                          </thead>
                          <tbody>
                            {part.usages.map((usage, i) => (
                              <tr key={i}>
                                <td>{formatDate(usage.date)}</td>
                                <td>{usage.vehicle}</td>
                                <td>{usage.workType || 'No especificado'}</td>
                                <td className="text-center">{usage.quantity}</td>
                                <td className="text-end">{formatCurrency(usage.subtotal)}</td>
                                <td>{usage.approvedBy || 'No registrado'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>
        </>
      )}
    </div>
  );
}
