/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Lora", "Georgia", "Times New Roman", "serif"],
        mono: ["JetBrains Mono", "Menlo", "Consolas", "monospace"],
      },
      colors: {
        bg: "#f8fafc",
        sidebar: "#ffffff",
        "surface-hover": "#f1f5f9",
        ink: "#0f172a",
        muted: "#475569",
        faint: "#94a3b8",
        border: "#e2e8f0",
        accent: "#4f46e5",
        "accent-hover": "#4338ca",
        "accent-light": "#eef2ff",
        success: "#059669",
        warning: "#d97706",
        danger: "#dc2626",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(-10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        "scale-in": "scaleIn 0.2s ease-out",
      },
      typography: (theme) => ({
        planyourjourney: {
          css: {
            "--tw-prose-body": theme("colors.ink"),
            "--tw-prose-headings": theme("colors.ink"),
            "--tw-prose-links": theme("colors.accent"),
            "--tw-prose-bold": theme("colors.ink"),
            "--tw-prose-quotes": theme("colors.muted"),
            "--tw-prose-quote-borders": theme("colors.border"),
            "--tw-prose-code": theme("colors.ink"),
            maxWidth: "none",
            fontFamily: theme("fontFamily.sans").join(", "),
            lineHeight: "1.8",
            h2: {
              fontFamily: theme("fontFamily.sans").join(", "),
              fontWeight: "600",
            },
            h3: {
              fontFamily: theme("fontFamily.sans").join(", "),
              fontWeight: "600",
            },
            blockquote: {
              borderLeftColor: theme("colors.accent"),
              fontStyle: "italic",
            },
            code: {
              fontFamily: theme("fontFamily.mono").join(", "),
              fontSize: "0.875em",
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
