// packages/host/webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDev = process.env.NODE_ENV !== 'production';

const config = {
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
      filename: 'index.html',
      cache: false,
    }),
    new webpack.EnvironmentPlugin({
      VITE_REGISTRY_URL: '',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public'),
          to: '.',
          globOptions: { ignore: ['**/index.html'] },
          noErrorOnMissing: true,
        },
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

console.log(
  'Plugins:',
  (config.plugins || []).map((p) => (p && p.constructor && p.constructor.name) || 'Unknown')
);

module.exports = config;
