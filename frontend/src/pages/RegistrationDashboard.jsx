import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || '';

const RegistrationDashboard = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',   // email validado con Google (se conserva en estado, no se muestra en Paso 3)
    email: '',
    telefono: '',
    presupuesto: '',
    ubicacion: '',
  });
  const [idCliente, setIdCliente] = useState('');   // ID generado en Paso 1
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isGoogleValidated, setIsGoogleValidated] = useState(false);
  const [clickedGoogle, setClickedGoogle] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ─── Rehydrate desde localStorage al montar ───────────────────────────────
  useEffect(() => {
    const savedData = localStorage.getItem('crm_form_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData(prev => ({ ...prev, ...parsed }));
      const savedEmail = parsed.correo || parsed.email || '';
      if (savedEmail) setGoogleEmail(savedEmail);
    }

    const savedId = localStorage.getItem('crm_id_cliente');
    if (savedId) setIdCliente(savedId);

    const savedStep = localStorage.getItem('crm_step');
    if (savedStep) setStep(parseInt(savedStep, 10));

    // Manejar redirect de Google (access_token en hash)
    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      window.history.replaceState(null, '', window.location.pathname);

      if (accessToken) {
        setLoading(true);
        setIsGoogleValidated(true);
        axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(async userInfo => {
          const emailObtenido = userInfo.data.email;
          if (emailObtenido) {
            setGoogleEmail(emailObtenido);
            const newData = { correo: emailObtenido, email: emailObtenido };
            setFormData(prev => {
              const updated = { ...prev, ...newData };
              localStorage.setItem('crm_form_data', JSON.stringify(updated));
              return updated;
            });
            // Enviar correo al backend (Paso 2)
            const currentId = localStorage.getItem('crm_id_cliente');
            if (currentId) {
              try {
                await axios.post(`${API}/api/prospectos/actualizar-correo`, {
                  id_cliente: currentId,
                  correo: emailObtenido
                });
              } catch (err) {
                console.error('Error actualizando correo vía hash redirect:', err);
              }
            }
          }
        }).catch(error => {
          console.error('Error fetching Google user info:', error);
          setStatus({ type: 'error', message: 'Error al obtener email, pero puedes continuar.' });
        }).finally(() => {
          setLoading(false);
          setStep(3);
          localStorage.setItem('crm_step', '3');
        });
      } else {
        setIsGoogleValidated(true);
        setStep(3);
        localStorage.setItem('crm_step', '3');
      }
    }
  }, []);

  // ─── Listener de foco para validación de Google ───────────────────────────
  useEffect(() => {
    const handleWindowFocus = () => {
      if (clickedGoogle) setIsGoogleValidated(true);
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [clickedGoogle]);

  // ─── PASO 1: "Continuar" → POST /api/prospectos/step1 ──────────────────
  const handleStep1 = async () => {
    if (!formData.nombre || !formData.apellidos) {
      setStatus({ type: 'error', message: 'Por favor completa Nombre y Apellidos.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      console.log('[Paso 1] Enviando a:', `${API}/api/prospectos/step1`);
      const response = await fetch(`${API}/api/prospectos/step1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          Nombre_Manual: formData.nombre,
          Apellidos_Manual: formData.apellidos
        })
      });

      const data = await response.json();
      console.log('[Paso 1] Respuesta OK:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.message || `Error HTTP: ${response.status}`);
      }

      const nuevoId = data.ID_Cliente || data.id_cliente;
      setIdCliente(nuevoId);
      localStorage.setItem('crm_id_cliente', nuevoId);
      localStorage.setItem('crm_form_data', JSON.stringify(formData));
      localStorage.setItem('crm_step', '2');
      setStep(2);
    } catch (error) {
      console.error('[Paso 1] Error completo:', error);
      setStatus({
        type: 'error',
        message: `Error al guardar los datos: ${error.message || 'Error desconocido'}`
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaso1 = handleStep1;


  // ─── PASO 2: Google login → obtiene email → POST /api/prospectos/actualizar-correo
  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      console.log('¡Google onSuccess disparado!', tokenResponse);
      try {
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        });
        const emailObtenido = userInfo.data.email;
        if (emailObtenido) {
          setGoogleEmail(emailObtenido);
          setFormData(prev => {
            const updated = { ...prev, correo: emailObtenido, email: emailObtenido };
            localStorage.setItem('crm_form_data', JSON.stringify(updated));
            return updated;
          });

          // Guardar correo en Google Sheets (Paso 2)
          const currentId = idCliente || localStorage.getItem('crm_id_cliente');
          if (currentId) {
            try {
              await axios.post(`${API}/api/prospectos/actualizar-correo`, {
                id_cliente: currentId,
                correo: emailObtenido
              });
              console.log('Correo registrado en Sheets.');
            } catch (sheetErr) {
              console.error('Error al actualizar correo en Sheets:', sheetErr);
            }
          }
        }
      } catch (err) {
        console.error('Error obteniendo info de Google:', err);
      }
      setIsGoogleValidated(true);
    },
    onError: (error) => console.log('Google onError:', error),
  });

  // ─── Avanzar de Paso 2 a Paso 3 ──────────────────────────────────────────
  const handlePaso2Siguiente = () => {
    localStorage.setItem('crm_step', '3');
    setStep(3);
  };

  // ─── PASO 3: Submit → POST /api/prospectos/completar ─────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.telefono || !formData.presupuesto) {
      setStatus({ type: 'error', message: 'Por favor completa Teléfono y Presupuesto.' });
      return;
    }

    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const currentId = idCliente || localStorage.getItem('crm_id_cliente');
      await axios.post(`${API}/api/prospectos/completar`, {
        id_cliente: currentId,
        telefono: formData.telefono,
        presupuesto: formData.presupuesto
      });

      setStatus({ type: 'success', message: '¡Registro completado exitosamente!' });
      // Limpiar localStorage del flujo
      localStorage.removeItem('crm_form_data');
      localStorage.removeItem('crm_id_cliente');
      localStorage.removeItem('crm_step');
      setStep(4);
    } catch (error) {
      console.error('Error en Paso 3:', error);
      setStatus({ type: 'error', message: 'Error al completar el registro. Intenta de nuevo.' });
    } finally {
      setLoading(false);
    }
  };

  // ─── Reset completo ───────────────────────────────────────────────────────
  const handleReset = () => {
    setStep(1);
    setFormData({ nombre: '', apellidos: '', correo: '', email: '', telefono: '', presupuesto: '', ubicacion: '' });
    setIdCliente('');
    setGoogleEmail('');
    setClickedGoogle(false);
    setIsGoogleValidated(false);
    setStatus({ type: '', message: '' });
    localStorage.removeItem('crm_form_data');
    localStorage.removeItem('crm_id_cliente');
    localStorage.removeItem('crm_step');
  };

  return (
    <div className="max-w-4xl mx-auto mt-4">
      {/* Indicadores de paso */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className={`glass-card rounded-2xl p-6 transition-all duration-300 ${step === 1 ? 'ring-2 ring-crm-sidebarActive scale-105' : 'opacity-70'}`}>
          <h3 className="font-bold text-crm-sidebar mb-2">Paso 1</h3>
          <p className="text-sm text-crm-textGray">Datos Básicos</p>
        </div>
        <div className={`glass-card rounded-2xl p-6 transition-all duration-300 ${step === 2 ? 'ring-2 ring-crm-sidebarActive scale-105' : 'opacity-70'}`}>
          <h3 className="font-bold text-crm-sidebar mb-2">Paso 2</h3>
          <p className="text-sm text-crm-textGray">Validación Google</p>
        </div>
        <div className={`glass-card rounded-2xl p-6 transition-all duration-300 ${step === 3 ? 'ring-2 ring-crm-sidebarActive scale-105' : 'opacity-70'}`}>
          <h3 className="font-bold text-crm-sidebar mb-2">Paso 3</h3>
          <p className="text-sm text-crm-textGray">Detalles Finales</p>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-10 mt-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-50"></div>

        <h2 className="text-2xl font-bold text-crm-sidebar mb-8 relative z-10">¡Comienzo registrándome!</h2>
        {step === 2 && (
          <p className="text-crm-textGray text-sm -mt-6 mb-8 relative z-10 animate-in fade-in duration-300">
            Valido mi correo para seguir comunicados.
          </p>
        )}

        {status.message && step !== 4 && (
          <div className={`p-4 rounded-xl mb-6 flex items-center space-x-3 text-sm font-medium ${status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
            {status.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{status.message}</span>
          </div>
        )}

        <div className="relative z-10">

          {/* ═══════════════════════════════════════════════════════════════ PASO 1 */}
          {step === 1 && (
            <div className="space-y-6 max-w-lg animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-crm-textDark mb-2">Nombre(s)</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-crm-sidebarActive focus:ring-4 focus:ring-crm-sidebarActive/10 outline-none transition-all"
                  placeholder="Ej. Juan Carlos"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-crm-textDark mb-2">Apellidos</label>
                <input
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-crm-sidebarActive focus:ring-4 focus:ring-crm-sidebarActive/10 outline-none transition-all"
                  placeholder="Ej. Pérez Gómez"
                />
              </div>
              <button
                onClick={handleStep1}
                disabled={loading}
                className="bg-crm-sidebar text-white px-8 py-3.5 rounded-xl font-medium hover:bg-crm-sidebarHover transition-colors shadow-lg mt-4 flex items-center space-x-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <span>Continuar</span>
                )}
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ PASO 2 */}
          {step === 2 && (
            <div className="space-y-6 max-w-lg text-center py-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-2">Autenticación Requerida</h3>
              <p className="text-crm-textGray mb-8">Valida tu identidad con Google para continuar con el registro.</p>

              <button
                onClick={() => {
                  setClickedGoogle(true);
                  loginWithGoogle();
                }}
                disabled={loading}
                className="flex items-center justify-center space-x-3 w-full bg-white border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm mb-4"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-crm-sidebar border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span>Validar con tu cuenta de Google</span>
                  </>
                )}
              </button>

              {isGoogleValidated && (
                <button
                  onClick={handlePaso2Siguiente}
                  className="bg-crm-sidebar text-white px-8 py-3.5 rounded-xl font-medium hover:bg-crm-sidebarHover transition-colors shadow-lg mt-4 inline-flex items-center justify-center space-x-2 animate-in fade-in duration-300"
                >
                  <span>Siguiente ➔</span>
                </button>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ PASO 3 */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg animate-in fade-in slide-in-from-right-4 duration-500">

              {/* Correo validado — solo informativo, NO es un input editable */}
              {(formData.correo || formData.email || googleEmail) && (
                <div className="flex items-center space-x-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <span className="text-green-500 text-xl">✅</span>
                  <div>
                    <p className="text-xs text-green-600 font-medium">Correo validado con Google</p>
                    <p className="text-sm font-semibold text-green-800">
                      {formData.correo || formData.email || googleEmail}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-crm-textDark mb-2">Teléfono Celular</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-crm-sidebarActive focus:ring-4 focus:ring-crm-sidebarActive/10 outline-none transition-all"
                  placeholder="Ej. 55 1234 5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-crm-textDark mb-2">Presupuesto Estimado ($MXN)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input
                    type="number"
                    name="presupuesto"
                    value={formData.presupuesto}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 focus:border-crm-sidebarActive focus:ring-4 focus:ring-crm-sidebarActive/10 outline-none transition-all"
                    placeholder="50000"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="bg-crm-sidebar text-white w-full py-4 rounded-xl font-bold text-lg hover:bg-crm-sidebarHover transition-all shadow-lg flex justify-center items-center"
              >
                {loading ? (
                  <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  'Programar mi cita'
                )}
              </button>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════ PASO 4 */}
          {step === 4 && (
            <div className="text-center py-10 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={48} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-bold text-crm-sidebar mb-4">¡Registro Confirmado!</h2>
              <p className="text-crm-textDark text-lg mb-8 max-w-xl mx-auto leading-relaxed font-medium">
                ¡Felicidades! Tu registro ha sido confirmado con éxito. 🌟 En este momento estamos enviando un mensaje de WhatsApp al número celular que registraste con la ubicación exacta en Google Maps para nuestra cita. ¡Te esperamos con mucho gusto!
              </p>
              <button
                onClick={handleReset}
                className="bg-white border border-gray-200 text-crm-sidebar px-8 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all shadow-sm"
              >
                Registrar Nuevo Prospecto
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default RegistrationDashboard;
