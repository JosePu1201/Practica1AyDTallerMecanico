import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Table, Badge, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import './styles/Reports.css';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function ServiceRatingsReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minRating, setMinRating] = useState('');
  const [maxRating, setMaxRating] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);

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
    const today = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(today.getMonth() - 3);
    
    setStartDate(threeMonthsAgo.toISOString().split('T')[0]);
    setEndDate(today.toISOString().split('T')[0]);
  }, [navigate]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getServiceRatings(
        startDate || null,
        endDate || null,
        minRating || null,
        maxRating || null
      );
      
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

  // Prepare chart data for ratings distribution
  const ratingChartData = reportData ? {
    labels: ['1 Estrella', '2 Estrellas', '3 Estrellas', '4 Estrellas', '5 Estrellas'],
    datasets: [
      {
        label: 'Número de Calificaciones',
        data: [
          reportData.summary.ratingDistribution[1],
          reportData.summary.ratingDistribution[2],
          reportData.summary.ratingDistribution[3],
          reportData.summary.ratingDistribution[4],
          reportData.summary.ratingDistribution[5],
        ],
        backgroundColor: [
          '#dc3545', // danger (1 star)
          '#fd7e14', // orange (2 stars)
          '#ffc107', // warning (3 stars)
          '#0dcaf0', // info (4 stars)
          '#28a745', // success (5 stars)
        ],
      },
    ],
  } : null;

  // Generate star rating display
  const renderStarRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<i key={i} className="bi bi-star-fill text-warning"></i>);
      } else if (i === fullStars + 1 && halfStar) {
        stars.push(<i key={i} className="bi bi-star-half text-warning"></i>);
      } else {
        stars.push(<i key={i} className="bi bi-star text-warning"></i>);
      }
    }
    
    return <div className="d-inline-flex">{stars}</div>;
  };

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reporte de Calificaciones de Servicio</h1>
        <Link to="/admin/reportes" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a Reportes
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Header>Filtros del Reporte</Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Inicial</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Final</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Calificación Mínima</Form.Label>
                <Form.Select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="1">1 Estrella</option>
                  <option value="2">2 Estrellas</option>
                  <option value="3">3 Estrellas</option>
                  <option value="4">4 Estrellas</option>
                  <option value="5">5 Estrellas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Calificación Máxima</Form.Label>
                <Form.Select
                  value={maxRating}
                  onChange={(e) => setMaxRating(e.target.value)}
                >
                  <option value="">Todos</option>
                  <option value="1">1 Estrella</option>
                  <option value="2">2 Estrellas</option>
                  <option value="3">3 Estrellas</option>
                  <option value="4">4 Estrellas</option>
                  <option value="5">5 Estrellas</option>
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
            <Card.Header>Resumen de Calificaciones</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="stats-container">
                    <Row>
                      <Col xs={6} md={6} className="stat-item">
                        <div className="stat-value text-primary">{reportData.summary.totalRatedServices}</div>
                        <div className="stat-label">Total de Calificaciones</div>
                      </Col>
                      <Col xs={6} md={6} className="stat-item">
                        <div className="stat-value text-success">
                          {reportData.summary.averageRating}
                          <small className="ms-2 text-muted">/ 5</small>
                        </div>
                        <div className="stat-label">Calificación Promedio</div>
                        <div>{renderStarRating(Number(reportData.summary.averageRating))}</div>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="chart-container">
                    {ratingChartData && (
                      <Bar 
                        data={ratingChartData} 
                        options={{
                          maintainAspectRatio: false,
                          plugins: {
                            title: {
                              display: true,
                              text: 'Distribución de Calificaciones'
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              ticks: {
                                precision: 0
                              }
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

          <Card>
            <Card.Header>
              <h5 className="mb-0">Detalle de Servicios Calificados</h5>
            </Card.Header>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>ID Servicio</th>
                    <th>Cliente</th>
                    <th>Vehículo</th>
                    <th>Fecha</th>
                    <th>Descripción</th>
                    <th>Calificación</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.services.length > 0 ? (
                    reportData.services.map(service => (
                      <tr key={service.serviceId}>
                        <td>{service.serviceId}</td>
                        <td>{service.customer || 'N/A'}</td>
                        <td>{service.vehicle || 'N/A'}</td>
                        <td>{formatDate(service.serviceDate)}</td>
                        <td>
                          <div style={{ maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {service.problemDescription}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            <span className="me-2 fw-bold">{service.rating}</span>
                            {renderStarRating(service.rating)}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-3">
                        No hay servicios calificados para mostrar con los filtros seleccionados.
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
