/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            backgroundImage: {
                'custom-gradient': 'linear-gradient(96deg, #6600fc, #fa3988 51.56%, #ff8408)',
            },
            spacing: {
                '15': '3.9rem', // Add custom spacing
                '17': '4.25rem', // Add custom spacing
                '18': '4.5rem',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '4rem',
                '6xl': '5rem',
            },

        },
    },
    plugins: [],
}

