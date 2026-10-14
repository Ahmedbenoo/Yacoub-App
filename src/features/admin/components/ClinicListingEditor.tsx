import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { OpeningHoursCalendar } from '@/features/admin/components/OpeningHoursCalendar';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { pickProfileImage } from '@/shared/lib/pick-profile-image';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function ClinicListingEditor() {
  const clinicId = useAuthStore((state) => state.activeClinicId);
  const queryClient = useQueryClient();
  const clinicsQuery = useUserClinicsQuery();
  const clinic = clinicsQuery.data?.find((item) => item.id === clinicId) ?? clinicsQuery.data?.[0];
  const [hours, setHours] = useState('');
  const [fee, setFee] = useState('');
  const [locationUrl, setLocationUrl] = useState('');

  useEffect(() => {
    if (!clinic) return;
    setHours(clinic.openingHours ?? '');
    setFee(clinic.consultationFee != null ? String(clinic.consultationFee) : '');
    setLocationUrl(clinic.locationUrl ?? '');
  }, [clinic?.id, clinic?.openingHours, clinic?.consultationFee, clinic?.locationUrl]);

  const save = useMutation({
    mutationFn: () =>
      clinicsService.updateListing(clinic?.id ?? '', {
        openingHours: hours,
        consultationFee: Number(fee),
        locationUrl,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });
      Toast.show({ type: 'success', text1: 'بيانات العيادة اتسجلت' });
    },
  });

  const addPhoto = async () => {
    if (!clinic) return;
    const photoUrl = await pickProfileImage([16, 9]);
    if (!photoUrl) return;
    await clinicsService.updateListing(clinic.id, { photoUrl });
    queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });
    Toast.show({ type: 'success', text1: 'الصورة اتضافت' });
  };

  const replacePhoto = async (index: number) => {
    if (!clinic) return;
    const replacePhotoUrl = await pickProfileImage([16, 9]);
    if (!replacePhotoUrl) return;
    await clinicsService.updateListing(clinic.id, { replacePhotoIndex: index, replacePhotoUrl });
    queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });
    Toast.show({ type: 'success', text1: 'الصورة اتغيرت' });
  };

  if (!clinic) return null;

  return (
    <Card className="gap-3">
      <Text variant="titleSm">صفحة العيادة</Text>
      <Text variant="caption" muted>
        المواعيد والسعر والصور والخريطة اللي المريض يشوفها قبل الحجز.
      </Text>
      <OpeningHoursCalendar value={hours} onChange={setHours} />
      <Input label="سعر الكشف" value={fee} onChangeText={setFee} keyboardType="number-pad" />
      <Input label="لينك الخريطة" value={locationUrl} onChangeText={setLocationUrl} autoCapitalize="none" />
      <Text variant="caption" muted>
        اضغط على الصورة عشان تغيّرها
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {(clinic.photoUrls ?? []).map((photo, index) => (
          <Pressable key={`${index}-${photo.slice(0, 24)}`} accessibilityRole="button" onPress={() => void replacePhoto(index)}>
            <View>
              <Image source={{ uri: photo }} style={{ width: 160, height: 96, borderRadius: 12 }} accessibilityIgnoresInvertColors />
            </View>
          </Pressable>
        ))}
      </ScrollView>
      <Button title="إضافة صورة" variant="outline" fullWidth onPress={() => void addPhoto()} />
      <Button
        title="حفظ بيانات الصفحة"
        fullWidth
        loading={save.isPending}
        disabled={!hours.trim() || !/^\d+$/.test(fee)}
        onPress={() => save.mutate()}
      />
    </Card>
  );
}
