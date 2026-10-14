import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { useDoctorsQuery } from '@/features/catalog/doctors/hooks/useDoctorsQueries';
import { getFullName } from '@/features/patient/lib/formatters';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';
import { Spinner } from '@/shared/components/feedback/Spinner';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { getAdminDoctorScheduleHref } from '@/shared/navigation/routes';
import { useAuthStore } from '@/shared/stores';

export function AdminSchedulesScreen() {
  const clinicId = useAuthStore((state) => state.activeClinicId);
  const { forwardIconName } = useLayoutDirection();
  const doctorsQuery = useDoctorsQuery(clinicId ? { clinicId } : {});
  const doctors = (doctorsQuery.data?.data ?? []).filter((doctor) => doctor.isActive !== false);

  return (
    <Screen scroll>
      <Header showBack title="إدارة الجداول" />
      <View className="gap-3 pb-8">
        {doctorsQuery.isLoading ? <Spinner /> : null}
        {doctors.map((doctor) => (
          <Pressable
            key={doctor.id}
            accessibilityRole="button"
            className="active:opacity-80"
            onPress={() => router.push(getAdminDoctorScheduleHref(doctor.id))}
          >
            <Card className="flex-row items-center gap-3">
              <View className="min-w-0 flex-1 gap-0.5">
                <Text variant="titleSm">{getFullName(doctor.firstName, doctor.lastName)}</Text>
                <Text variant="caption" muted>
                  {doctor.specialty}
                </Text>
              </View>
              <Icon name={forwardIconName} size={18} color="#94A3B8" />
            </Card>
          </Pressable>
        ))}
        {!doctorsQuery.isLoading && doctors.length === 0 ? (
          <Text variant="bodySm" muted>
            مفيش دكاترة في العيادة دي
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}
