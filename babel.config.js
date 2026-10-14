module.exports = function (api) {
  api.cache.using(() => process.env.NODE_ENV);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxRuntime: 'automatic',
          jsxImportSource: 'react-native-css-interop',
        },
      ],
    ],
    plugins: ['react-native-worklets/plugin'],
  };
};
