const reportController = require('../Controller/reportController');
const express = require('express');
const router = express.Router();

/*
Reportes Operativos del Taller
*/
router.get('/trabajos_por_periodo', reportController.getWorksByPeriod);
router.get('/historial_mantenimiento/:vehicleId', reportController.getMaintenanceHistoryByVehicle);
router.get('/trabajos_completados', reportController.getCompletedWorks);
router.get('/vehiculos', reportController.getVehicles);

/*
Reportes Financieros y de Facturación
*/
router.get('/ingresos_gastos', reportController.getIncomeExpensesByPeriod);
router.get('/gastos_proveedor', reportController.getProviderExpenses);
router.get('/proveedores', reportController.getProviders);

/*
Reportes de Inventario y Repuestos
*/

router.get('/partes_usadas', reportController.getPartUsageByPeriod);
router.get('/partes_mas_usadas', reportController.getMostUsedPartsByVehicleType);

/*
Reportes de Clientes y Atención
*/
router.get('/clientes', reportController.getClients);
router.get('/cliente_historial/:clientId', reportController.getServiceHistoryByClient);
router.get('/cliente_calificaciones', reportController.getServiceRatings);

module.exports = router;
