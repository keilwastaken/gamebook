const { palette } = require("./constants/palette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cream: palette.cream,
        sage: palette.sage,
        warm: palette.warm,
        heart: palette.heart,
        icon: palette.icon,
      },
      borderRadius: {
        cozy: "20px",
        "cozy-lg": "28px",
      },
      fontFamily: {
        // Add a rounded, friendly font if desired
        display: ["Nunito", "System"],
      },
    },
  },
  plugins: [],
};
