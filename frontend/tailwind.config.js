/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'] },
      colors: {
        primary: { 50:'#eef2ff',100:'#e0e7ff',200:'#c7d2fe',300:'#a5b4fc',400:'#818cf8',500:'#6366f1',600:'#4f46e5',700:'#4338ca',800:'#3730a3',900:'#312e81' },
        brand:   { 50:'#eef2ff',100:'#e0e7ff',500:'#6366f1',600:'#4f46e5',700:'#4338ca' },
        surface: { 1:'#ffffff',2:'#f8f7ff',3:'#f1f0fe' },
      },
      screens: { xs: '480px' },
      borderRadius: { 'xl':'14px','2xl':'20px','3xl':'28px' },
      boxShadow: {
        'card':'0 1px 3px rgba(99,102,241,.08),0 1px 2px rgba(99,102,241,.05)',
        'card-md':'0 4px 16px rgba(99,102,241,.12),0 2px 6px rgba(99,102,241,.06)',
        'card-lg':'0 8px 32px rgba(99,102,241,.16),0 4px 12px rgba(99,102,241,.08)',
        'btn':'0 2px 8px rgba(99,102,241,.35)','btn-hover':'0 4px 16px rgba(99,102,241,.45)',
      },
      backgroundImage: {
        'hero-gradient':'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%)',
        'card-gradient':'linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%)',
        'warm-gradient':'linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)',
        'cool-gradient':'linear-gradient(135deg,#06b6d4 0%,#6366f1 100%)',
        'green-gradient':'linear-gradient(135deg,#10b981 0%,#06b6d4 100%)',
      },
    },
  },
  plugins: [],
}
