import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{astro,ts,tsx,mdx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.25rem",
      screens: { "2xl": "1200px" },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        brutal: {
          yellow: "#D4A800",
          pink: "#CC1F66",
          green: "#0A9438",
          red: "#CC1A1A",
          blue: "#1754CC",
          orange: "#CC5200",
          black: "#0D0D0D",
          white: "#DEDEDE",
          offwhite: "#EDE8E0",
        },
      },
      fontFamily: {
        sans: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: {
        none: "0",
        sm: "0",
        DEFAULT: "0",
        md: "0",
        lg: "0",
        xl: "0",
        "2xl": "0",
        "3xl": "0",
        full: "0",
      },
      letterSpacing: {
        brutal: "0.06em",
        "brutal-wide": "0.12em",
      },
      boxShadow: {
        "brutal-sm": "var(--shadow-brutal-sm)",
        brutal: "var(--shadow-brutal)",
        "brutal-lg": "var(--shadow-brutal-lg)",
        "brutal-xl": "var(--shadow-brutal-xl)",
        "brutal-hover": "var(--shadow-brutal-hover)",
        none: "none",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
