import { useRef, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn } from '@/shared/lib/utils';
import { getAdminDoctorCreateHref, getAdminSecretaryCreateHref } from '@/shared/navigation/routes';

const STAFF_ROLES: { value: string; href: Href; labelKey: 'staff.roleDoctor' | 'staff.roleSecretary' }[] = [
  { value: 'doctor', href: getAdminDoctorCreateHref(), labelKey: 'staff.roleDoctor' },
  { value: 'secretary', href: getAdminSecretaryCreateHref(), labelKey: 'staff.roleSecretary' },
];

export function AddStaffRoleMenu() {
  const { t } = useTranslation('admin');
  const isDark = useResolvedColorScheme() === 'dark';
  const { isRtl, rowStyle } = useLayoutDirection();
  const { width: windowWidth } = useWindowDimensions();
  const buttonRef = useRef<View>(null);
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const openMenu = () => {
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setOpen(true);
    });
  };

  const closeMenu = () => setOpen(false);

  return (
    <View collapsable={false}>
      <Pressable
        ref={buttonRef}
        collapsable={false}
        accessibilityRole="button"
        accessibilityLabel={t('staff.addMember')}
        onPress={openMenu}
        style={rowStyle}
        className="items-center gap-1 rounded-full border border-primary-600 px-3 py-2 active:opacity-80"
      >
        <Text variant="caption" className="text-primary-700 dark:text-primary-300">
          {t('staff.addMember')}
        </Text>
        <Icon name="chevronDown" size={14} color="#0F766E" />
      </Pressable>

      <Modal visible={open} transparent animationType="none" onRequestClose={closeMenu}>
        <Pressable className="flex-1" onPress={closeMenu}>
          <View
            className={cn(
              'absolute overflow-hidden rounded-2xl border py-1 shadow-lg',
              isDark ? 'border-slate-700 bg-slate-800' : 'border-slate-100 bg-white',
            )}
            style={{
              top: anchor.y + anchor.height + 6,
              minWidth: Math.max(anchor.width, 160),
              ...(isRtl
                ? { left: anchor.x }
                : { right: windowWidth - (anchor.x + anchor.width) }),
            }}
          >
            {STAFF_ROLES.map((role) => (
              <Pressable
                key={role.value}
                accessibilityRole="button"
                accessibilityLabel={t(role.labelKey)}
                onPress={() => {
                  closeMenu();
                  router.push(role.href, { withAnchor: true });
                }}
                className="px-4 py-3 active:bg-primary-50 dark:active:bg-primary-900/40"
              >
                <Text variant="body">{t(role.labelKey)}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
