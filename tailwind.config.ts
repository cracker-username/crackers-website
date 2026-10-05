import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        "bg-0": "var(--bg-0)",
        "bg-1": "var(--bg-1)",
        surface: "var(--surface)",
        "surface-1": "var(--surface-1, rgba(255, 255, 255, 0.05))",
        "surface-2": "var(--surface-2, rgba(255, 255, 255, 0.08))",
        "surface-3": "var(--surface-3, rgba(255, 255, 255, 0.12))",
        "surface-raised": "var(--surface-raised)",
        "surface-glass": "var(--surface-glass)",
        text: "var(--foreground)",
        "text-main": "var(--text-main)",
        "text-muted": "var(--text-muted)",
        muted: "var(--text-muted)",
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        accent: {
          magenta: "var(--accent-magenta)",
          orange: "var(--accent-orange)",
          gold: "var(--accent-gold)",
          cyan: "var(--accent-cyan)",
          violet: "var(--accent-violet)",
          lime: "var(--accent-lime)",
        },
        price: {
          DEFAULT: "var(--price-color)",
          mrp: "var(--price-mrp)",
          discount: "var(--price-discount)",
        },
      },
      fontFamily: {
        heading: ["var(--font-baloo)", "sans-serif"],
        body: ["var(--font-poppins)", "sans-serif"],
      },
      animation: {
        "spark-burst": "sparkBurst 0.6s ease-out forwards",
        "badge-bump": "badgeBump 0.3s ease-in-out",
        "marquee": "marquee 35s linear infinite",
        "shimmer": "shimmer 2s infinite linear",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        sparkBurst: {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        badgeBump: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.25)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      screens: {
        xs: "360px",
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
    },
  },
  plugins: [],
};

export default config;
