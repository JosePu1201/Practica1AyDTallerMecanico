import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';
import { useNavigate } from 'react-router-dom';

export default function PartsRequestList() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [partsRequests, setPartsRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [user, setUser] = useState(null);

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
    fetchPartsRequests();
  }, []);

  const fetchPartsRequests = async () => {
    try {
      setLoading(true);
      const data = await serviceSpecialistService.getReplacementPartRequests();
      setPartsRequests(data);
      setLoading(false);
    } catch (err) {
      setError('Error al cargar las solicitudes de repuestos: ' + err.message);
      setLoading(false);
    }
  };

  const handleOpenModal = (request) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest || !user) return;

    try {
      setSubmitting(true);
      await serviceSpecialistService.acceptReplacementPart({
        id_solicitud_uso_repuesto: selectedRequest.id_solicitud_uso_repuesto,
        id_usuario_aceptacion: user.id_usuario,
        id_inventario_repuesto: selectedRequest.id_inventario_repuesto
      });

      // Refresh the list
      fetchPartsRequests();
      setShowModal(false);
      setSubmitting(false);
    } catch (err) {
      setError('Error al aprobar la solicitud: ' + err.message);
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'APROBADO':
        return <Badge bg="success">Aprobado</Badge>;
      case 'RECHAZADO':
        return <Badge bg="danger">Rechazado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No establecida';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredRequests = partsRequests.filter(req => 
    req.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.AsignacionTrabajo?.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando solicitudes de repuestos...</p>
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
        <h1>Solicitudes de Repuestos</h1>
        <div className="search-container">
          <input
            type="text"
            className="form-control"
            placeholder="Buscar solicitudes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <i className="bi bi-inbox"></i>
          </div>
          <h3>No hay solicitudes de repuestos</h3>
          <p className="text-muted">
            No se encontraron solicitudes de repuestos en el sistema.
          </p>
        </div>
      ) : (
        <Card>
          <Card.Header>
            <h5 className="mb-0">Lista de Solicitudes</h5>
          </Card.Header>
          <div className="table-responsive">
            <Table hover className="align-middle mb-0">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehículo</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Fecha Solicitud</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map(request => (
                  <tr key={request.id_solicitud_uso_repuesto}>
                    <td>{request.id_solicitud_uso_repuesto}</td>
                    <td>
                      {request.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca} {' '}
                      {request.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo}
                      <div className="small text-muted">
                        {request.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: '250px' }} className="text-truncate">
                        {request.descripcion}
                      </div>
                    </td>
                    <td>{request.cantidad}</td>
                    <td>{formatDate(request.fecha_uso)}</td>
                    <td>{getStatusBadge(request.estado)}</td>
                    <td>
                      <Button 
                        variant="outline-primary" 
                        size="sm" 
                        onClick={() => handleOpenModal(request)}
                        disabled={request.estado === 'APROBADO' || request.estado === 'RECHAZADO'}
                      >
                        <i className="bi bi-eye me-1"></i> Ver Detalles
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card>
      )}

      {/* Modal for request details */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Solicitud de Repuesto #{selectedRequest?.id_solicitud_uso_repuesto}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedRequest && (
            <div>
              <h5>Información del Trabajo</h5>
              <div className="bg-light p-3 rounded mb-3">
                <p><strong>Trabajo:</strong> {selectedRequest.AsignacionTrabajo?.descripcion}</p>
                <p><strong>Vehículo:</strong> {selectedRequest.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.marca} {selectedRequest.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.modelo}</p>
                <p><strong>Placa:</strong> {selectedRequest.AsignacionTrabajo?.RegistroServicioVehiculo?.Vehiculo?.placa}</p>
              </div>

              <h5>Detalles de la Solicitud</h5>
              <div className="bg-light p-3 rounded mb-3">
                <p><strong>Descripción:</strong> {selectedRequest.descripcion}</p>
                <p><strong>Cantidad:</strong> {selectedRequest.cantidad}</p>
                <p><strong>Estado:</strong> {selectedRequest.estado}</p>
                <p><strong>Fecha de Solicitud:</strong> {formatDate(selectedRequest.fecha_uso)}</p>
              </div>

              {selectedRequest.estado === 'PENDIENTE' && (
                <>
                  <h5>Aprobar Solicitud</h5>
                  <p>
                    ¿Está seguro de que desea aprobar esta solicitud de repuesto? Esta acción
                    actualizará el inventario.
                  </p>
                </>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cerrar
          </Button>
          {selectedRequest && selectedRequest.estado === 'PENDIENTE' && (
            <Button 
              variant="success" 
              onClick={handleApproveRequest}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Spinner as="span" size="sm" animation="border" className="me-2" />
                  Aprobando...
                </>
              ) : (
                'Aprobar Solicitud'
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
}
