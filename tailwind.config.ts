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
        // Brand palette: Deep Navy / Gold / Scientific Cyan / Soft White
        navy: {
          DEFAULT: "#0B1F3A",
          50: "#EAEEF4",
          100: "#CCD3DF",
          200: "#9AA8BF",
          300: "#677D9F",
          400: "#3A547F",
          500: "#1B375F",
          600: "#13294A",
          700: "#0E2440",
          800: "#0B1F3A",
          900: "#06122A",
        },
        gold: {
          DEFAULT: "#C9A961",
          50: "#FAF6EC",
          100: "#F2E9CD",
          200: "#E5D29C",
          300: "#D9BD79",
          400: "#D1B26C",
          500: "#C9A961",
          600: "#A98B43",
          700: "#7C642F",
        },
        sky: {
          DEFAULT: "#00B4D8",
          50: "#E5F8FC",
          100: "#BFEDF6",
          200: "#80D9EC",
          300: "#40C7E2",
          400: "#1ABCDB",
          500: "#00B4D8",
          600: "#0090AE",
          700: "#006C82",
        },
        teal: {
          DEFAULT: "#00B4D8",
          50: "#E5F8FC",
          100: "#BFEDF6",
          200: "#80D9EC",
          300: "#40C7E2",
          400: "#1ABCDB",
          500: "#00B4D8",
          600: "#0090AE",
          700: "#006C82",
        },
        brandRed: {
          // brand red role retired — alias to gold so existing className references
          // map cleanly into the brand palette without needing component edits.
          DEFAULT: "#C9A961",
          50: "#FAF6EC",
          100: "#F2E9CD",
          200: "#E5D29C",
          300: "#D9BD79",
          400: "#D1B26C",
          500: "#C9A961",
          600: "#A98B43",
          700: "#7C642F",
        },
        heroSky: {
          from: "#F7F9FB",
          mid: "#E5F8FC",
          to: "#BFEDF6",
        },
        coral: {
          // alias to gold for legacy class refs
          DEFAULT: "#C9A961",
          50: "#FAF6EC",
          100: "#F2E9CD",
          200: "#E5D29C",
          300: "#D9BD79",
          400: "#D1B26C",
          500: "#C9A961",
          600: "#A98B43",
          700: "#7C642F",
        },
        ink: "#0B1F3A",
        surface: "#FFFFFF",
        cloud: {
          DEFAULT: "#F7F9FB",
          100: "#FFFFFF",
          200: "#F7F9FB",
          300: "#E8EDF3",
          400: "#D7DFE8",
        },
        danger: "#C0392B",
        // Legacy aliases mapped to current brand palette.
        forest: {
          DEFAULT: "#0B1F3A",
          50: "#EAEEF4",
          100: "#CCD3DF",
          200: "#9AA8BF",
          300: "#677D9F",
          400: "#3A547F",
          500: "#1B375F",
          600: "#13294A",
          700: "#0E2440",
          800: "#0B1F3A",
          900: "#06122A",
        },
        ivory: {
          DEFAULT: "#F7F9FB",
          100: "#FFFFFF",
          200: "#F7F9FB",
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
