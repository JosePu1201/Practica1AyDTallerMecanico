import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert, Row, Col, Table } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { reportService } from '../../../services/reportService';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import './styles/Reports.css';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function IncomeExpensesReport() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

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
  }, [navigate]);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      setError('Por favor seleccione fechas de inicio y fin');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await reportService.getIncomeExpensesByPeriod(startDate, endDate);
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

  // Prepare chart data
  const financialChartData = reportData ? {
    labels: reportData.dailySummary.map(day => day.date),
    datasets: [
      {
        label: 'Ingresos',
        data: reportData.dailySummary.map(day => day.income),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Egresos',
        data: reportData.dailySummary.map(day => day.expenses),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        fill: true,
        tension: 0.4
      },
      {
        label: 'Utilidad',
        data: reportData.dailySummary.map(day => day.profit),
        borderColor: '#17a2b8',
        backgroundColor: 'rgba(23, 162, 184, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  } : null;

  return (
    <div className="report-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Reporte de Ingresos y Egresos</h1>
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
            <Card.Header>Resumen Financiero</Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <div className="financial-summary">
                    <div className="summary-card income">
                      <div className="icon">
                        <i className="bi bi-graph-up-arrow"></i>
                      </div>
                      <div className="details">
                        <h3>{formatCurrency(reportData.summary.totalIncome)}</h3>
                        <p>Ingresos Totales</p>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="financial-summary">
                    <div className="summary-card expenses">
                      <div className="icon">
                        <i className="bi bi-graph-down-arrow"></i>
                      </div>
                      <div className="details">
                        <h3>{formatCurrency(reportData.summary.totalExpenses)}</h3>
                        <p>Egresos Totales</p>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="financial-summary">
                    <div className="summary-card profit">
                      <div className="icon">
                        <i className="bi bi-cash-coin"></i>
                      </div>
                      <div className="details">
                        <h3>{formatCurrency(reportData.summary.netProfit)}</h3>
                        <p>Utilidad Neta</p>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              
              <div className="profit-margin-indicator mt-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Margen de Utilidad:</span>
                  <span className="fw-bold">{reportData.summary.profitMargin}</span>
                </div>
                <div className="progress" style={{ height: '10px' }}>
                  <div 
                    className="progress-bar bg-success" 
                    role="progressbar" 
                    style={{ 
                      width: `${parseFloat(reportData.summary.profitMargin)}%`,
                      minWidth: '5%'
                    }}
                    aria-valuenow={parseFloat(reportData.summary.profitMargin)}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  />
                </div>
              </div>
            </Card.Body>
          </Card>

          <Card className="mb-4">
            <Card.Header>Gráfico de Ingresos y Egresos en el Período</Card.Header>
            <Card.Body>
              <div style={{ height: '400px' }}>
                {financialChartData && (
                  <Line
                    data={financialChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Fecha'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Cantidad (Q)'
                          },
                          beginAtZero: true
                        }
                      },
                      plugins: {
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              let label = context.dataset.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                              }
                              return label;
                            }
                          }
                        }
                      }
                    }}
                  />
                )}
              </div>
            </Card.Body>
          </Card>

          <div className="btn-group w-100 mb-4">
            <Button
              variant={activeTab === 'summary' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('summary')}
            >
              Resumen
            </Button>
            <Button
              variant={activeTab === 'income' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('income')}
            >
              Ingresos
            </Button>
            <Button
              variant={activeTab === 'expenses' ? 'primary' : 'outline-primary'}
              onClick={() => setActiveTab('expenses')}
            >
              Egresos
            </Button>
          </div>

          {activeTab === 'summary' && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Resumen por Día</h5>
              </Card.Header>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th className="text-end">Ingresos</th>
                      <th className="text-end">Egresos</th>
                      <th className="text-end">Utilidad</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dailySummary.map((day, index) => (
                      <tr key={index}>
                        <td>{formatDate(day.date)}</td>
                        <td className="text-end text-success">{formatCurrency(day.income)}</td>
                        <td className="text-end text-danger">{formatCurrency(day.expenses)}</td>
                        <td className={`text-end ${day.profit >= 0 ? 'text-success' : 'text-danger'}`}>
                          {formatCurrency(day.profit)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td className="fw-bold">Total</td>
                      <td className="text-end fw-bold text-success">
                        {formatCurrency(reportData.summary.totalIncome)}
                      </td>
                      <td className="text-end fw-bold text-danger">
                        {formatCurrency(reportData.summary.totalExpenses)}
                      </td>
                      <td className={`text-end fw-bold ${reportData.summary.netProfit >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(reportData.summary.netProfit)}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card>
          )}

          {activeTab === 'income' && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Detalle de Ingresos</h5>
              </Card.Header>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Factura</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th className="text-end">Subtotal</th>
                      <th className="text-end">Impuestos</th>
                      <th className="text-end">Descuentos</th>
                      <th className="text-end">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.invoices.map((invoice, index) => (
                      <tr key={index}>
                        <td>{invoice.invoiceNumber}</td>
                        <td>{formatDate(invoice.date)}</td>
                        <td>{invoice.customer}</td>
                        <td>{invoice.vehicle}</td>
                        <td className="text-end">{formatCurrency(invoice.subtotal)}</td>
                        <td className="text-end">{formatCurrency(invoice.taxes)}</td>
                        <td className="text-end">{formatCurrency(invoice.discounts)}</td>
                        <td className="text-end fw-bold">{formatCurrency(invoice.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="7" className="text-end fw-bold">Total Ingresos:</td>
                      <td className="text-end fw-bold">{formatCurrency(reportData.summary.totalIncome)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card>
          )}

          {activeTab === 'expenses' && (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Detalle de Egresos</h5>
              </Card.Header>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Fecha</th>
                      <th>Proveedor</th>
                      <th>Método de Pago</th>
                      <th>Referencia</th>
                      <th>Registrado por</th>
                      <th className="text-end">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.expenses.map((expense, index) => (
                      <tr key={index}>
                        <td>{expense.paymentId}</td>
                        <td>{formatDate(expense.date)}</td>
                        <td>{expense.provider}</td>
                        <td>{expense.paymentMethod}</td>
                        <td>{expense.reference}</td>
                        <td>{expense.registeredBy}</td>
                        <td className="text-end fw-bold">{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan="6" className="text-end fw-bold">Total Egresos:</td>
                      <td className="text-end fw-bold">{formatCurrency(reportData.summary.totalExpenses)}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
