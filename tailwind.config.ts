import type { Config } from "tailwindcss";

// Tailwind v4 primarily uses CSS-based configuration in globals.css.
// This file is kept only for specific theme extensions that require JS.
const config: Config = {
    theme: {
        extend: {
            screens: {
                'xs': '375px',
            },
            colors: {
                background: 'var(--background)',
                foreground: 'var(--foreground)',
                muted: {
                    DEFAULT: 'var(--muted)',
                    foreground: 'var(--muted-foreground)'
                },
                accent: {
                    DEFAULT: 'var(--accent)',
                    foreground: 'var(--accent-foreground)'
                },
                border: 'var(--border)',
                input: 'var(--input)',
                ring: 'var(--ring)',
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            }
        }
    }
};
export default config;
