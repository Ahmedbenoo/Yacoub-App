import { Platform, Switch as RNSwitch, View, type SwitchProps } from 'react-native';

/**
 * RN Web Switch uses `left` for the thumb. A parent `direction: rtl`
 * mirrors that offset and detaches the circle from the track.
 * Keep the control itself LTR on every platform.
 */
export function Switch(props: SwitchProps) {
  return (
    <View
      collapsable={false}
      style={{ direction: 'ltr', flexShrink: 0 }}
      // @ts-expect-error web-only CSS so the thumb stays inside the track
      dir={Platform.OS === 'web' ? 'ltr' : undefined}
    >
      <RNSwitch {...props} />
    </View>
  );
}
