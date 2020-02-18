module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
        root: ['./src'],
        alias: {
          '@delta': './src/delta',
          '@test': './src/test',
          '@core': './src/core',
          '@model': './src/model',
          '@components': './src/components',
          '@hooks': './src/hooks'
        },
      },
    ],
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-object-rest-spread',
  ],
  ignore: ['**/__tests__/**'],
}
