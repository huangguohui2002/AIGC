/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.45" }],
        sm: ["0.9375rem", { lineHeight: "1.55" }],
        base: ["1rem", { lineHeight: "1.65" }],
        lg: ["1.125rem", { lineHeight: "1.65" }],
        xl: ["1.25rem", { lineHeight: "1.6" }],
        "2xl": ["1.625rem", { lineHeight: "1.35" }],
        "3xl": ["2rem", { lineHeight: "1.24" }],
        "4xl": ["2.8rem", { lineHeight: "1.14" }],
        "5xl": ["3.6rem", { lineHeight: "1.1" }],
        "6xl": ["4.2rem", { lineHeight: "1.06" }],
      },
      fontFamily: {
        sans: [
          "Avenir Next",
          "PingFang SC",
          "Microsoft YaHei",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        serif: ["Georgia", "Times New Roman", "Songti SC", "STSong", "serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "monospace"],
      },
      colors: {
        parchment: "#f5f4ed",
        ivory: "#faf9f5",
        sand: "#e8e6dc",
        charcoal: "#141413",
        stone: "#5e5d59",
        terracotta: "#c96442",
        warmgray: "#87867f",
      },
      backgroundImage: {
        "grid-pattern":
          "radial-gradient(circle, rgba(94,93,89,0.12) 1px, transparent 1px)",
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      backgroundSize: {
        grid: "32px 32px",
      },
      animation: {
        "fade-in": "fadeIn 0.28s ease-out",
        "slide-up": "slideUp 0.32s ease-out",
        float: "float 8s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      boxShadow: {
        card: "0 4px 24px rgba(20,20,19,0.05)",
        "card-hover": "0 12px 36px rgba(20,20,19,0.08)",
        glass:
          "0 12px 36px rgba(20,20,19,0.06), 0 0 0 1px rgba(209,207,197,0.7)",
        "glass-hover":
          "0 18px 44px rgba(20,20,19,0.08), 0 0 0 1px rgba(194,192,182,0.9)",
      },
    },
  },
  plugins: [],
}
