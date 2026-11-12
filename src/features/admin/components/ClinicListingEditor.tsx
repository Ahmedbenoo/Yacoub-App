import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, View } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { OpeningHoursCalendar } from '@/features/admin/components/OpeningHoursCalendar';
import { useSpecialtyOptions } from '@/features/admin/hooks';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { Select } from '@/shared/components/form/Select';
import { pickProfileImage } from '@/shared/lib/pick-profile-image';
import { queryKeys } from '@/shared/api/query-keys';
import { useAuthStore } from '@/shared/stores';

export function ClinicListingEditor() {
  const clinicId = useAuthStore((state) => state.activeClinicId);
  const queryClient = useQueryClient();
  const clinicsQuery = useUserClinicsQuery();
  const specialtyOptions = useSpecialtyOptions();
  const clinic = clinicsQuery.data?.find((item) => item.id === clinicId) ?? clinicsQuery.data?.[0];
  const [hours, setHours] = useState('');
  const [fee, setFee] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [specialty, setSpecialty] = useState('');

  useEffect(() => {
    if (!clinic) return;
    setHours(clinic.openingHours?.trim() ?? '');
    setFee(clinic.consultationFee ? String(clinic.consultationFee) : '');
    setLocationUrl(clinic.locationUrl ?? '');
    setStreet(clinic.address.street?.trim() ?? '');
    setCity(clinic.address.city?.trim() ?? '');
    setSpecialty(clinic.specialty?.trim() ?? '');
  }, [
    clinic?.id,
    clinic?.openingHours,
    clinic?.consultationFee,
    clinic?.locationUrl,
    clinic?.address.street,
    clinic?.address.city,
    clinic?.specialty,
  ]);

  const save = useMutation({
    mutationFn: () =>
      clinicsService.updateListing(clinic?.id ?? '', {
        openingHours: hours.trim(),
        consultationFee: /^\d+$/.test(fee) ? Number(fee) : null,
        locationUrl,
        street: street.trim(),
        city: city.trim(),
        specialty: specialty.trim(),
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
        العنوان والتخصص والمواعيد والسعر والصور والخريطة اللي المريض يشوفها قبل الحجز.
      </Text>
      <Select
        label="التخصص"
        value={specialty}
        onChange={setSpecialty}
        options={specialtyOptions}
        placeholder="اختار التخصص"
        searchable
      />
      <Input label="المدينة" value={city} onChangeText={setCity} />
      <Input label="العنوان" value={street} onChangeText={setStreet} />
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
        onPress={() => save.mutate()}
      />
    </Card>
  );
}
