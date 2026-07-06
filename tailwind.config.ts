import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { 950: "#111827", 900: "#172033", 800: "#202b42" },
        brand: { 50: "#eef6ff", 100: "#d9ebff", 400: "#60a5fa", 500: "#3182f6", 600: "#1d6fe8", 700: "#185cc1" },
      },
      boxShadow: { card: "0 1px 3px rgba(15, 23, 42, 0.04), 0 8px 24px rgba(15, 23, 42, 0.04)" },
    },
  },
  plugins: [],
};
export default config;
