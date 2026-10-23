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
        // Brand palette sampled from the IP6 Original logo (2026-10-22): navy #001840, gold #B08830, gold highlight #E8C870.
        navy: {
          DEFAULT: "#001840",
          50: "#EAEEF5",
          100: "#CDD5E4",
          200: "#9EAECB",
          300: "#6C84AE",
          400: "#3A5A90",
          500: "#1C3F78",
          600: "#0C2C5E",
          700: "#06224F",
          800: "#001840",
          900: "#000F2A",
        },
        gold: {
          DEFAULT: "#B08830",
          50: "#FBF6E8",
          100: "#F7EBC8",
          200: "#F0D896",
          300: "#E8C870",
          400: "#C9A24A",
          500: "#B08830",
          600: "#A07020",
          700: "#7E5A14",
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
          DEFAULT: "#B08830",
          50: "#FBF6E8",
          100: "#F7EBC8",
          200: "#F0D896",
          300: "#E8C870",
          400: "#C9A24A",
          500: "#B08830",
          600: "#A07020",
          700: "#7E5A14",
        },
        heroSky: {
          from: "#F7F9FB",
          mid: "#E5F8FC",
          to: "#BFEDF6",
        },
        coral: {
          DEFAULT: "#B08830",
          50: "#FBF6E8",
          100: "#F7EBC8",
          200: "#F0D896",
          300: "#E8C870",
          400: "#C9A24A",
          500: "#B08830",
          600: "#A07020",
          700: "#7E5A14",
        },
        ink: "#001840",
        // Buttons use the logo navy. Hover is one step lighter.
        button: { DEFAULT: "#001840", hover: "#0C2C5E" },
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
          DEFAULT: "#001840",
          50: "#EAEEF5",
          100: "#CDD5E4",
          200: "#9EAECB",
          300: "#6C84AE",
          400: "#3A5A90",
          500: "#1C3F78",
          600: "#0C2C5E",
          700: "#06224F",
          800: "#001840",
          900: "#000F2A",
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
