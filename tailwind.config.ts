import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        accent: "var(--accent)",
        accentSecondary: "var(--accent-secondary)",
        positive: "var(--positive)",
        negative: "var(--negative)",
        text: "var(--text-primary)",
        textSecondary: "var(--text-secondary)",
        separator: "var(--separator)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Text",
          "SF Pro Display",
          "system-ui",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
} satisfies Config;
