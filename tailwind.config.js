module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/globals.css",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF5733', // Your primary color
          focus: '#E64A2E',   // Darker shade for focus/hover
        },
        secondary: {
          DEFAULT: '#3366FF', // Your secondary color
          focus: '#2952CC',   // Darker shade for focus/hover
        },
      },
      backgroundImage: {
        gradient:
          "linear-gradient(60deg, #f79533, #f37055, #ef4e7b, #a166ab, #5073b8, #1098ad, #07b39b, #6fba82)",
      },
      animation: {
        opacity: "opacity 0.25s ease-in-out",
        appearFromRight: "appearFromRight 300ms ease-in-out",
        wiggle: "wiggle 1.5s ease-in-out infinite",
        popup: "popup 0.25s ease-in-out",
        shimmer: "shimmer 3s ease-out infinite alternate",
      },
      keyframes: {
        opacity: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        appearFromRight: {
          "0%": { opacity: 0.3, transform: "translate(15%, 0px);" },
          "100%": { opacity: 1, transform: "translate(0);" },
        },
        wiggle: {
          "0%, 20%, 80%, 100%": {
            transform: "rotate(0deg)",
          },
          "30%, 60%": {
            transform: "rotate(-2deg)",
          },
          "40%, 70%": {
            transform: "rotate(2deg)",
          },
          "45%": {
            transform: "rotate(-4deg)",
          },
          "55%": {
            transform: "rotate(4deg)",
          },
        },
        popup: {
          "0%": { transform: "scale(0.8)", opacity: 0.8 },
          "50%": { transform: "scale(1.1)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 1 },
        },
        shimmer: {
          "0%": { backgroundPosition: "0 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
    },
  },
  plugins: [require("daisyui")],
  daisyui: {
    themes: [
      {
        light: {
          // Base colors
          "primary": "#118ab2",
          "primary-focus": "#4023047",      // darker shade for hover/focus
          "primary-content": "#ffffff",     // text/content color
          
          "secondary": "#ef476f",
          "secondary-focus": "#ffd166",
          "secondary-content": "#ffffff",
          
          "accent": "#37CDBE",
          "accent-focus": "#2AA79B",
          "accent-content": "#ffffff",
          
          // Background colors
          "base-100": "#ffffff",           // main background
          "base-200": "#F2F2F2",           // slightly darker
          "base-300": "#E5E6E6",           // even darker
          "base-content": "#1F2937",       // main text color
          
          // State colors
          "info": "#3ABFF8",
          "success": "#36D399",
          "warning": "#FBBD23",
          "error": "#F87272",
          
          // Other
          "neutral": "#3D4451",            // neutral color
          "neutral-focus": "#303640",
          "neutral-content": "#ffffff",
        }
      }
    ]
  },
};
