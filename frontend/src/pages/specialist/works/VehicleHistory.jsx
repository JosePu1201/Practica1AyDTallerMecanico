import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert, Accordion } from 'react-bootstrap';
import { useParams, Link } from 'react-router-dom';
import { serviceSpecialistService } from '../../../services/serviceSpecialistService';

export default function VehicleHistory() {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicleHistory = async () => {
      try {
        setLoading(true);
        const historyData = await serviceSpecialistService.getVehicleHistory(id);
        setHistory(historyData);
        
        // Set vehicle data from the first history item if available
        if (historyData.length > 0 && historyData[0].Vehiculo) {
          setVehicle(historyData[0].Vehiculo);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Error al cargar el historial del vehículo: ' + err.message);
        setLoading(false);
      }
    };
    
    if (id) {
      fetchVehicleHistory();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return 'No establecida';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDIENTE':
        return <Badge bg="warning">Pendiente</Badge>;
      case 'EN_PROCESO':
        return <Badge bg="primary">En Proceso</Badge>;
      case 'COMPLETADO':
        return <Badge bg="success">Completado</Badge>;
      case 'CANCELADO':
        return <Badge bg="danger">Cancelado</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
        <p className="mt-2">Cargando historial del vehículo...</p>
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

  if (!vehicle) {
    return (
      <Alert variant="warning">
        <Alert.Heading>Vehículo no encontrado</Alert.Heading>
        <p>No se encontró información para este vehículo.</p>
        <Link to="/specialist/works" className="btn btn-primary mt-2">
          Volver a lista de trabajos
        </Link>
      </Alert>
    );
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Historial del Vehículo</h1>
        <div>
          <Link to="/specialist/works" className="btn btn-outline-secondary">
            <i className="bi bi-arrow-left me-2"></i>
            Volver a trabajos
          </Link>
        </div>
      </div>
      
      <Card className="mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Información del Vehículo</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex align-items-center mb-3">
            <div className="vehicle-icon me-3 bg-light p-3 rounded-circle">
              <i className="bi bi-car-front fs-3 text-primary"></i>
            </div>
            <div>
              <h3 className="mb-1">
                {vehicle.marca} {vehicle.modelo}
              </h3>
              <p className="text-muted mb-0">
                Placa: <strong>{vehicle.placa}</strong> | 
                Año: <strong>{vehicle.anio}</strong> | 
                Color: <strong>{vehicle.color}</strong>
              </p>
            </div>
          </div>
          
          {vehicle.Usuario && vehicle.Usuario.Persona && (
            <div className="customer-info p-3 border-start ps-4 mt-3">
              <div className="d-flex align-items-center">
                <i className="bi bi-person-circle me-2 text-secondary fs-5"></i>
                <h5 className="mb-0">
                  {vehicle.Usuario.Persona.nombre} {vehicle.Usuario.Persona.apellido}
                </h5>
              </div>
              <p className="text-muted mb-0 small">
                Cliente #{vehicle.Usuario.id_usuario} | 
                Usuario: {vehicle.Usuario.nombre_usuario}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
      
      <h2 className="mb-3">Servicios Anteriores</h2>
      
      {history.length === 0 ? (
        <Alert variant="info">
          <Alert.Heading>Sin historial</Alert.Heading>
          <p>Este vehículo no tiene servicios registrados anteriormente.</p>
        </Alert>
      ) : (
        <Accordion defaultActiveKey="0">
          {history.map((service, index) => (
            <Accordion.Item eventKey={index.toString()} key={service.id_registro}>
              <Accordion.Header>
                <div className="d-flex justify-content-between align-items-center w-100 me-3">
                  <div>
                    <strong>Servicio #{service.id_registro}</strong> - {formatDate(service.fecha_ingreso)}
                  </div>
                  <div>
                    {getStatusBadge(service.estado)}
                  </div>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                <div className="mb-3">
                  <h5>Descripción del Problema</h5>
                  <p>{service.descripcion_problema}</p>
                  
                  {service.observaciones_iniciales && (
                    <>
                      <h5>Observaciones Iniciales</h5>
                      <p>{service.observaciones_iniciales}</p>
                    </>
                  )}
                </div>
                
                <h5>Trabajos Realizados</h5>
                {service.AsignacionTrabajos && service.AsignacionTrabajos.length > 0 ? (
                  <Table responsive bordered hover>
                    <thead className="table-light">
                      <tr>
                        <th>Tipo de Trabajo</th>
                        <th>Estado</th>
                        <th>Descripción</th>
                        <th>Fecha Asignación</th>
                        <th>Fecha Finalización</th>
                        <th>Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {service.AsignacionTrabajos.map(trabajo => (
                        <tr key={trabajo.id_asignacion}>
                          <td>{trabajo.TipoMantenimiento?.nombre_tipo || 'No especificado'}</td>
                          <td>{getStatusBadge(trabajo.estado)}</td>
                          <td>{trabajo.descripcion}</td>
                          <td>{formatDate(trabajo.fecha_asignacion)}</td>
                          <td>{trabajo.fecha_finalizacion ? formatDate(trabajo.fecha_finalizacion) : 'No finalizado'}</td>
                          <td>Q{trabajo.precio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <p className="text-muted">No hay trabajos registrados para este servicio.</p>
                )}
                
                {/* Daños Adicionales */}
                {service.AsignacionTrabajos && service.AsignacionTrabajos.some(t => t.DaniosAdicionales && t.DaniosAdicionales.length > 0) && (
                  <div className="mt-4">
                    <h5>Daños Adicionales Detectados</h5>
                    <Table responsive bordered>
                      <thead className="table-light">
                        <tr>
                          <th>Descripción</th>
                          <th>Fecha</th>
                          <th>Costo Estimado</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.AsignacionTrabajos.flatMap(trabajo => 
                          trabajo.DaniosAdicionales?.map(danio => (
                            <tr key={danio.id_danio}>
                              <td>{danio.descripcion_danio}</td>
                              <td>{formatDate(danio.fecha_danio)}</td>
                              <td>Q{danio.costo_estimado}</td>
                              <td>
                                <Badge bg={danio.autorizado ? 'success' : 'warning'}>
                                  {danio.autorizado ? 'Autorizado' : 'Pendiente'}
                                </Badge>
                              </td>
                            </tr>
                          )) || []
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
                
                {/* Repuestos Usados */}
                {service.AsignacionTrabajos && service.AsignacionTrabajos.some(t => t.SolicitudUsoRepuestos && t.SolicitudUsoRepuestos.length > 0) && (
                  <div className="mt-4">
                    <h5>Repuestos Utilizados</h5>
                    <Table responsive bordered>
                      <thead className="table-light">
                        <tr>
                          <th>Descripción</th>
                          <th>Cantidad</th>
                          <th>Fecha</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {service.AsignacionTrabajos.flatMap(trabajo => 
                          trabajo.SolicitudUsoRepuestos?.map(repuesto => (
                            <tr key={repuesto.id_solicitud_uso_repuesto}>
                              <td>{repuesto.descripcion}</td>
                              <td>{repuesto.cantidad}</td>
                              <td>{formatDate(repuesto.fecha_uso)}</td>
                              <td>
                                <Badge bg={repuesto.estado === 'APROBADO' ? 'success' : 'warning'}>
                                  {repuesto.estado}
                                </Badge>
                              </td>
                            </tr>
                          )) || []
                        )}
                      </tbody>
                    </Table>
                  </div>
                )}
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </div>
  );
}
