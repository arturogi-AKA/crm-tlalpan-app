import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const RegistrationDashboard = () => {
  console.log("Client ID cargado en Vite:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    correo: '',
    telefono: '',
    presupuesto: '',
    ubicacion: '',
    foto_ine: ''
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isGoogleValidated, setIsGoogleValidated] = useState(false);
  const [clickedGoogle, setClickedGoogle] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData(prev => ({ ...prev, foto_ine: file }));
  };

  const nextStep = () => {
    if (step === 1 && (!formData.nombre || !formData.apellidos)) {
      setStatus({ type: 'error', message: 'Por favor completa Nombre y Apellidos' });
      return;
    }
    localStorage.setItem("crm_form_data", JSON.stringify(formData));
    setStatus({ type: '', message: '' });
    setStep(step + 1);
  };

  useEffect(() => {
    // Cargar datos guardados de localStorage al montar
    const savedData = localStorage.getItem('crm_form_data');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      setFormData(parsed);
      if (parsed.correo) {
        setGoogleEmail(parsed.correo);
      }
    }

    const hash = window.location.hash;
    if (hash && hash.includes('access_token')) {
      console.log("¡Google Autenticó con éxito!");
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get('access_token');
      
      // Limpiar URL
      window.history.replaceState(null, '', window.location.pathname);
      
      if (accessToken) {
        setLoading(true);
        setIsGoogleValidated(true);
        axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(userInfo => {
          const emailObtenido = userInfo.data.email;
          if (emailObtenido) {
            setGoogleEmail(emailObtenido);
            setFormData(prev => {
              const updated = { ...prev, correo: emailObtenido };
              localStorage.setItem("crm_form_data", JSON.stringify(updated));
              return updated;
            });
          }
        }).catch(error => {
          console.error('Error fetching Google user info', error);
          setStatus({ type: 'error', message: 'Error al obtener email, pero puedes continuar.' });
        }).finally(() => {
          setLoading(false);
          setStep(3);
        });
      } else {
        setIsGoogleValidated(true);
        setStep(3);
      }
    }
  }, []);

  useEffect(() => {
    const handleWindowFocus = () => {
      if (clickedGoogle) {
        setIsGoogleValidated(true);
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [clickedGoogle]);

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
            const updated = { ...prev, correo: emailObtenido };
            localStorage.setItem("crm_form_data", JSON.stringify(updated));
            return updated;
          });
        }
      } catch (err) {
        console.error('Error obteniendo info de Google:', err);
      }
      setIsGoogleValidated(true);
    },
    onError: (error) => console.log('Google onError:', error),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.telefono || !formData.presupuesto || !formData.foto_ine) {
      setStatus({ type: 'error', message: 'Por favor completa todos los campos, incluyendo la foto de tu INE.' });
      return;
    }
    
    setLoading(true);
    setStatus({ type: '', message: '' });

    try {
      const dataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        dataToSend.append(key, formData[key]);
      });

      const apiBaseUrl = import.meta.env.VITE_API_URL || '';
      const response = await axios.post(`${apiBaseUrl}/api/prospectos/registro`, dataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setStatus({ type: 'success', message: '¡Registro completado exitosamente!' });
      setStep(4);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Error al enviar los datos. Revisa la conexión al servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-4">
      {/* Cards container mimicking the Dashboard layout */}
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
                onClick={nextStep}
                className="bg-crm-sidebar text-white px-8 py-3.5 rounded-xl font-medium hover:bg-crm-sidebarHover transition-colors shadow-lg mt-4"
              >
                Continuar
              </button>
            </div>
          )}

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
                  onClick={() => setStep(3)}
                  className="bg-crm-sidebar text-white px-8 py-3.5 rounded-xl font-medium hover:bg-crm-sidebarHover transition-colors shadow-lg mt-4 inline-flex items-center justify-center space-x-2 animate-in fade-in duration-300"
                >
                  <span>Siguiente ➔</span>
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg animate-in fade-in slide-in-from-right-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-crm-textDark mb-2">
                  Correo electrónico
                  {googleEmail && (
                    <span className="ml-2 text-xs text-green-600 font-normal">✓ Validado con Google</span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleInputChange}
                    disabled={!!googleEmail}
                    className={`w-full px-4 py-3 pr-10 rounded-xl border outline-none ${
                      googleEmail 
                        ? 'border-green-200 bg-green-50/60 text-green-800 cursor-not-allowed' 
                        : 'border-gray-200 focus:border-crm-sidebarActive focus:ring-4 focus:ring-crm-sidebarActive/10 transition-all'
                    }`}
                    placeholder="correo@google.com"
                  />
                  {googleEmail && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">🔒</span>
                  )}
                </div>
              </div>

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

              <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full blur-2xl -mr-10 -mt-10 opacity-50 transition-transform group-hover:scale-110"></div>
                <p className="text-sm text-blue-800 font-medium leading-relaxed relative z-10 mb-4">
                  🔒 ¡Ya casi listos para recibirte! Por seguridad comunitaria e identificarte como visitante, solo requerimos una foto del FRENTE de tu INE para enviarte la ubicación exacta en Google Maps. Tu pase se activará de inmediato y tus datos están totalmente protegidos.
                </p>
                <div className="relative z-10">
                  <label className="block text-sm font-medium text-crm-textDark mb-2">Foto del INE (Frente/Vuelta)</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl hover:border-crm-sidebarActive transition-colors cursor-pointer bg-white">
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-crm-sidebarActive hover:text-crm-sidebar focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-crm-sidebarActive">
                          <span>Sube un archivo</span>
                          <input id="file-upload" name="foto_ine" type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">o arrastra y suelta</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF hasta 10MB</p>
                      {formData.foto_ine && (
                        <p className="text-sm font-semibold text-green-600 mt-2">Archivo seleccionado: {formData.foto_ine.name}</p>
                      )}
                    </div>
                  </div>
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
                onClick={() => {
                  setStep(1);
                  setFormData({ nombre: '', apellidos: '', correo: '', telefono: '', presupuesto: '', ubicacion: '', foto_ine: '' });
                  setGoogleEmail('');
                  setClickedGoogle(false);
                  setIsGoogleValidated(false);
                  localStorage.removeItem("crm_form_data");
                }}
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
