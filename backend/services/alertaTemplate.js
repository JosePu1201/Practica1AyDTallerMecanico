/**
 * Plantillas HTML para correos electrónicos
 */
const alertTemplate = {
  // ...otros templates...

  /**
   * Genera un HTML con la tabla de repuestos con bajo stock
   */
  lowStockReport: function ({ lowStockItems }) {
  const rows = (lowStockItems || []).map(item => {
    const repuesto = item.Repuesto || {};
    const proveedor = repuesto.Proveedor || {};

    return `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.id_inventario_repuesto}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${repuesto.id_repuesto || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${repuesto.nombre || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${repuesto.descripcion || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${item.cantidad}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${proveedor.id_proveedor || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${proveedor.nit || '-'}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${proveedor.estado || '-'}</td>
      </tr>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
      <h2 style="color:#DC2626; text-align:center;">⚠️ Reporte de Repuestos con Bajo Stock</h2>
      <table style="width:100%; border-collapse: collapse; margin-top:20px;">
        <thead style="background-color:#f3f4f6;">
          <tr>
            <th style="padding: 8px; border: 1px solid #ddd;">ID Inventario</th>
            <th style="padding: 8px; border: 1px solid #ddd;">ID Repuesto</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Nombre Repuesto</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Descripción</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Cantidad Disponible</th>
            <th style="padding: 8px; border: 1px solid #ddd;">ID Proveedor</th>
            <th style="padding: 8px; border: 1px solid #ddd;">NIT Proveedor</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Estado Proveedor</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6" style="padding:10px;text-align:center;">No hay repuestos con bajo stock</td></tr>'}
        </tbody>
      </table>
      <div style="text-align:center; margin-top:20px; font-size:12px; color:#6B7280;">
        <p>Este es un correo automático, por favor no respondas.</p>
        <p>© ${new Date().getFullYear()} Taller Mecánico</p>
      </div>
    </div>
  `;
}

};

module.exports = alertTemplate;
