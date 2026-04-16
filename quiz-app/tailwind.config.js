/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#67e8f9', // cyan-300
          DEFAULT: '#06b6d4', // cyan-500
          dark: '#0e7490', // cyan-700
        },
        secondary: {
          light: '#fde68a', // amber-200
          DEFAULT: '#facc15', // yellow-400
          dark: '#ca8a04', // yellow-600
        },
        accent: {
          light: '#fda4af', // rose-300
          DEFAULT: '#f43f5e', // rose-500
          dark: '#be123c', // rose-700
        },
        neutral: {
          light: '#f3f4f6', // gray-100
          DEFAULT: '#d1d5db', // gray-300
          dark: '#4b5563', // gray-600
          darker: '#1f2937', // gray-800
        },
        feedback: {
          low: '#ef4444', // red-500
          medium: '#f97316', // orange-500
          high: '#22c55e', // green-500
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideIn: 'slideIn 0.5s ease-in-out',
      }
    },
  },
  plugins: [],
}
