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
      screens: { "2xl": "1320px" },
    },
    extend: {
      colors: {
        // Clinical pharmaceutical palette
        navy: {
          DEFAULT: "#002C5C",
          50: "#EBF1F8",
          100: "#D2DEEC",
          200: "#A6BDD9",
          300: "#7A9CC6",
          400: "#4D7BB3",
          500: "#1F5B9F",
          600: "#0E4682",
          700: "#063968",
          800: "#002C5C",
          900: "#001E40",
        },
        sky: {
          DEFAULT: "#1F75D0",
          50: "#EBF4FE",
          100: "#D6E8FC",
          200: "#A8CFF7",
          300: "#79B5F1",
          400: "#4B9BEC",
          500: "#1F75D0",
          600: "#175CA3",
          700: "#104377",
        },
        coral: {
          DEFAULT: "#FF6B47",
          50: "#FFF1ED",
          100: "#FFE0D6",
          200: "#FFC0AC",
          300: "#FFA083",
          400: "#FF8059",
          500: "#FF6B47",
          600: "#E0552F",
          700: "#B73F1F",
        },
        ink: "#0A1F33",
        surface: "#FFFFFF",
        cloud: {
          DEFAULT: "#F5F7FA",
          100: "#FBFCFD",
          200: "#F5F7FA",
          300: "#E8EDF3",
          400: "#D7DFE8",
        },
        danger: "#C0392B",
        // Legacy aliases mapped to new palette so older components keep working
        // until they're migrated.
        forest: {
          DEFAULT: "#002C5C",
          50: "#EBF1F8",
          100: "#D2DEEC",
          200: "#A6BDD9",
          300: "#7A9CC6",
          400: "#4D7BB3",
          500: "#1F5B9F",
          600: "#0E4682",
          700: "#063968",
          800: "#002C5C",
          900: "#001E40",
        },
        gold: {
          DEFAULT: "#FF6B47",
          50: "#FFF1ED",
          100: "#FFE0D6",
          200: "#FFC0AC",
          300: "#FFA083",
          400: "#FF8059",
          500: "#FF6B47",
          600: "#E0552F",
          700: "#B73F1F",
        },
        ivory: {
          DEFAULT: "#F5F7FA",
          100: "#FBFCFD",
          200: "#F5F7FA",
          300: "#E8EDF3",
        },
      },
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      fontSize: {
        "display-xl": ["clamp(2.75rem, 5.5vw, 5rem)", { lineHeight: "1.02", letterSpacing: "-0.025em" }],
        "display-lg": ["clamp(2.25rem, 4vw, 3.5rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        "display-md": ["clamp(1.75rem, 3vw, 2.5rem)", { lineHeight: "1.1", letterSpacing: "-0.015em" }],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(10,31,51,0.04), 0 8px 24px rgba(10,31,51,0.06)",
        card: "0 1px 2px rgba(10,31,51,0.06), 0 12px 32px rgba(10,31,51,0.08)",
        ring: "0 0 0 1px rgba(0,44,92,0.12)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "20px",
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
