import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1a1a1a",
        paper: "#FAFAF8",
        lavender: "#D4C5F9",
        mint: "#B8F0D4",
        peach: "#FFD6C0",
        butter: "#FFF0A0",
        sky: "#C2E4FF",
        rose: "#FFCCE0",
        coral: "#FF8C7A"
      },
      fontFamily: {
        display: ["Space Grotesk", "Arial", "sans-serif"],
        mono: ["DM Mono", "SFMono-Regular", "Consolas", "monospace"]
      },
      boxShadow: {
        brutal: "0 2px 0 #1a1a1a",
        "brutal-lg": "0 3px 0 #1a1a1a"
      },
      borderRadius: {
        brutal: "10px",
        badge: "6px"
      }
    }
  },
  plugins: []
};

export default config;
