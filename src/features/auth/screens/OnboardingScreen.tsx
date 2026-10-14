import { useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, View, type ViewToken } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';
import { Logo } from '@/shared/components/brand/Logo';
import { Screen } from '@/shared/components/layout/Screen';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import { useAppStore } from '@/shared/stores';

const { width } = Dimensions.get('window');

const SLIDES = [
  { key: '1', titleKey: 'onboarding.slide1Title', descKey: 'onboarding.slide1Description' },
  { key: '2', titleKey: 'onboarding.slide2Title', descKey: 'onboarding.slide2Description' },
  { key: '3', titleKey: 'onboarding.slide3Title', descKey: 'onboarding.slide3Description' },
] as const;

export function OnboardingScreen() {
  const { t } = useTranslation('auth');
  const { t: tc } = useTranslation('common');
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);
  const isDark = useResolvedColorScheme() === 'dark';
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleFinish = () => {
    setOnboardingCompleted(true);
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (activeIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: activeIndex + 1, animated: true });
    } else {
      handleFinish();
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <Screen padded={false} className={themeBg(isDark, 'bg-white', 'bg-slate-900')}>
      <View className="flex-row items-center justify-end px-5 pt-10">
        <Pressable onPress={handleFinish} className="px-3 py-2">
          <Text variant="label" className="text-primary-600 dark:text-primary-400">
            {tc('skip')}
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 items-center justify-center px-8">
            <Logo size="xl" className="mb-8" />
            <Text variant="titleLg" className="mb-3 text-center">
              {t(item.titleKey)}
            </Text>
            <Text variant="body" muted className="text-center">
              {t(item.descKey)}
            </Text>
          </View>
        )}
      />

      <View className="gap-4 px-5 pb-10">
        <View className="flex-row items-center justify-center gap-2">
          {SLIDES.map((slide, index) => (
            <View
              key={slide.key}
              className={`h-2 rounded-full ${
                index === activeIndex ? 'w-6 bg-primary-600' : `w-2 ${themeBg(isDark, 'bg-slate-300', 'bg-slate-600')}`
              }`}
            />
          ))}
        </View>
        <Button
          title={activeIndex === SLIDES.length - 1 ? t('onboarding.getStarted') : tc('next')}
          onPress={handleNext}
          fullWidth
          size="lg"
        />
      </View>
    </Screen>
  );
}
