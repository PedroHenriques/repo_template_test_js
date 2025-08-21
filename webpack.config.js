const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const getConfigs = require('./configLoader.js');

const alias = {
  '@app': path.resolve(__dirname, 'src', "App"),
};

const makeScssRule = (isProd, baseUrl) => {
  const use = [
    { loader: 'css-loader', options: { url: false, sourceMap: !isProd } },
    {
      loader: 'postcss-loader',
      options: {
        sourceMap: !isProd,
        postcssOptions: { plugins: [require('autoprefixer')()] },
      }
    },
    {
      loader: 'sass-loader',
      options: {
        sourceMap: !isProd,
        additionalData: `$baseUrl: "${baseUrl}";`,
      }
    }
  ];
  
  // dev: style-loader for HMR; prod: extract CSS
  return {
    test: /\.s?[ac]ss$/,
    use: [isProd ? MiniCssExtractPlugin.loader : 'style-loader', ...use]
  };
};

module.exports = (env = {}, argv = {}) => {
  const isProd = argv.mode === 'production';
  const service = process.env.SERVICE;
  const baseUrl = process.env.BASE_URL;

  const configs = getConfigs(service);

  const faviconCandidates = [
    path.resolve(__dirname, 'src', service, 'favicon.png'),
    path.resolve(__dirname, 'src', service, 'favicon.ico'),
  ];
  const faviconPath = faviconCandidates.find(fs.existsSync);

  return {
    mode: isProd ? 'production' : 'development',
    entry: ['whatwg-fetch', `./src/${service}/index.tsx`],
    output: {
      path: path.resolve(__dirname, 'src', service, 'dist'),
      publicPath: baseUrl,
      filename: isProd ? 'js/[name].[contenthash:8].js' : 'js/bundle.js',
      chunkFilename: isProd ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      clean: true,
    },
    cache: {
      type: 'filesystem',
      cacheDirectory: path.resolve(__dirname, '.cache/webpack'),
      buildDependencies: {
        config: [
          __filename,
          path.resolve(__dirname, 'tsconfig.json'),
          path.resolve(__dirname, 'configLoader.js'),
          path.resolve(__dirname, 'src', service, 'index.template.html'),
        ]
      },
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      alias,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: 'ts-loader',
              options: { transpileOnly: true },
            },
          ],
          exclude: /node_modules/,
        },
        makeScssRule(isProd, baseUrl),
        {
          test: /\.(png|jpe?g|gif|svg|woff2?|eot|ttf|otf)$/i,
          type: 'asset',
          generator: { filename: 'assets/[name].[contenthash:8][ext][query]' },
        }
      ]
    },
    plugins: [
      new HtmlWebpackPlugin({
        inject: 'body',
        template: path.resolve(__dirname, 'src', service, 'index.template.html'),
        filename: 'index.html',
        ...(faviconPath ? { favicon: faviconPath } : {}),
        templateParameters: {
          PAGE_TITLE: configs.PAGE_TITLE,
        },
      }),
      ...(
        isProd
        ? [new MiniCssExtractPlugin({ filename: 'css/[name].[contenthash:8].css' })]
        : []
      ),
      new webpack.DefinePlugin({
        BASE_URL: JSON.stringify(baseUrl),
      }),
      new webpack.WatchIgnorePlugin({ paths: [/\.js$/, /\.d\.ts$/] }),
      new ForkTsCheckerWebpackPlugin(),
    ],
    optimization: isProd
      ? { minimizer: ['...', new CssMinimizerPlugin()], splitChunks: { chunks: 'all' }, runtimeChunk: 'single' }
      : undefined,
    watchOptions: {
      poll: Number(process.env.WEBPACK_WATCH_POLL) || 500,
      ignored: /node_modules/,
      aggregateTimeout: 200
    },
    devtool: isProd ? 'hidden-source-map' : 'inline-source-map',
    devServer: isProd
      ? undefined
      : {
          port: Number(process.env.APP_PORT) || 3000,
          hot: true,
          historyApiFallback: true,
          host: '0.0.0.0',
          allowedHosts: 'all',
          open: false,
          static: false,
        },
  };
};
