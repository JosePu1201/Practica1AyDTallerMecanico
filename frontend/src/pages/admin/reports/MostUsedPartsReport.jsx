import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Table, Row, Col, Badge } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import './styles/Reports.css';

// Register ChartJS components
ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function MostUsedPartsReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [uniqueCarBrands, setUniqueCarBrands] = useState([]);
  const [uniqueCarModels, setUniqueCarModels] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

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

    // Set default date range to last 6 months
    const now = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);
    
    setStartDate(sixMonthsAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);

    // Fetch vehicles to get unique brands and models
    const fetchVehicles = async () => {
      try {
        const vehicles = await reportService.getVehicles();
        
        // Extract unique brands
        const brands = [...new Set(vehicles.map(vehicle => vehicle.marca))];
        setUniqueCarBrands(brands);
        
        // Extract all models (will be filtered when a brand is selected)
        const allModels = [...new Set(vehicles.map(vehicle => vehicle.modelo))];
        setUniqueCarModels(allModels);
        
        setLoadingVehicles(false);
      } catch (err) {
        console.error('Error fetching vehicles:', err);
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, [navigate]);

  // Filter models based on selected brand
  useEffect(() => {
    if (brand) {
      const fetchModelsByBrand = async () => {
        try {
          const vehicles = await reportService.getVehicles();
          const filteredModels = [...new Set(
            vehicles
              .filter(vehicle => vehicle.marca === brand)
              .map(vehicle => vehicle.modelo)
          )];
          setUniqueCarModels(filteredModels);
        } catch (err) {
          console.error('Error fetching models by brand:', err);
        }
      };
      
      fetchModelsByBrand();
    }
  }, [brand]);

  const generateReport = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getMostUsedPartsByVehicleType(brand || null, model || null, startDate || null, endDate || null);
      setReportData(data);
      setLoading(false);
      // Reset selected vehicle when generating a new report
      setSelectedVehicle(null);
    } catch (err) {
      setError(`Error al generar el reporte: ${err.message}`);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'Q0.00';
    return new Intl.NumberFormat('es-GT', {
      style: 'currency',
      currency: 'GTQ',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Prepare chart data for most used parts
  const topPartsChartData = reportData ? {
    labels: reportData.summary.overallMostUsedParts.slice(0, 10).map(part => part.partName),
    datasets: [
      {
        label: 'Cantidad Usada',
        data: reportData.summary.overallMostUsedParts.slice(0, 10).map(part => part.count),
        backgroundColor: [
          '#36a2eb', '#ff6384', '#4bc0c0', '#ffcd56', '#ff9f40',
          '#9966ff', '#c9cbcf', '#8c9eff', '#81c784', '#ffab91'
        ],
        borderWidth: 1,
      },
    ],
  } : null;

  // Prepare chart data for selected vehicle
  const selectedVehiclePartsData = selectedVehicle && reportData?.partsByVehicleType[selectedVehicle] ? {
    labels: reportData.partsByVehicleType[selectedVehicle].parts.slice(0, 8).map(part => part.partName),
    datasets: [
      {
        label: 'Cantidad Usada',
        data: reportData.partsByVehicleType[selectedVehicle].parts.slice(0, 8).map(part => part.count),
        backgroundColor: '#4bc0c0',
        borderColor: '#36a2eb',
        borderWidth: 1,
      },
    ],
  } : null;

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Repuestos Más Usados por Tipo de Vehículo</h1>
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
                <Form.Label>Fecha Inicial (Opcional)</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Fecha Final (Opcional)</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Marca (Opcional)</Form.Label>
                <Form.Select
                  value={brand}
                  onChange={(e) => {
                    setBrand(e.target.value);
                    setModel(''); // Reset model when brand changes
                  }}
                  disabled={loadingVehicles}
                >
                  <option value="">Todas las marcas</option>
                  {uniqueCarBrands.map((brand, index) => (
                    <option key={index} value={brand}>{brand}</option>
                  ))}
                </Form.Select>
                {loadingVehicles && <div className="mt-2 small text-muted">Cargando marcas...</div>}
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Modelo (Opcional)</Form.Label>
                <Form.Select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={loadingVehicles || !brand}
                >
                  <option value="">Todos los modelos</option>
                  {uniqueCarModels.map((model, index) => (
                    <option key={index} value={model}>{model}</option>
                  ))}
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
            <Card.Header>Resumen General</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="stats-container">
                    <Row>
                      <Col md={6} className="stat-item">
                        <div className="stat-value text-primary">
                          {reportData.summary.totalVehicleTypes}
                        </div>
                        <div className="stat-label">
                          Tipos de Vehículos Analizados
                        </div>
                      </Col>
                      <Col md={6} className="stat-item">
                        <div className="stat-value text-success">
                          {reportData.overallMostUsedParts.length}
                        </div>
                        <div className="stat-label">
                          Tipos de Repuestos Identificados
                        </div>
                      </Col>
                      <Col md={12} className="stat-item mt-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-shrink-0 me-3">
                            <i className="bi bi-tools fs-1 text-muted"></i>
                          </div>
                          <div>
                            <div className="fw-bold fs-5 mb-1">Repuesto Más Utilizado:</div>
                            <div className="fs-4">
                              {reportData.overallMostUsedParts[0]?.partName || "No hay datos"}
                              <Badge bg="primary" className="ms-2">
                                {reportData.overallMostUsedParts[0]?.count || 0} usos
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col md={6}>
                  <div style={{ height: '300px' }}>
                    {topPartsChartData && (
                      <Bar
                        data={topPartsChartData}
                        options={{
                          indexAxis: 'y',
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false
                            },
                            title: {
                              display: true,
                              text: 'Top 10 Repuestos Más Utilizados'
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
              <h5 className="mb-0">Repuestos Más Usados en General</h5>
            </Card.Header>
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Código</th>
                    <th>Marca Compatible</th>
                    <th className="text-center">Cantidad Usada</th>
                    <th className="text-end">Costo Total</th>
                    <th>Vehículos</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.overallMostUsedParts.slice(0, 20).map((part, index) => (
                    <tr key={index}>
                      <td>
                        <strong>{part.partName}</strong>
                      </td>
                      <td>{part.partCode || 'N/A'}</td>
                      <td>{part.compatibleBrand || 'Universal'}</td>
                      <td className="text-center">{part.count}</td>
                      <td className="text-end">{formatCurrency(part.totalCost)}</td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {part.vehicleTypes.slice(0, 3).join(', ')}
                          {part.vehicleTypes.length > 3 && ` y ${part.vehicleTypes.length - 3} más`}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card>

          {Object.entries(reportData.partsByVehicleType).length > 0 ? (
            <>
              <h3 className="mb-3">Análisis por Tipo de Vehículo</h3>
              
              {/* Selector de vehículo para ver detalle */}
              <Card className="mb-4">
                <Card.Header>Seleccione un Vehículo para Ver Detalle</Card.Header>
                <Card.Body>
                  <Row className="g-2">
                    {Object.entries(reportData.partsByVehicleType).map(([vehicleKey, vehicleData], index) => (
                      <Col key={index} md={3} sm={6}>
                        <Button
                          variant={selectedVehicle === vehicleKey ? 'primary' : 'outline-secondary'}
                          className="w-100 mb-2 text-start py-2"
                          onClick={() => setSelectedVehicle(vehicleKey === selectedVehicle ? null : vehicleKey)}
                        >
                          <div className="d-flex align-items-center">
                            <i className="bi bi-car-front me-2"></i>
                            <span>{vehicleData.brand} {vehicleData.model}</span>
                          </div>
                        </Button>
                      </Col>
                    ))}
                  </Row>
                </Card.Body>
              </Card>
              
              {/* Detalle del vehículo seleccionado */}
              {selectedVehicle && reportData.partsByVehicleType[selectedVehicle] && (
                <Card className="mb-4">
                  <Card.Header>
                    <h5 className="mb-0">
                      <i className="bi bi-car-front me-2"></i>
                      Detalle: {reportData.partsByVehicleType[selectedVehicle].brand} {reportData.partsByVehicleType[selectedVehicle].model}
                    </h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col lg={7}>
                        <Table hover responsive>
                          <thead>
                            <tr>
                              <th>Repuesto</th>
                              <th className="text-center">Cantidad</th>
                              <th className="text-end">Costo Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reportData.partsByVehicleType[selectedVehicle].parts.map((part, idx) => (
                              <tr key={idx}>
                                <td>
                                  <strong>{part.partName}</strong>
                                  <div className="text-muted small">{part.partCode || 'Sin código'}</div>
                                </td>
                                <td className="text-center">{part.count}</td>
                                <td className="text-end">{formatCurrency(part.totalCost)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td className="fw-bold">Total</td>
                              <td className="text-center fw-bold">
                                {reportData.partsByVehicleType[selectedVehicle].parts.reduce((sum, part) => sum + part.count, 0)}
                              </td>
                              <td className="text-end fw-bold">
                                {formatCurrency(reportData.partsByVehicleType[selectedVehicle].parts.reduce((sum, part) => sum + part.totalCost, 0))}
                              </td>
                            </tr>
                          </tfoot>
                        </Table>
                      </Col>
                      <Col lg={5}>
                        {selectedVehiclePartsData && (
                          <div style={{ height: '300px' }}>
                            <h6 className="text-center mb-3">Repuestos Más Usados para este Vehículo</h6>
                            <Doughnut 
                              data={{
                                labels: selectedVehiclePartsData.labels,
                                datasets: [{
                                  data: selectedVehiclePartsData.datasets[0].data,
                                  backgroundColor: [
                                    '#4bc0c0', '#36a2eb', '#ff6384', '#ff9f40', '#9966ff',
                                    '#ffcd56', '#c9cbcf', '#4bc0c0'
                                  ],
                                  borderWidth: 1,
                                }]
                              }}
                              options={{
                                maintainAspectRatio: false,
                                plugins: {
                                  legend: {
                                    position: 'right',
                                    labels: {
                                      boxWidth: 12,
                                      font: { size: 10 }
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
              )}
              
              <Row>
                {Object.entries(reportData.partsByVehicleType).map(([vehicleKey, vehicleData], index) => (
                  <Col md={6} className="mb-4" key={index}>
                    <Card className="h-100">
                      <Card.Header>
                        <h5 className="mb-0">{vehicleData.brand} {vehicleData.model}</h5>
                      </Card.Header>
                      <div className="table-responsive">
                        <Table hover className="mb-0">
                          <thead>
                            <tr>
                              <th>Repuesto</th>
                              <th className="text-center">Cantidad</th>
                              <th className="text-end">Costo</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vehicleData.parts.slice(0, 5).map((part, idx) => (
                              <tr key={idx}>
                                <td>
                                  <strong>{part.partName}</strong>
                                  <div className="text-muted small">{part.partCode || 'Sin código'}</div>
                                </td>
                                <td className="text-center">{part.count}</td>
                                <td className="text-end">{formatCurrency(part.totalCost)}</td>
                              </tr>
                            ))}
                            {vehicleData.parts.length > 5 && (
                              <tr>
                                <td colSpan="3" className="text-center text-muted">
                                  <Button 
                                    variant="link" 
                                    size="sm"
                                    onClick={() => setSelectedVehicle(vehicleKey)}
                                  >
                                    Ver todos los repuestos ({vehicleData.parts.length})
                                  </Button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </Table>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          ) : (
            <Alert variant="info">
              No se encontraron datos suficientes para analizar por tipo de vehículo con los filtros seleccionados.
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
