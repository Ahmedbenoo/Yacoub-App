import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { ClinicCoverCard } from '@/features/admin/components/ClinicCoverCard';
import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useAuthStore } from '@/shared/stores';

const SETTINGS: { title: string; subtitle: string; href: string; icon: AppIconName }[] = [
  { title: 'أسعار الباقات', subtitle: 'الباقة الحالية والأسعار', href: '/(admin)/plans', icon: 'star' },
  { title: 'إدارة الجداول', subtitle: 'مواعيد الدكاترة', href: '/(admin)/schedules', icon: 'calendar' },
  { title: 'صفحة العيادة', subtitle: 'المواعيد والسعر والخريطة', href: '/(admin)/clinic-page', icon: 'clinic' },
];

function SettingsRow({
  title,
  subtitle,
  icon,
  href,
}: {
  title: string;
  subtitle: string;
  icon: AppIconName;
  href: string;
}) {
  const { forwardIconName, rowStyle } = useLayoutDirection();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      className="active:opacity-80"
      onPress={() => router.push(href as never)}
    >
      <Card className="flex-row items-center gap-3" style={rowStyle}>
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-50 dark:bg-primary-900/30">
          <Icon name={icon} size={18} color="#0D9488" />
        </View>
        <View className="min-w-0 flex-1 gap-0.5">
          <Text variant="titleSm">{title}</Text>
          <Text variant="caption" muted>
            {subtitle}
          </Text>
        </View>
        <Icon name={forwardIconName} size={18} color="#94A3B8" />
      </Card>
    </Pressable>
  );
}

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
        <SettingsRow key={item.href} {...item} />
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
