import { useState } from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';

import { Icon } from '@/shared/components/ui/Icon';
import { Text } from '@/shared/components/ui/Text';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { cn, themeBg } from '@/shared/lib/utils';

interface TimePickerFieldProps {
  label: string;
  hourLabel: string;
  minuteLabel: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const HOURS = Array.from({ length: 24 }, (_, index) => pad(index));
const MINUTES = Array.from({ length: 60 }, (_, index) => pad(index));

function parseTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  return {
    hour: match ? Number(match[1]) : 9,
    minute: match ? Number(match[2]) : 0,
  };
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function wrap(value: number, max: number) {
  return (value + max) % max;
}

function Stepper({
  label,
  display,
  onUp,
  onDown,
  onOpenSelect,
}: {
  label: string;
  display: string;
  onUp: () => void;
  onDown: () => void;
  onOpenSelect: () => void;
}) {
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <View className="min-w-0 flex-1 items-center gap-1">
      <Text variant="caption" muted className="text-center">
        {label}
      </Text>
      <View
        className={cn(
          'w-full items-center rounded-xl border py-1',
          themeBg(isDark, 'border-slate-200 bg-white', 'border-slate-700 bg-slate-800'),
        )}
      >
        <Pressable
          accessibilityRole="button"
          onPress={onUp}
          className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon name="chevronUp" size={18} color="#0D9488" />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onOpenSelect}
          className="min-w-[56px] items-center rounded-lg px-4 py-1 active:opacity-70"
        >
          <Text variant="titleMd" className="text-center">
            {display}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={onDown}
          className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon name="chevronDown" size={18} color="#0D9488" />
        </Pressable>
      </View>
    </View>
  );
}

function ValueSelect({
  title,
  visible,
  options,
  value,
  onChange,
  onClose,
}: {
  title: string;
  visible: boolean;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}) {
  const isDark = useResolvedColorScheme() === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable
          className={cn('max-h-[70%] rounded-t-3xl px-5 pb-8 pt-4', isDark ? 'bg-slate-900' : 'bg-white')}
          onPress={(event) => event.stopPropagation()}
        >
          <Text variant="titleSm" className="mb-4 text-center">
            {title}
          </Text>
          <ScrollView className="max-h-80" keyboardShouldPersistTaps="handled">
            {options.map((option) => {
              const isSelected = option === value;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    onChange(option);
                    onClose();
                  }}
                  className={cn(
                    'rounded-xl px-4 py-3',
                    isSelected && (isDark ? 'bg-primary-900/40' : 'bg-primary-50'),
                  )}
                >
                  <Text
                    variant="body"
                    className={cn('text-center', isSelected && 'text-primary-700 dark:text-primary-300')}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export function TimePickerField({
  label,
  hourLabel,
  minuteLabel,
  value,
  onChange,
  error,
}: TimePickerFieldProps) {
  const [openPicker, setOpenPicker] = useState<'hour' | 'minute' | null>(null);
  const { hour, minute } = parseTime(value);

  const commit = (nextHour: number, nextMinute: number) => {
    onChange(`${pad(wrap(nextHour, 24))}:${pad(wrap(nextMinute, 60))}`);
  };

  return (
    <View className="gap-2">
      <Text variant="label" className="text-right">
        {label}
      </Text>
      <View
        style={{
          flexDirection: 'row',
          direction: 'ltr',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Stepper
          label={hourLabel}
          display={pad(hour)}
          onUp={() => commit(hour + 1, minute)}
          onDown={() => commit(hour - 1, minute)}
          onOpenSelect={() => setOpenPicker('hour')}
        />
        <Text variant="titleMd" className="text-primary-600">
          :
        </Text>
        <Stepper
          label={minuteLabel}
          display={pad(minute)}
          onUp={() => commit(hour, minute + 5)}
          onDown={() => commit(hour, minute - 5)}
          onOpenSelect={() => setOpenPicker('minute')}
        />
      </View>
      {error ? (
        <Text variant="caption" className="text-status-error">
          {error}
        </Text>
      ) : null}
      <ValueSelect
        title={hourLabel}
        visible={openPicker === 'hour'}
        options={HOURS}
        value={pad(hour)}
        onChange={(next) => commit(Number(next), minute)}
        onClose={() => setOpenPicker(null)}
      />
      <ValueSelect
        title={minuteLabel}
        visible={openPicker === 'minute'}
        options={MINUTES}
        value={pad(minute)}
        onChange={(next) => commit(hour, Number(next))}
        onClose={() => setOpenPicker(null)}
      />
    </View>
  );
}
