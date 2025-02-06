const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    mode: 'development', // Change to 'production' for production builds
    entry: './public/js/main.js', // Entry point for Webpack (your main JavaScript file)
    output: {
        path: path.resolve(__dirname, 'dist'), // Output directory
        filename: 'bundle.js', // Name of the bundled file
        clean: true, // Clean the output directory before each build
    },
    module: {
        rules: [
            {
                test: /\.js$/, // Match all .js files
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Transpile modern JS for older browsers
                },
            },
            {
                test: /\.css$/, // Match .css files
                use: ['style-loader', 'css-loader'], // Handle CSS imports
            },
            {
                test: /\.(png|jpg|gif|svg)$/, // Match image files
                type: 'asset/resource', // Handle images as assets
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './public/index.html', // Use your existing index.html
            filename: 'index.html', // Output file
        }),
    ],
    devServer: {
        static: './dist', // Serve from the dist folder
        port: 3000, // Run the server on port 3000
        open: true, // Automatically open the browser
    },
};
