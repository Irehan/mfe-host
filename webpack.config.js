const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { ModuleFederationPlugin } = require('webpack').container;

const isDev = process.env.NODE_ENV !== 'production';

module.exports = {
  mode: isDev ? 'development' : 'production',
  entry: path.resolve(__dirname, 'src/index.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'auto',                // ✅ prevents wrong URL resolution & first-load white screen
    filename: isDev ? '[name].js' : '[name].[contenthash].js',
    chunkFilename: isDev ? '[name].js' : '[name].[contenthash].js',
    clean: true
  },
  devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js']
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
      cache: false                        // ✅ always serve fresh index.html in dev
    }),
    new ModuleFederationPlugin({
      name: 'host_container',
      filename: 'remoteEntry.js',
      remotes: {
        // Remotes resolved dynamically at runtime by your moduleLoader
      },
      exposes: {
        './ThemeProvider': './src/components/ThemeProvider.tsx',
        './ThemeSwitcher': './src/components/ThemeSwitcher.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: false },
        'react-dom': { singleton: true, requiredVersion: false },
        'react-router-dom': { singleton: true, requiredVersion: false }
      }
    })
  ],
  devServer: {
    port: 3000,
    hot: true,
    historyApiFallback: true,
    static: {
      directory: path.resolve(__dirname, 'public'),
      watch: true
    },
    headers: {
      'Cache-Control': 'no-store'        // ✅ avoid cached stale HTML/JS in dev
    },
    client: {
      overlay: true,
      progress: false,
      logging: 'info'
    }
  }
};
