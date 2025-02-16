import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'phonescreen': '479px',
      },
      fontFamily: {
        pixel: ['var(--font-pixelify-sans)', 'sans-serif'],
        silkscreen: ['var(--font-silkscreen)', 'sans-serif'],
      },
      colors: {
        'primary': 'var(--main-color)',
        'secondary': 'var(--secondary-color)',
        'background': 'var(--background)',
        'secondary-background': 'var(--secondary-background)',
        'border-transparent': 'var(--border-transparent)',
      },
      backgroundImage: {
        'custom-bg': "url('/dust-scratches-bg.png'), url('/dots.svg')",
      },
      backgroundPosition: {
        'custom-pos': '50% 50%, 50% 50%',
      },
      backgroundSize: {
        'custom-size': 'auto auto',
      },
      backgroundRepeat: {
        'custom-repeat': 'repeat, repeat',
      },
      backgroundAttachment: {
        'custom-attachment': 'scroll, scroll',
      },
    },
  },
  plugins: [],
};
export default config;
