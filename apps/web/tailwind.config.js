/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}', 
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      colors: {
        'neu-light-base': '#e0e5ec', 
        'neu-dark-base': '#21252d',  
        'neu-light-shadow-light': '#ffffff',
        'neu-light-shadow-dark': '#a3b1c6',
        'neu-dark-shadow-light': '#3c4352',
        'neu-dark-shadow-dark': '#181c24',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
      },
      boxShadow: {
        'neu-light-inset': 'inset 5px 5px 10px #a3b1c6, inset -5px -5px 10px #ffffff',
        'neu-light-convex': '5px 5px 10px #a3b1c6, -5px -5px 10px #ffffff',
        'neu-light-concave': 'inset 5px 5px 10px #a3b1c6, inset -5px -5px 10px #ffffff, 1px 1px 2px #ffffff, -1px -1px 2px #a3b1c6', 

        'neu-dark-inset': 'inset 5px 5px 10px #181c24, inset -5px -5px 10px #3c4352',
        'neu-dark-convex': '5px 5px 10px #181c24, -5px -5px 10px #3c4352',
        'neu-dark-concave': 'inset 5px 5px 10px #181c24, inset -5px -5px 10px #3c4352, 1px 1px 2px #3c4352, -1px -1px 2px #181c24',
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
};