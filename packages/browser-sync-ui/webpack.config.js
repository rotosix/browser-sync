var webpack = require('webpack');
var config = {
    mode: 'production', // 'development' or 'production'
    devtool: 'sourcemaps',
    context: __dirname + '/src/scripts',
    entry: [
        "./app.js"
    ],
    output: {
        path: __dirname + "/public",
        filename: "js/app.js"
    },
    optimization: {
        minimize: true
    },
    watchOptions: {
        poll: true
    }
};

module.exports = config;
