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
        ink: "#18334b",
        cocoa: "#425c70",
        rose: "#1263b0",
        roseSoft: "#eef5fc",
        blush: "#dce9f6",
        gold: "#8a6010",
        goldSoft: "#fff9db",
        cream: "#f7fafd",
        coral: "#b62f39",
        leaf: "#1263b0",
        mint: "#eef5fc",
        amberSoft: "#fff3e7",
        skySoft: "#eef5fc"
      },
      boxShadow: {
        panel: "0 4px 18px rgba(24, 51, 75, 0.04)",
        candy: "0 4px 18px rgba(24, 51, 75, 0.06)"
      },
      borderRadius: {
        blob: "8px"
      }
    }
  },
  plugins: []
};

export default config;
