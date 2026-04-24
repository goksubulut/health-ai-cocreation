/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--border-strong)",
        ring: "var(--accent-violet)",
        background: "var(--bg)",
        foreground: "var(--fg)",
        primary: {
          DEFAULT: "var(--fg)",
          foreground: "var(--bg-elev-1)",
        },
        secondary: {
          DEFAULT: "var(--bg-inset)",
          foreground: "var(--fg)",
        },
        destructive: {
          DEFAULT: "var(--status-danger)",
          foreground: "#fff",
        },
        muted: {
          DEFAULT: "var(--bg-elev-2)",
          foreground: "var(--fg-subtle)",
        },
        accent: {
          DEFAULT: "var(--accent-violet)",
          foreground: "var(--accent-violet-fg)",
        },
        popover: {
          DEFAULT: "var(--bg-elev-1)",
          foreground: "var(--fg)",
        },
        card: {
          DEFAULT: "var(--bg-elev-1)",
          foreground: "var(--fg)",
        },
        brand: {
          emerald: "var(--accent-emerald)",
          violet: "var(--accent-violet)",
          amber: "var(--status-warning)",
          neutral: "var(--fg)",
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        serif: ['Instrument Serif', 'serif'],
      },
      borderRadius: {
        lg: `var(--radius-lg)`,
        md: `var(--radius-md)`,
        sm: `var(--radius-sm)`,
        xl: `var(--radius-xl)`,
      },
      spacing: {
        18: "4.5rem",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
}
