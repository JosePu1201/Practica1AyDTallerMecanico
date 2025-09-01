import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Table, Badge, Row, Col, Tab, Tabs } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import './styles/Reports.css';

export default function MaintenanceHistoryReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [fetchingVehicles, setFetchingVehicles] = useState(true);
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

    // Fetch vehicles
    const fetchVehicles = async () => {
      try {
        const data = await reportService.getVehicles();
        setVehicles(data);
        setFetchingVehicles(false);
      } catch (err) {
        setError(`Error al cargar los vehículos: ${err.message}`);
        setFetchingVehicles(false);
      }
    };

    fetchVehicles();
  }, [navigate]);

  const generateReport = async () => {
    if (!selectedVehicleId) {
      setError('Por favor seleccione un vehículo');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getMaintenanceHistoryByVehicle(selectedVehicleId);
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

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Historial de Mantenimiento por Vehículo</h1>
        <Link to="/admin/reportes" className="btn btn-outline-secondary">
          <i className="bi bi-arrow-left me-2"></i>
          Volver a Reportes
        </Link>
      </div>

      <Card className="mb-4">
        <Card.Header>Selección de Vehículo</Card.Header>
        <Card.Body>
          {fetchingVehicles ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Cargando vehículos...
            </div>
          ) : (
            <>
              <Row>
                <Col md={8}>
                  <Form.Group className="mb-3">
                    <Form.Label>Vehículo</Form.Label>
                    <Form.Select
                      value={selectedVehicleId}
                      onChange={(e) => setSelectedVehicleId(e.target.value)}
                      disabled={loading}
                    >
                      <option value="">Seleccione un vehículo</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id_vehiculo} value={vehicle.id_vehiculo}>
                          {vehicle.marca} {vehicle.modelo} - {vehicle.placa} ({vehicle.anio})
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={4} className="d-flex align-items-end">
                  <Button 
                    variant="primary" 
                    onClick={generateReport}
                    disabled={loading || !selectedVehicleId}
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
            <Card.Header>Información del Vehículo</Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h5>{reportData.vehicle.brand} {reportData.vehicle.model}</h5>
                  <p><strong>Año:</strong> {reportData.vehicle.year}</p>
                  <p><strong>Placa:</strong> {reportData.vehicle.plate}</p>
                  <p><strong>Propietario:</strong> {reportData.vehicle.owner}</p>
                </Col>
                <Col md={6}>
                  <div className="stats-container">
                    <Row>
                      <Col xs={6} md={6} className="stat-item">
                        <div className="stat-value text-primary">{reportData.stats.totalServices}</div>
                        <div className="stat-label">Servicios Totales</div>
                      </Col>
                      <Col xs={6} md={6} className="stat-item">
                        <div className="stat-value text-success">{reportData.stats.completedServices}</div>
                        <div className="stat-label">Servicios Completados</div>
                      </Col>
                      <Col xs={12} md={12} className="stat-item">
                        <div className="stat-value text-info">{reportData.stats.completionRate}</div>
                        <div className="stat-label">Tasa de Finalización</div>
                      </Col>
                    </Row>
                  </div>
                </Col>
              </Row>

              <div className="mt-4">
                <h6>Tipos de Mantenimiento Comunes</h6>
                <Row>
                  {reportData.stats.mostCommonMaintenanceTypes.map((type, index) => (
                    <Col key={index} xs={6} md={3} className="mb-2">
                      <Card className="text-center h-100 small">
                        <Card.Body>
                          <div className="fw-bold mb-2">{type.type}</div>
                          <Badge bg="info">{type.count} veces</Badge>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </Card.Body>
          </Card>

          <Card>
            <Card.Header>
              <h5 className="mb-0">Historial de Reparaciones</h5>
            </Card.Header>
            <Card.Body>
              <div className="timeline">
                {reportData.repairHistory.map((record, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-date">{formatDate(record.serviceDate)}</div>
                    <Card className="mb-3">
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>Servicio #{record.serviceId}</div>
                          <div>{getStatusBadge(record.status)}</div>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <p><strong>Problema:</strong> {record.problemDescription}</p>
                        <p><strong>Fecha Estimada Finalización:</strong> {formatDate(record.estimatedCompletionDate)}</p>
                        
                        <h6 className="mt-3 mb-2">Trabajos Realizados</h6>
                        {record.works.length > 0 ? (
                          <Table striped hover size="sm">
                            <thead>
                              <tr>
                                <th>Tipo</th>
                                <th>Asignado a</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                              </tr>
                            </thead>
                            <tbody>
                              {record.works.map((work, workIdx) => (
                                <tr key={workIdx}>
                                  <td>{work.workType}</td>
                                  <td>{work.assignedTo}</td>
                                  <td>{getStatusBadge(work.status)}</td>
                                  <td>{formatDate(work.endDate) || 'Pendiente'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        ) : (
                          <p className="text-muted">No hay trabajos registrados</p>
                        )}
                      </Card.Body>
                    </Card>
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
