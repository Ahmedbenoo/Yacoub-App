import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { ClinicCoverCard } from '@/features/admin/components/ClinicCoverCard';
import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { SettingsNavRow } from '@/shared/components/layout/SettingsNavRow';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { type AppIconName } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useAuthStore } from '@/shared/stores';

const SETTINGS: { title: string; subtitle: string; href: string; icon: AppIconName }[] = [
  { title: 'إدارة الجداول', subtitle: 'مواعيد الدكاترة', href: '/(admin)/schedules', icon: 'calendar' },
  { title: 'صفحة العيادة', subtitle: 'المواعيد والسعر والخريطة', href: '/(admin)/clinic-page', icon: 'clinic' },
  { title: 'الإشعارات', subtitle: 'التنبيهات وفئات الإشعارات', href: '/(admin)/notification-settings', icon: 'bell' },
  { title: 'التقارير', subtitle: 'تقارير الفرع والحجوزات', href: '/(admin)/reports', icon: 'records' },
  { title: 'الاشتراك', subtitle: 'الباقة الحالية والأسعار', href: '/(admin)/plans', icon: 'star' },
  { title: 'الأدوار', subtitle: 'طبيب أو مدير العيادة', href: '/(admin)/roles', icon: 'doctors' },
  { title: 'المحفظة', subtitle: 'رقم التحويل وطلبات الشحن', href: '/(admin)/wallet', icon: 'phone' },
  { title: 'الفروع', subtitle: 'اختيار الفرع النشط', href: '/(admin)/active-clinic', icon: 'clinic' },
  { title: 'اللغة', subtitle: 'العربية والإنجليزية', href: '/(admin)/language', icon: 'language' },
  { title: 'المظهر', subtitle: 'فاتح أو داكن أو النظام', href: '/(admin)/theme', icon: 'sun' },
];

const extraStaff: { id: string; name: string; role: string }[] = [
  { id: 'staff-accounts', name: 'قسم الحسابات', role: 'حسابات' },
];

export function ClinicRulesPanel() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const clinicsQuery = useUserClinicsQuery();
  const [staffName, setStaffName] = useState('');
  const [staff, setStaff] = useState(extraStaff);
  const pendingQuery = useQuery({
    queryKey: ['clinics', 'pending', userId],
    queryFn: () => clinicsService.listPending(userId ?? ''),
    enabled: Boolean(userId),
  });

  const approve = useMutation({
    mutationFn: (id: string) => clinicsService.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinics'] });
      Toast.show({ type: 'success', text1: 'العياده اتأكدت' });
    },
  });

  const clinicCount = clinicsQuery.data?.length ?? 0;
  const showExtraStaff = clinicCount > 2;

  return (
    <View className="gap-3 pb-2">
      <ClinicCoverCard />
      {SETTINGS.map((item) => (
        <SettingsNavRow key={item.href} {...item} href={item.href as never} />
      ))}

      {(pendingQuery.data ?? []).map((clinic) => (
        <Card key={clinic.id} className="gap-2">
          <Text variant="titleSm">{clinic.name}</Text>
          <Text variant="bodySm">بانتظار موافقة الإدارة</Text>
          <Button
            title="اعتماد العياده"
            onPress={() => approve.mutate(clinic.id)}
            loading={approve.isPending}
            fullWidth
          />
        </Card>
      ))}

      {showExtraStaff ? (
        <Card className="gap-3">
          <Text variant="titleSm">موظفين العياده</Text>
          {staff.map((item) => (
            <Text key={item.id} variant="bodySm">
              {item.name} — {item.role}
            </Text>
          ))}
          <Input label="اسم الموظف" value={staffName} onChangeText={setStaffName} />
          <Button
            title="إضافة للحسابات"
            variant="outline"
            fullWidth
            disabled={!staffName.trim()}
            onPress={() => {
              setStaff((current) => [
                ...current,
                { id: `staff-${Date.now()}`, name: staffName.trim(), role: 'حسابات' },
              ]);
              setStaffName('');
            }}
          />
        </Card>
      ) : null}
    </View>
  );
}
