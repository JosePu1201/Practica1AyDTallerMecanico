import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import './styles/ReportsDashboard.css';

export default function ReportsDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

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

  const reportCategories = [
    {
      title: 'Reportes Operativos',
      icon: 'bi-tools',
      color: 'primary',
      reports: [
        { name: 'Trabajos por Período', path: '/admin/reportes/trabajos-por-periodo', icon: 'bi-calendar-range' },
        { name: 'Historial de Mantenimiento por Vehículo', path: '/admin/reportes/historial-mantenimiento', icon: 'bi-car-front' },
        { name: 'Trabajos Completados', path: '/admin/reportes/trabajos-completados', icon: 'bi-check-circle' }
      ]
    },
    {
      title: 'Reportes Financieros',
      icon: 'bi-cash-coin',
      color: 'success',
      reports: [
        { name: 'Ingresos y Egresos', path: '/admin/reportes/ingresos-egresos', icon: 'bi-graph-up-arrow' },
        { name: 'Gastos por Proveedor', path: '/admin/reportes/gastos-proveedor', icon: 'bi-truck' }
      ]
    },
    {
      title: 'Reportes de Inventario',
      icon: 'bi-box-seam',
      color: 'warning',
      reports: [
        { name: 'Uso de Repuestos', path: '/admin/reportes/uso-repuestos', icon: 'bi-wrench' },
        { name: 'Repuestos más usados por Vehículo', path: '/admin/reportes/repuestos-vehiculo', icon: 'bi-funnel' }
      ]
    },
    {
      title: 'Reportes de Clientes',
      icon: 'bi-people',
      color: 'info',
      reports: [
        { name: 'Historial por Cliente', path: '/admin/reportes/historial-cliente', icon: 'bi-person-lines-fill' },
        { name: 'Calificaciones de Servicio', path: '/admin/reportes/calificaciones', icon: 'bi-star' }
      ]
    }
  ];

  return (
    <div className="reports-dashboard">
      <h1 className="mb-4">Reportes del Sistema</h1>
      
      <Row>
        {reportCategories.map((category, idx) => (
          <Col md={6} key={idx} className="mb-4">
            <Card className="report-category-card h-100">
              <Card.Header className={`bg-${category.color} text-white`}>
                <h5 className="mb-0">
                  <i className={`bi ${category.icon} me-2`}></i>
                  {category.title}
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="d-grid gap-2">
                  {category.reports.map((report, i) => (
                    <Button 
                      key={i}
                      as={Link}
                      to={report.path}
                      variant={`outline-${category.color}`}
                      className="text-start report-button"
                    >
                      <i className={`bi ${report.icon} me-2`}></i>
                      {report.name}
                    </Button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
}
