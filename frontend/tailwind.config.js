/** @type {import("tailwindcss").Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'custom-bg': 'var(--color-bg)',
        'primary': 'var(--color-primary)',
        'primary-dark': 'var(--color-primary-dark)',
        'secondary': 'var(--color-secondary)',
        'accent': 'var(--color-accent)',
        'surface': 'var(--color-surface)',
      },
    },
  },
  plugins: [],
}
