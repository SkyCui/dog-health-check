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
        ink: "#56313d",
        cocoa: "#744552",
        rose: "#ff78a7",
        roseSoft: "#fff0f6",
        blush: "#ffe6ef",
        gold: "#f7b735",
        goldSoft: "#fff3cf",
        cream: "#fffaf4",
        coral: "#d96b5f",
        leaf: "#d86690",
        mint: "#fff0f6",
        amberSoft: "#fff3cf",
        skySoft: "#eef7ff"
      },
      boxShadow: {
        panel: "0 18px 50px rgba(138, 76, 98, 0.13)",
        candy: "0 18px 42px rgba(255, 120, 167, 0.28)"
      },
      borderRadius: {
        blob: "2rem"
      }
    }
  },
  plugins: []
};

export default config;
