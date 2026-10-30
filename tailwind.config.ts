import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0a0d12",
        surface: "#11161d",
        raised: "#171e27",
        line: "#232c38",
        fg: "#e6edf3",
        muted: "#8b98a8",
        brand: "#5b9cff",
        danger: "#f0524f",
        warn: "#e8a820",
        ok: "#34c77b",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
