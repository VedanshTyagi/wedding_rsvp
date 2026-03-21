import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        crimson: "#9A2143",
        gold: "#BFA054",
        sand: "#EDD498",
        cream: "#FBF8F2",
        steel: "#9e8878",
        navy: "#2c1810",
      },
      fontFamily: {
        display: ["var(--font-cormorant)", "Georgia", "serif"],
        body: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-cormorant)", "Georgia", "serif"],
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
      },
      fontSize: {
        'xs': ['0.875rem', { lineHeight: '1.25rem' }], // 14px (was 12)
        'sm': ['1rem', { lineHeight: '1.5rem' }],  // 16px (was 14)
        'base': ['1.125rem', { lineHeight: '1.75rem' }], // 18px (was 16)
        'lg': ['1.25rem', { lineHeight: '1.75rem' }], // 20px (was 18)
        'xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px (was 20)
        '2xl': ['1.75rem', { lineHeight: '2.25rem' }], // 28px (was 24)
        '3xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px (was 30)
      },
    },
  },
  plugins: [],
};
export default config;