/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--bg-surface)',
        desk: 'var(--bg-desk)',
        folio: 'var(--bg-folio)',
        cell: 'var(--bg-cell)',
        'container-low': 'var(--bg-container-low)',
        container: 'var(--bg-container)',
        'container-high': 'var(--bg-container-high)',
        'container-highest': 'var(--bg-container-highest)',
        primary: {
          DEFAULT: 'var(--color-primary)',
          container: 'var(--color-primary-container)',
          light: 'var(--color-primary-light)',
        },
        ink: 'var(--color-ink)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          container: 'var(--color-secondary-container)',
        },
        tertiary: 'var(--color-tertiary)',
        'seal-brass': 'var(--color-seal-brass)',
        'stamp-red': 'var(--color-stamp-red)',
        'error-container': 'var(--color-error-container)',
      },
      fontFamily: {
        serif: ['Newsreader', 'Georgia', 'serif'],
        sans: ['Public Sans', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderColor: {
        hairline: '#dad5c8',
        double: '#1e2a33',
        primary: '#3e5c55',
      }
    },
  },
  plugins: [],
}
