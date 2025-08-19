//templete para recuperar contrase単a

/**
 * Plantillas HTML para correos electrónicos
 */
const recuperarContrasenaTemplate = {
  // ...existing code...

  /**
   * Genera el HTML para el envío de código de verificación
   */
  recuperationCode: function(data) {
    const { codigoVerificacion } = data;
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4F46E5; margin-bottom: 5px;">Recuperar Contraseña</h1>
          <p style="color: #6B7280; font-size: 16px;">Tu código de recuperacion es:</p>
          <h2 style="color: #10B981; font-size: 32px; margin: 20px 0;">${codigoVerificacion}</h2>
          <p style="color: #4B5563;">Este código expira en 15 minutos.</p>
        </div>
        <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #9CA3AF; font-size: 12px;">
          <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
          <p>© ${new Date().getFullYear()} Taller Mecánico. Todos los derechos reservados.</p>
        </div>
      </div>
    `;
  }
};

module.exports = recuperarContrasenaTemplate;