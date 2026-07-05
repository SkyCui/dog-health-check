import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        leaf: "#2f7d5c",
        mint: "#dff4e8",
        amberSoft: "#fff2cf",
        coral: "#d96b5f",
        skySoft: "#dceefa"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(31, 41, 51, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
