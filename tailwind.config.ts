import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./content/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        forest: {
          DEFAULT: "#1B4332",
          50: "#EEF5F1",
          100: "#D6E7DD",
          200: "#A9CCB7",
          300: "#7CB191",
          400: "#4F966A",
          500: "#357A51",
          600: "#2A6341",
          700: "#1B4332",
          800: "#133228",
          900: "#0B2118",
        },
        gold: {
          DEFAULT: "#C9A84C",
          50: "#FAF4E2",
          100: "#F3E7B7",
          200: "#E7D078",
          300: "#D8B955",
          400: "#C9A84C",
          500: "#B08E35",
          600: "#8A6F28",
        },
        ivory: {
          DEFAULT: "#F8F4EE",
          100: "#FDFBF7",
          200: "#F8F4EE",
          300: "#EFE8DB",
        },
        ink: "#1A1A1A",
        surface: "#FFFFFF",
        danger: "#C0392B",
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.5rem, 5vw, 4.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-lg": ["clamp(2rem, 4vw, 3.25rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
        "display-md": ["clamp(1.625rem, 3vw, 2.25rem)", { lineHeight: "1.15", letterSpacing: "-0.01em" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,26,26,0.04), 0 8px 24px rgba(26,26,26,0.06)",
        card: "0 1px 2px rgba(26,26,26,0.06), 0 12px 32px rgba(26,26,26,0.08)",
        ring: "0 0 0 1px rgba(27,67,50,0.12)",
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "10px",
        xl: "16px",
      },
      transitionTimingFunction: {
        brand: "cubic-bezier(0.2, 0.65, 0.2, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out",
        "slide-in-right": "slide-in-right 0.3s cubic-bezier(0.2, 0.65, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
