import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-jakarta)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          red: '#D32F2F',    // Deep appetizing red for primary backgrounds/accents
          orange: '#FF9100', // Vibrant swiggy-orange for buttons, active states, and highlights
          cream: '#FFF8F6'   // Soft warm background tint for premium readability
        }
      },
    },
  },
  plugins: [],
};
export default config;
