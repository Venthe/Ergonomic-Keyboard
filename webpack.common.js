const path = require('path')
const ESLintPlugin = require('eslint-webpack-plugin')
const spawn = require('child_process').spawn

const OpenJSCADPlugin = {
  apply: (compiler) => {
    compiler.hooks.afterEmit.tap('AfterEmitPlugin', (compilation) => {
      const child = spawn('npm run jscad:build --silent', [], { shell: true })
      child.stdout.on('data', d => console.log(d.toString()))
      child.stderr.on('data', d => console.error(d.toString()))
    })
  }
}

const config = {
  entry: './src/keyboard.ts',
  devtool: 'inline-source-map',
  optimization: {
    usedExports: true
  },
  plugins: [
    // new ESLintPlugin({
    //   extensions: ['.tsx', '.ts', '.js'],
    //   exclude: 'node_modules'
    // }),
    OpenJSCADPlugin
  ],
  performance: {
    hints: false
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },
  output: {
    filename: 'keyboard.js',
    // library: 'self',
    libraryTarget: 'commonjs2',
    // filename: '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    clean: false
  },
  // FIXME: Required on windows?
  watchOptions: {
    poll: 1000,
    ignored: /node_modules/
  }
}

module.exports = config
