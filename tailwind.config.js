/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/**/*.{html,js,ejs}', // Include EJS and JS files from your `src` folder
        './views/**/*.ejs', // Include EJS files from your `views` folder
    ],
    theme: {
        extend: {
            colors: {
                black: {
                    DEFAULT: '#000000', // Full black
                    900: 'rgba(0, 0, 0, 0.9)', // 90% black
                    800: 'rgba(0, 0, 0, 0.8)', // 80% black
                    700: 'rgba(0, 0, 0, 0.7)', // 70% black
                    600: 'rgba(0, 0, 0, 0.6)', // 60% black
                    500: 'rgba(0, 0, 0, 0.5)', // 50% black
                    400: 'rgba(0, 0, 0, 0.4)', // 40% black
                    300: 'rgba(0, 0, 0, 0.3)', // 30% black
                    200: 'rgba(0, 0, 0, 0.2)', // 20% black
                    100: 'rgba(0, 0, 0, 0.1)', // 10% black
                    50: 'rgba(0, 0, 0, 0.05)', // 5% black
                },
                white: {
                    DEFAULT: '#ffffff', // Full white
                    900: 'rgba(255, 255, 255, 0.9)', // 90% white
                    800: 'rgba(255, 255, 255, 0.8)', // 80% white
                    700: 'rgba(255, 255, 255, 0.7)', // 70% white
                    600: 'rgba(255, 255, 255, 0.6)', // 60% white
                    500: 'rgba(255, 255, 255, 0.5)', // 50% white
                    400: 'rgba(255, 255, 255, 0.4)', // 40% white
                    300: 'rgba(255, 255, 255, 0.3)', // 30% white
                    200: 'rgba(255, 255, 255, 0.2)', // 20% white
                    100: 'rgba(255, 255, 255, 0.1)', // 10% white
                },
                slate: {
                    DEFAULT: '#002942', // Base Slate color
                    900: 'rgba(0, 41, 66, 0.9)', // 90% Slate
                    800: 'rgba(0, 41, 66, 0.8)', // 80% Slate
                    700: 'rgba(0, 41, 66, 0.7)', // 70% Slate
                    600: 'rgba(0, 41, 66, 0.6)', // 60% Slate
                    500: 'rgba(0, 41, 66, 0.5)', // 50% Slate
                    400: 'rgba(0, 41, 66, 0.4)', // 40% Slate
                    300: 'rgba(0, 41, 66, 0.3)', // 30% Slate
                    200: 'rgba(0, 41, 66, 0.2)', // 20% Slate
                    100: 'rgba(0, 41, 66, 0.1)', // 10% Slate
                },
                brand: {
                    DEFAULT: '#062c65', // Base Slate color
                    900: '#004aad',
                    800: '#004fd7',
                    700: '#0060ff',
                    600: '#0079ff',
                    500: '#079fff',
                    400: '#35c3ff',
                    300: '#76daff',
                    200: '#aee7ff',
                    100: '#d1f1ff',
                    50: '#ebf8ff',
                }
              },
              fontSize: {
                    // Headings
                    heading1: [
                        '64px',
                        { lineHeight: '70px', letterSpacing: '-2%', fontWeight: '700' },
                    ], // H1
                    heading2: [
                        '48px',
                        { lineHeight: '54px', letterSpacing: '-2%', fontWeight: '700' },
                    ], // H2
                    heading3: [
                        '40px',
                        { lineHeight: '44px', letterSpacing: '-2%', fontWeight: '700' },
                    ], // H3
                    heading4: [
                        '36px',
                        { lineHeight: '40px', letterSpacing: '-2%', fontWeight: '700' },
                    ], // H4
                    heading5: [
                        '28px',
                        { lineHeight: '32px', letterSpacing: '-2%', fontWeight: '700' },
                    ], // H5
                    heading6: [
                        '24px',
                        { lineHeight: '26px', letterSpacing: '-2%', fontWeight: '700' },
                    ], // H6

                    // Body Typography
                    'body-large': [
                        '20px',
                        { lineHeight: '30px', letterSpacing: '-2%', fontWeight: '400' },
                    ],
                    'body-large-medium': [
                        '20px',
                        { lineHeight: '30px', letterSpacing: '-2%', fontWeight: '500' },
                    ],
                    'body-large-semibold': [
                        '20px',
                        { lineHeight: '30px', letterSpacing: '-2%', fontWeight: '600' },
                    ],

                    'body-medium': [
                        '18px',
                        { lineHeight: '28px', letterSpacing: '-2%', fontWeight: '400' },
                    ],
                    'body-medium-medium': [
                        '18px',
                        { lineHeight: '28px', letterSpacing: '-2%', fontWeight: '500' },
                    ],
                    'body-medium-semibold': [
                        '18px',
                        { lineHeight: '28px', letterSpacing: '-2%', fontWeight: '600' },
                    ],

                    'body-base': [
                        '16px',
                        { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '400' },
                    ],
                    'body-base-medium': [
                        '16px',
                        { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '500' },
                    ],
                    'body-base-semibold': [
                        '16px',
                        { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '600' },
                    ],

                    'body-small': [
                        '15px',
                        { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '400' },
                    ],
                    'body-small-medium': [
                        '15px',
                        { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '500' },
                    ],
                    'body-small-semibold': [
                        '15px',
                        { lineHeight: '24px', letterSpacing: '-2%', fontWeight: '600' },
                    ],

                    'body-xsmall': [
                        '14px',
                        { lineHeight: '20px', letterSpacing: '-2%', fontWeight: '400' },
                    ],
                    'body-xsmall-medium': [
                        '14px',
                        { lineHeight: '20px', letterSpacing: '-2%', fontWeight: '500' },
                    ],
                    'body-xsmall-semibold': [
                        '14px',
                        { lineHeight: '20px', letterSpacing: '-2%', fontWeight: '600' },
                    ],

                    'body-2xsmall': [
                        '13px',
                        { lineHeight: '18px', letterSpacing: '-2%', fontWeight: '400' },
                    ],
                    'body-2xsmall-medium': [
                        '13px',
                        { lineHeight: '18px', letterSpacing: '-2%', fontWeight: '500' },
                    ],
                    'body-2xsmall-semibold': [
                        '13px',
                        { lineHeight: '18px', letterSpacing: '-2%', fontWeight: '600' },
                    ],
                },
                fontFamily: {
                    aeonik: ['aeonik', 'sans-serif'],
                    body: ['inter', 'sans-serif'],
                },
        },
        plugins: [],
    },
};
