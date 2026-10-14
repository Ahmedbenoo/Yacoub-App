const RN = require('react-native');
const { cssInterop, remapProps } = require('nativewind');

function patch(name, mapping) {
  const original = RN[name];
  if (!original || String(original.displayName || '').startsWith('CssInterop.')) {
    return;
  }

  const wrapped = cssInterop(original, mapping);

  try {
    Object.defineProperty(RN, name, {
      configurable: true,
      enumerable: true,
      writable: true,
      value: wrapped,
    });
  } catch {
    RN[name] = wrapped;
  }
}

patch('View', { className: 'style' });
patch('Text', { className: 'style' });
patch('Pressable', { className: 'style' });
patch('Image', { className: 'style' });
patch('Switch', { className: 'style' });
patch('TouchableHighlight', { className: 'style' });
patch('TouchableOpacity', { className: 'style' });
patch('TouchableWithoutFeedback', { className: 'style' });
patch('ActivityIndicator', {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
patch('ScrollView', {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
patch('TextInput', {
  className: { target: 'style', nativeStyleToProp: { textAlign: true } },
});

if (RN.FlatList) {
  remapProps(RN.FlatList, {
    className: 'style',
    contentContainerClassName: 'contentContainerStyle',
    ListFooterComponentClassName: 'ListFooterComponentStyle',
    ListHeaderComponentClassName: 'ListHeaderComponentStyle',
    columnWrapperClassName: 'columnWrapperStyle',
  });
}

try {
  const safeArea = require('react-native-safe-area-context');
  if (safeArea.SafeAreaView && !String(safeArea.SafeAreaView.displayName || '').startsWith('CssInterop.')) {
    safeArea.SafeAreaView = cssInterop(safeArea.SafeAreaView, { className: 'style' });
  }
} catch {
  // Safe area is optional during early startup.
}
