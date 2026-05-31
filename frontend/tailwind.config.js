/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        crm: {
          sidebar: '#2A2952', // Color oscuro del sidebar
          sidebarHover: '#3B3A6B',
          sidebarActive: '#8A87E8', // Color morado claro para el botón activo
          bg: '#F5F5FC', // Fondo gris muy claro
          textDark: '#1E1B4B',
          textGray: '#8A8B9F',
          card: '#FFFFFF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}
