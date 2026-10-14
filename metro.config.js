const fs = require('fs');
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
const previousGetTransformOptions = config.transformer.getTransformOptions;

config.transformer.getTransformOptions = async (entryPoints, options, getDependenciesOf) => {
  const defaults = previousGetTransformOptions
    ? await previousGetTransformOptions(entryPoints, options, getDependenciesOf)
    : { transform: {} };

  return {
    ...defaults,
    transform: {
      ...defaults.transform,
      experimentalImportSupport: false,
      inlineRequires: false,
    },
  };
};

// Gradle builds through the D:\p junction. NativeWind compares CSS paths with ===, so use the
// real file path and inject the compiled stylesheet even when Metro's dirname form differs.
const nativeWindInput = fs.realpathSync(path.resolve(__dirname, 'global.css')).replace(/\\/g, '/');
const nativeWindConfig = withNativeWind(config, { input: nativeWindInput });
nativeWindConfig.transformerPath = path.resolve(__dirname, 'metro.nativewind-transformer.js');

const nativewindJsxRuntime = path.resolve(__dirname, 'node_modules/nativewind/jsx-runtime/index.js');
const nativewindJsxDevRuntime = path.resolve(
  __dirname,
  'node_modules/nativewind/jsx-dev-runtime/index.js',
);
const previousResolveRequest = nativeWindConfig.resolver.resolveRequest;

nativeWindConfig.resolver.resolveRequest = (context, moduleName, platform) => {
  const origin = context.originModulePath || '';
  const fromInterop =
    origin.includes(`${path.sep}react-native-css-interop${path.sep}`) ||
    origin.includes(`${path.sep}nativewind${path.sep}`);

  if (!fromInterop && moduleName === 'react/jsx-runtime') {
    return { filePath: nativewindJsxRuntime, type: 'sourceFile' };
  }

  if (!fromInterop && moduleName === 'react/jsx-dev-runtime') {
    return { filePath: nativewindJsxDevRuntime, type: 'sourceFile' };
  }

  if (previousResolveRequest) {
    return previousResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = nativeWindConfig;
