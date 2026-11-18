import { SymbolView } from 'expo-symbols';

export type AppIconName =
  | 'dashboard'
  | 'calendar'
  | 'patients'
  | 'profile'
  | 'home'
  | 'search'
  | 'records'
  | 'doctors'
  | 'more'
  | 'bell'
  | 'clock'
  | 'location'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'chevronUp'
  | 'back'
  | 'calendarEmpty'
  | 'person'
  | 'clinic'
  | 'sun'
  | 'moon'
  | 'camera'
  | 'star'
  | 'starOutline'
  | 'mail'
  | 'phone'
  | 'language'
  | 'eye'
  | 'eyeOff'
  | 'lab'
  | 'radiology'
  | 'wallet'
  | 'instapay';

const ICON_MAP = {
  dashboard: { ios: 'square.grid.2x2.fill', android: 'dashboard', web: 'dashboard' },
  calendar: { ios: 'calendar', android: 'calendar_today', web: 'calendar_today' },
  patients: { ios: 'person.2.fill', android: 'people', web: 'people' },
  profile: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  home: { ios: 'house.fill', android: 'home', web: 'home' },
  search: { ios: 'magnifyingglass', android: 'search', web: 'search' },
  records: { ios: 'doc.text.fill', android: 'description', web: 'description' },
  doctors: { ios: 'stethoscope', android: 'medical_services', web: 'medical_services' },
  more: { ios: 'ellipsis.circle.fill', android: 'more_horiz', web: 'more_horiz' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  clock: { ios: 'clock.fill', android: 'schedule', web: 'schedule' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on', web: 'location_on' },
  chevronRight: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
  chevronLeft: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  chevronDown: { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' },
  chevronUp: { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  calendarEmpty: { ios: 'calendar.badge.exclamationmark', android: 'event_busy', web: 'event_busy' },
  person: { ios: 'person.fill', android: 'person', web: 'person' },
  clinic: { ios: 'building.2.fill', android: 'local_hospital', web: 'local_hospital' },
  sun: { ios: 'sun.max.fill', android: 'light_mode', web: 'light_mode' },
  moon: { ios: 'moon.fill', android: 'nights_stay', web: 'nights_stay' },
  camera: { ios: 'camera.fill', android: 'photo_camera', web: 'photo_camera' },
  star: { ios: 'star.fill', android: 'star', web: 'star' },
  starOutline: { ios: 'star', android: 'star_border', web: 'star_border' },
  mail: { ios: 'envelope.fill', android: 'mail', web: 'mail' },
  phone: { ios: 'phone.fill', android: 'call', web: 'call' },
  language: { ios: 'globe', android: 'language', web: 'language' },
  eye: { ios: 'eye.fill', android: 'visibility', web: 'visibility' },
  eyeOff: { ios: 'eye.slash.fill', android: 'visibility_off', web: 'visibility_off' },
  lab: { ios: 'flask.fill', android: 'science', web: 'science' },
  radiology: { ios: 'waveform.path.ecg', android: 'radiology', web: 'radiology' },
  wallet: { ios: 'wallet.pass.fill', android: 'account_balance_wallet', web: 'account_balance_wallet' },
  instapay: { ios: 'bolt.fill', android: 'flash_on', web: 'flash_on' },
} as const;

interface IconProps {
  name: AppIconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 22, color = '#0D9488' }: IconProps) {
  return (
    <SymbolView
      name={ICON_MAP[name]}
      size={size}
      tintColor={color}
      resizeMode="scaleAspectFit"
    />
  );
}
