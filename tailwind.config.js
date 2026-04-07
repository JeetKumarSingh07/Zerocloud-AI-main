/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        void:    '#0d1117',
        surface: '#111827',
        panel:   '#1a2535',
        card:    '#1e293b',
        border:  '#2d4060',
        muted:   '#3a5070',
        dim:     '#6b85a0',
        soft:    '#a8bfd4',
        text:    '#e8f0f8',
        bright:  '#ffffff',
        accent:  { DEFAULT: '#34d399', dark: '#10b981' },
        iris:    { DEFAULT: '#818cf8', dark: '#6366f1' },
      },
    },
  },
  plugins: [],
}
