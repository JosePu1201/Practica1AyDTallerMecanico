import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Form, InputGroup, Modal, Row, Col } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function DiagnosticList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [diagnostics, setDiagnostics] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedDiagnostic, setSelectedDiagnostic] = useState(null);

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

  useEffect(() => {
    const fetchDiagnostics = async () => {
      if (!user || !user.id_usuario) return;
      
      try {
        setLoading(true);
        const data = await serviceSpecialistService.getDiagnosticsBySpecialist(user.id_usuario);
        setDiagnostics(data);
        setLoading(false);
      } catch (err) {
        setError('Error al cargar los diagnósticos: ' + err.message);
        setLoading(false);
      }
    };
    
    fetchDiagnostics();
  }, [user]);

  const getSeverityBadge = (severity) => {
    switch (severity.toLowerCase()) {
      case 'crítica':
      case 'critica':
        return <Badge bg="danger">Crítica</Badge>;
      case 'alta':
        return <Badge bg="warning">Alta</Badge>;
      case 'media':
        return <Badge bg="info">Media</Badge>;
      case 'baja':
        return <Badge bg="success">Baja</Badge>;
      default:
        return <Badge bg="secondary">{severity}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Function to open modal with diagnostic details
  const handleViewDiagnostic = (diagnostic) => {
    setSelectedDiagnostic(diagnostic);
    setShowModal(true);
  };

  const filteredDiagnostics = diagnostics.filter(diagnostic => {
    const searchTermLower = searchTerm.toLowerCase();
    return diagnostic.observaciones_generales?.toLowerCase().includes(searchTermLower) ||
      diagnostic.AsignacionTrabajo?.descripcion?.toLowerCase().includes(searchTermLower) ||
      diagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca?.toLowerCase().includes(searchTermLower) ||
      diagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo?.toLowerCase().includes(searchTermLower);
  });

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando diagnósticos...</p>
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Diagnósticos</h1>
        <Button as={Link} to="/specialist/diagnostics/create" variant="primary">
          <i className="bi bi-plus-circle me-2"></i> Nuevo Diagnóstico
        </Button>
      </div>

      <Card className="mb-4">
        <Card.Body>
          <InputGroup className="mb-3">
            <InputGroup.Text>
              <i className="bi bi-search"></i>
            </InputGroup.Text>
            <Form.Control
              placeholder="Buscar diagnósticos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          
          {filteredDiagnostics.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-clipboard-x display-4 text-muted"></i>
              <p className="mt-3">No se encontraron diagnósticos</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehículo</th>
                    <th>Fecha</th>
                    <th>Observaciones</th>
                    <th>Detalles</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiagnostics.map(diagnostic => (
                    <tr key={diagnostic.id_diagnostico_especialista}>
                      <td>{diagnostic.id_diagnostico_especialista}</td>
                      <td>
                        {diagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca} {' '}
                        {diagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo}
                        <div className="small text-muted">
                          {diagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa}
                        </div>
                      </td>
                      <td>{formatDate(diagnostic.fecha_diagnostico)}</td>
                      <td>
                        <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {diagnostic.observaciones_generales}
                        </div>
                      </td>
                      <td className="text-center">
                        <Badge bg="info" pill>
                          {diagnostic.DetalleDiagnosticos?.length || 0} detalles
                        </Badge>
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleViewDiagnostic(diagnostic)}
                          title="Ver detalles del diagnóstico"
                        >
                          <i className="bi bi-eye"></i>
                        </Button>
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          title="Agregar detalles al diagnóstico"
                        >
                          <i className="bi bi-plus-circle"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Diagnostic Detail Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        aria-labelledby="diagnostic-detail-modal"
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title id="diagnostic-detail-modal">
            Detalles del Diagnóstico #{selectedDiagnostic?.id_diagnostico_especialista}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedDiagnostic && (
            <>
              <div className="mb-4">
                <h5 className="border-bottom pb-2">Información del Vehículo</h5>
                <Row className="mb-3">
                  <Col md={6}>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Marca:</dt>
                      <dd className="col-sm-8">
                        {selectedDiagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca}
                      </dd>
                      <dt className="col-sm-4">Modelo:</dt>
                      <dd className="col-sm-8">
                        {selectedDiagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo}
                      </dd>
                    </dl>
                  </Col>
                  <Col md={6}>
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Placa:</dt>
                      <dd className="col-sm-8">
                        {selectedDiagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa}
                      </dd>
                      <dt className="col-sm-4">Año:</dt>
                      <dd className="col-sm-8">
                        {selectedDiagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.anio}
                      </dd>
                    </dl>
                  </Col>
                </Row>
              </div>

              <div className="mb-4">
                <h5 className="border-bottom pb-2">Información del Diagnóstico</h5>
                <dl className="row">
                  <dt className="col-sm-3">Fecha:</dt>
                  <dd className="col-sm-9">{formatDate(selectedDiagnostic.fecha_diagnostico)}</dd>
                  
                  <dt className="col-sm-3">Trabajo:</dt>
                  <dd className="col-sm-9">{selectedDiagnostic.AsignacionTrabajo?.descripcion}</dd>
                  
                  <dt className="col-sm-3">Problema reportado:</dt>
                  <dd className="col-sm-9">
                    {selectedDiagnostic.AsignacionTrabajo?.RegistroServicioVehiculo?.descripcion_problema}
                  </dd>
                </dl>
              </div>

              <div className="mb-4">
                <h5 className="border-bottom pb-2">Observaciones Generales</h5>
                <p className="bg-light p-3 rounded">
                  {selectedDiagnostic.observaciones_generales}
                </p>
              </div>

              <div>
                <h5 className="border-bottom pb-2 d-flex justify-content-between align-items-center">
                  <span>Detalles del Diagnóstico</span>
                  <Badge bg="info" className="fs-6">
                    {selectedDiagnostic.DetalleDiagnosticos?.length || 0} detalles
                  </Badge>
                </h5>
                
                {selectedDiagnostic.DetalleDiagnosticos?.length > 0 ? (
                  <div>
                    {selectedDiagnostic.DetalleDiagnosticos.map((detail, index) => (
                      <Card key={detail.id_detalle_diagnostico || index} className="mb-3">
                        <Card.Header className="d-flex justify-content-between align-items-center">
                          <span>
                            <i className="bi bi-tools me-2"></i>
                            {detail.tipo_diagnostico || 'Sin tipo'}
                          </span>
                          {getSeverityBadge(detail.severidad || 'N/A')}
                        </Card.Header>
                        <Card.Body>
                          <p className="mb-0">{detail.descripcion}</p>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-light rounded">
                    <i className="bi bi-exclamation-circle text-muted fs-1"></i>
                    <p className="mt-2 mb-0">No hay detalles para este diagnóstico</p>
                  </div>
                )}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              setShowModal(false);
              // Could add functionality to add details to this diagnostic
            }}
          >
            <i className="bi bi-plus-circle me-2"></i>
            Agregar Detalle
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
