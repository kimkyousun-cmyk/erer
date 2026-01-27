import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0b0c10",
        panel: "#11131a",
        ink: "#f4f7ff",
        muted: "#9aa4b2",
        anger: "#ff4d4f",
        humor: "#f7b500",
        division: "#7c5cff",
        calm: "#2dd4bf"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.04), 0 12px 32px rgba(10,12,20,0.6)"
      }
    }
  },
  plugins: []
};

export default config;
