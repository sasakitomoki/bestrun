import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SAP Fiori color palette
        brand: {
          DEFAULT: "#0070F2", // SAP Blue
          light: "#5AACFF",   // SAP Blue light
          dark: "#0040B0",    // SAP Blue dark
        },
        sap: {
          shell: "#1D2D3E",   // Shell bar / header
          bg: "#F5F6F7",      // Page background
          blue: "#0070F2",
          "blue-dark": "#0040B0",
          "blue-light": "#EBF5FF",
          "text-dark": "#1D2D3E",
          "text-mid": "#475E75",
          "border": "#D9D9D9",
          "success": "#188918",
          "error": "#B00000",
        },
      },
      fontFamily: {
        sap: ['"72"', '"72full"', "Arial", "Helvetica", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
