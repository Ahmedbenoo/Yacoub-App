import { useTranslation } from 'react-i18next';

import { resolvePostAuthNavigation } from '@/features/clinic/lib/navigation';
import { Select } from '@/shared/components/form/Select';
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl';
import { useAuthStore } from '@/shared/stores';
import { UserRole } from '@/shared/types/enums';

export function canToggleDoctorAndAdmin(roles: UserRole[] | undefined, activeRole: UserRole | null) {
  if (!roles || (activeRole !== UserRole.DOCTOR && activeRole !== UserRole.ADMIN)) return false;
  return roles.includes(UserRole.DOCTOR) && roles.includes(UserRole.ADMIN);
}

export function DoctorAdminRoleToggle({ appearance = 'select' }: { appearance?: 'select' | 'segmented' }) {
  const { t } = useTranslation('auth');
  const user = useAuthStore((s) => s.user);
  const activeRole = useAuthStore((s) => s.activeRole);
  const setActiveRole = useAuthStore((s) => s.setActiveRole);

  if (!canToggleDoctorAndAdmin(user?.roles, activeRole) || !user) return null;
  if (activeRole !== UserRole.DOCTOR && activeRole !== UserRole.ADMIN) return null;

  const switchRole = async (role: string) => {
    if (role !== UserRole.DOCTOR && role !== UserRole.ADMIN) return;
    if (role === activeRole) return;
    await setActiveRole(role);
    await resolvePostAuthNavigation(user);
  };

  const options = [
    { value: UserRole.DOCTOR, label: t('roleSelection.doctor') },
    { value: UserRole.ADMIN, label: t('roleSelection.admin') },
  ];

  if (appearance === 'segmented') {
    return (
      <SegmentedControl
        options={options}
        value={activeRole}
        onChange={(role) => {
          void switchRole(role);
        }}
      />
    );
  }

  return (
    <Select
      compact
      label={t('roleSwitch')}
      value={activeRole}
      onChange={(role) => {
        void switchRole(role);
      }}
      options={options}
    />
  );
}
