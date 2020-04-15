const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const bundleOutputPath = path.resolve(__dirname, 'dist/content'); // base path for the bundle

// the mode should always be production, otherwise browser content security complains about eval
module.exports = {
  entry: {
    index: './app/index.jsx',
    menu: './app/menu.jsx',
    content: './app/content.js',
  },
  output: {
    path: bundleOutputPath,
    publicPath: '/',
    filename: '[name]_bundle.js',
  },
  devtool: false, // prevent security warnings in extension
  module: {
    rules: [
      { test: /\.jsx?$/, use: 'babel-loader', exclude: /node_modules/ },
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: 'file-loader?name=assets/[name].[hash].[ext]',
      },

      // some of the external libraries use ES6 syntax
      // compile it to ES5 for Uglify to work
      {
        test: /node_modules[\\\/]react-collectable[\\\/].*\.(js)$/,
        use: 'babel-loader',
      },
      {
        test: /node_modules[\\\/]react-dynamics[\\\/].*\.(js)$/,
        use: 'babel-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['index'],
      filename: 'index.html',
      template: 'app/index.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['menu'],
      filename: 'menu.html',
      template: 'app/menu.html',
    }),
    new CopyWebpackPlugin([{ from: 'app/meta' }]),
  ],
};
