// packages/host/webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src/index.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'auto',
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    chunkFilename: isDev ? '[name].js' : '[name].[contenthash].js',
    clean: true,
  },
  devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
  resolve: { extensions: ['.tsx', '.ts', '.jsx', '.js'] },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      cache: false,
    }),

    // ✅ expose process.env.VITE_REGISTRY_URL to the browser bundle
    new webpack.EnvironmentPlugin({
      VITE_REGISTRY_URL: '', // default empty; we’ll read it safely in code
    }),

    // ✅ copy everything from public/ into dist/ (includes config.json)
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'public'), to: '.' },
      ],
    }),

    new ModuleFederationPlugin({
      name: 'host_container',
      filename: 'remoteEntry.js',
      exposes: {
        './ThemeProvider': './src/components/ThemeProvider.tsx',
        './ThemeSwitcher': './src/components/ThemeSwitcher.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        'react-router-dom': { singleton: true, requiredVersion: false },
      },
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    static: { directory: path.resolve(__dirname, 'public'), watch: true },
    headers: { 'Cache-Control': 'no-store' },
    client: { overlay: true, progress: false, logging: 'info' },
  },
};
