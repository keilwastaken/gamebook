// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        cream: '#F5F0E8',
        'cream-dark': '#EBE4D8',
        
        // Primary greens (sage/olive)
        sage: {
          50: '#F2F5F0',
          100: '#E4EBE0',
          200: '#C9D7C1',
          300: '#A8BD9C',
          400: '#8BA67B',
          500: '#6B8B5E', // main accent
          600: '#557048',
          700: '#445839',
        },
        
        // Warm browns/tans
        warm: {
          50: '#FAF6F1',
          100: '#F0E6D9',
          200: '#E2CDB3',
          300: '#D4B48D',
          400: '#C49B6B', // card accent (Animal Crossing card)
          500: '#A67C52',
          600: '#8B6342',
        },
        
        // UI colors
        heart: '#9DC4B0',
        icon: '#A8B5A0',
      },
      borderRadius: {
        'cozy': '20px',
        'cozy-lg': '28px',
      },
      fontFamily: {
        // Add a rounded, friendly font if desired
        display: ['Nunito', 'System'],
      },
    },
  },
  plugins: [],
};
