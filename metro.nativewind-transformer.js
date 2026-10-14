const path = require('path');
const cssInteropTransformer = require('react-native-css-interop/dist/metro/transformer');

module.exports.transform = async function transform(config, projectRoot, filename, data, options) {
  const normalized = String(filename).replace(/\\/g, '/');
  const isNativeWindCache = /\/react-native-css-interop\/\.cache\/(android|native|ios|macos|windows)\.js$/.test(
    normalized,
  );

  if (isNativeWindCache) {
    return cssInteropTransformer.transform(
      {
        ...config,
        cssInterop_outputDirectory: path.dirname(filename),
      },
      projectRoot,
      filename,
      data,
      options,
    );
  }

  return cssInteropTransformer.transform(config, projectRoot, filename, data, options);
};
