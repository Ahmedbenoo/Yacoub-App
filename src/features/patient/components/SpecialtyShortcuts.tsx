import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatSpecialty } from '@/features/patient/lib/formatters';
import { SpecialtyGlyph } from '@/features/patient/lib/specialty-icons';
import { Text } from '@/shared/components/ui/Text';
import { useLayoutDirection } from '@/shared/hooks/useLayoutDirection';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';

const SPECIALTY_TAB_GAP = 10;

interface SpecialtyShortcutsProps {
  specialties: string[];
  selected?: string;
  onSelect: (specialty?: string) => void;
}

export function SpecialtyShortcuts({ specialties, selected, onSelect }: SpecialtyShortcutsProps) {
  const { t } = useTranslation('patient');
  const { rowStyle, isRtl } = useLayoutDirection();
  const isDark = useResolvedColorScheme() === 'dark';
  const scrollRef = useRef<ScrollView>(null);
  const [viewportWidth, setViewportWidth] = useState(0);

  useEffect(() => {
    if (!isRtl || viewportWidth <= 0) return;
    scrollRef.current?.scrollToEnd({ animated: false });
  }, [isRtl, viewportWidth, specialties.length]);

  if (specialties.length === 0) return null;

  return (
    <View className="mb-4 gap-2">
      <Text variant="body" className="font-semibold">
        {t('guest.specialtiesTitle')}
      </Text>
      <ScrollView
        ref={scrollRef}
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        onLayout={(event) => setViewportWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(contentWidth) => {
          if (!isRtl) return;
          scrollRef.current?.scrollTo({
            x: Math.max(0, contentWidth - viewportWidth),
            animated: false,
          });
        }}
        contentContainerStyle={{
          flexDirection: isRtl ? 'row-reverse' : 'row',
          alignItems: 'center',
          gap: SPECIALTY_TAB_GAP,
        }}
      >
        {specialties.map((specialty) => {
          const isSelected = selected === specialty;
          return (
            <Pressable
              key={specialty}
              accessibilityRole="button"
              onPress={() => onSelect(isSelected ? undefined : specialty)}
              style={[rowStyle, { flexShrink: 0, paddingHorizontal: 14, paddingVertical: 12 }]}
              className={`shrink-0 items-center justify-center gap-1.5 rounded-full active:opacity-80 ${
                isSelected ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800')
              }`}
            >
              <SpecialtyGlyph specialty={specialty} color={isSelected ? '#FFFFFF' : isDark ? '#5EEAD4' : '#0D9488'} />
              <Text variant="label" className={isSelected ? 'text-white' : undefined}>
                {formatSpecialty(specialty, t)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
