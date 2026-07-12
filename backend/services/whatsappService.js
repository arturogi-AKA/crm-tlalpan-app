/**
 * Envía un mensaje de confirmación por WhatsApp al prospecto tras finalizar el Paso 3.
 * @param {string} telefono - Teléfono celular del prospecto.
 * @param {string} nombre - Nombre(s) del prospecto.
 */
const enviarMensajeConfirmacion = async (telefono, nombre) => {
  try {
    const apiUrl = process.env.WHATSAPP_API_URL;
    const token = process.env.WHATSAPP_TOKEN;

    const mensaje = `¡Hola *${nombre || 'prospecto'}*! 🌟 Hemos confirmado exitosamente tu registro para conocer los predios en Tlalpan. Aquí tienes la ubicación exacta en Google Maps para nuestra cita: https://maps.google.com/?q=19.2891,-99.1678 ¡Te esperamos con mucho gusto!`;

    if (!apiUrl || !token) {
      console.log('─────────────────────────────────────────────────────────────────────────────');
      console.log('⚠️ [WHATSAPP SERVICE - RESPALDO / SIMULACIÓN]');
      console.log(`Variables WHATSAPP_API_URL o WHATSAPP_TOKEN no están definidas en process.env.`);
      console.log(`Destinatario: ${telefono}`);
      console.log(`Mensaje que se enviaría:\n"${mensaje}"`);
      console.log('─────────────────────────────────────────────────────────────────────────────');
      return { success: true, simulated: true, message: mensaje };
    }

    console.log(`[WHATSAPP SERVICE] Enviando confirmación a ${telefono}...`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: telefono,
        type: 'text',
        text: {
          body: mensaje
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [WHATSAPP SERVICE] Error HTTP ${response.status}:`, errorText);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    const data = await response.json();
    console.log('[WHATSAPP SERVICE] Mensaje enviado OK:', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ [WHATSAPP SERVICE] Error al enviar mensaje de confirmación:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  enviarMensajeConfirmacion
};
