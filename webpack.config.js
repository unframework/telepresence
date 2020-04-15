const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const bundleOutputPath = path.resolve(__dirname, 'dist/content'); // base path for the bundle

// the mode should always be production, otherwise browser content security complains about eval
// @todo deal with TS sourcemaps
module.exports = {
  entry: {
    index: './app/index.tsx',
    menu: './app/menu.tsx',
    content: './app/content.ts'
  },
  output: {
    path: bundleOutputPath,
    publicPath: '/',
    filename: '[name]_bundle.js'
  },
  devtool: false, // prevent security warnings in extension
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              compilerOptions: {
                noEmit: false
              }
            }
          }
        ],
        exclude: /node_modules/
      },
      { test: /\.jsx?$/, use: 'babel-loader', exclude: /node_modules/ },
      { test: /\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: 'file-loader?name=assets/[name].[hash].[ext]'
      },

      // some of the external libraries use ES6 syntax
      // compile it to ES5 for Uglify to work
      {
        test: /node_modules[\\\/]react-collectable[\\\/].*\.(js)$/,
        use: 'babel-loader'
      },
      {
        test: /node_modules[\\\/]react-dynamics[\\\/].*\.(js)$/,
        use: 'babel-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['index'],
      filename: 'index.html',
      template: 'app/index.html'
    }),
    new HtmlWebpackPlugin({
      chunks: ['menu'],
      filename: 'menu.html',
      template: 'app/menu.html'
    }),
    new CopyWebpackPlugin([{ from: 'app/meta' }])
  ]
};
