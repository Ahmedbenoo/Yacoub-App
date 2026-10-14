import { Image, Pressable, ScrollView, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { useUserClinicsQuery } from '@/features/clinic/hooks/useClinicQueries';
import { getClinicName } from '@/features/clinic/lib/formatters';
import { clinicsService } from '@/features/clinic/services/clinics.service';
import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { queryKeys } from '@/shared/api/query-keys';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { pickProfileImage } from '@/shared/lib/pick-profile-image';
import { useAuthStore, useLocaleStore } from '@/shared/stores';

export function ClinicCoverCard() {
  const clinicId = useAuthStore((state) => state.activeClinicId);
  const locale = useLocaleStore((state) => state.locale);
  const { rowStyle } = useLayoutDirection();
  const queryClient = useQueryClient();
  const clinicsQuery = useUserClinicsQuery();
  const clinic = clinicsQuery.data?.find((item) => item.id === clinicId) ?? clinicsQuery.data?.[0];
  const photos = clinic?.photoUrls ?? [];
  const cover = photos[0];
  const gallery = photos.slice(1);
  const logo = clinic?.logoUrl;

  const refresh = () => queryClient.invalidateQueries({ queryKey: queryKeys.clinics.all });

  const changeCover = async () => {
    if (!clinic) return;
    const coverUrl = await pickProfileImage([16, 9]);
    if (!coverUrl) return;
    await clinicsService.updateListing(clinic.id, { coverUrl });
    refresh();
    Toast.show({ type: 'success', text1: 'غلاف العيادة اتسجل' });
  };

  const changeLogo = async () => {
    if (!clinic) return;
    const logoUrl = await pickProfileImage([3, 1]);
    if (!logoUrl) return;
    await clinicsService.setLogo(clinic.id, logoUrl);
    refresh();
    Toast.show({ type: 'success', text1: 'لوجو العيادة اتسجل' });
  };

  const replaceGalleryPhoto = async (galleryIndex: number) => {
    if (!clinic) return;
    const replacePhotoUrl = await pickProfileImage([16, 9]);
    if (!replacePhotoUrl) return;
    await clinicsService.updateListing(clinic.id, { replacePhotoIndex: galleryIndex + 1, replacePhotoUrl });
    refresh();
    Toast.show({ type: 'success', text1: 'صورة العيادة اتغيرت' });
  };

  const addPhoto = async () => {
    if (!clinic) return;
    const photoUrl = await pickProfileImage([16, 9]);
    if (!photoUrl) return;
    await clinicsService.updateListing(clinic.id, { photoUrl });
    refresh();
    Toast.show({ type: 'success', text1: 'صورة العيادة اتضافت' });
  };

  if (!clinic) return null;

  return (
    <Card className="gap-3 overflow-hidden p-0">
      <Pressable accessibilityRole="button" accessibilityLabel="غلاف العيادة" className="active:opacity-90" onPress={() => void changeCover()}>
        {cover ? (
          <Image source={{ uri: cover }} style={{ width: '100%', height: 168 }} accessibilityIgnoresInvertColors />
        ) : (
          <View className="h-40 items-center justify-center bg-primary-600">
            <Icon name="camera" size={28} color="#FFFFFF" />
          </View>
        )}
      </Pressable>
      <View className="gap-3 px-4 pb-4">
        <View className="gap-0.5">
          <Text variant="titleSm">غلاف العيادة</Text>
          <Text variant="caption" muted>
            {getClinicName(clinic, locale)} · اضغط على الصورة لتغيير الغلاف
          </Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="لوجو العيادة" className="active:opacity-80" onPress={() => void changeLogo()}>
          <View className="items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-700" style={rowStyle}>
            <View className="h-12 w-24 items-center justify-center overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-900">
              {logo ? (
                <Image
                  source={{ uri: logo }}
                  style={{ width: 88, height: 36 }}
                  resizeMode="contain"
                  accessibilityIgnoresInvertColors
                />
              ) : (
                <Icon name="clinic" size={20} color="#0D9488" />
              )}
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <Text variant="titleSm">لوجو العيادة</Text>
              <Text variant="caption" muted>
                اضغط لتغيير اللوجو
              </Text>
            </View>
          </View>
        </Pressable>
        <View className="gap-2">
          <Text variant="titleSm">صور العيادة</Text>
          <Text variant="caption" muted>
            اضغط على الصورة لتغييرها
          </Text>
          {gallery.length ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {gallery.map((photo, index) => (
                <Pressable
                  key={`${index}-${photo.slice(0, 24)}`}
                  accessibilityRole="button"
                  onPress={() => void replaceGalleryPhoto(index)}
                >
                  <Image
                    source={{ uri: photo }}
                    style={{ width: 160, height: 96, borderRadius: 12 }}
                    accessibilityIgnoresInvertColors
                  />
                </Pressable>
              ))}
            </ScrollView>
          ) : null}
          <Button title="إضافة صورة" variant="outline" fullWidth onPress={() => void addPhoto()} />
        </View>
      </View>
    </Card>
  );
}
