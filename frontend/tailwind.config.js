/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
        extend: {
                fontFamily: {
                        pixel: ['"Press Start 2P"', 'cursive'],
                        terminal: ['"VT323"', 'monospace'],
                        mono: ['"Space Mono"', 'monospace'],
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        // Retro neon colors
                        neon: {
                                cyan: '#00f3ff',
                                green: '#39ff14',
                                pink: '#ff0099',
                                amber: '#ffb000',
                        }
                },
                keyframes: {
                        'accordion-down': {
                                from: { height: '0' },
                                to: { height: 'var(--radix-accordion-content-height)' }
                        },
                        'accordion-up': {
                                from: { height: 'var(--radix-accordion-content-height)' },
                                to: { height: '0' }
                        },
                        'blink': {
                                '0%, 100%': { opacity: '1' },
                                '50%': { opacity: '0' }
                        },
                        'glow-pulse': {
                                '0%, 100%': { textShadow: '0 0 5px currentColor' },
                                '50%': { textShadow: '0 0 15px currentColor, 0 0 25px currentColor' }
                        },
                        'scan': {
                                '0%': { transform: 'translateY(-100%)' },
                                '100%': { transform: 'translateY(100vh)' }
                        }
                },
                animation: {
                        'accordion-down': 'accordion-down 0.2s ease-out',
                        'accordion-up': 'accordion-up 0.2s ease-out',
                        'blink': 'blink 1s step-end infinite',
                        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
                        'scan': 'scan 8s linear infinite'
                },
                boxShadow: {
                        'pixel': '-4px 0 0 0 currentColor, 4px 0 0 0 currentColor, 0 -4px 0 0 currentColor, 0 4px 0 0 currentColor',
                        'neon': '0 0 5px currentColor, 0 0 10px currentColor',
                        'neon-lg': '0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor'
                }
        }
  },
  plugins: [require("tailwindcss-animate")],
};
