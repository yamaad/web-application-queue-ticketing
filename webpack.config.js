const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
    // I added this becuase of error happened when using 'await'
    experiments: {
        topLevelAwait: true,
    },

    mode: "development",
    entry: "./src/index.js",

    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js",
    },

    // plugins: [
    //   // new HtmlWebpackPlugin(), // Generates default index.html
    //   new HtmlWebpackPlugin({
    //     // Also generate a test.html
    //     filename: "customer.html",
    //     template: "src/customer.html",
    //   }),
    //   new HtmlWebpackPlugin({
    //     // Also generate a test.html
    //     filename: "counter.html",
    //     template: "src/counter.html",
    //   }),
    // ],
    watch: true,
};