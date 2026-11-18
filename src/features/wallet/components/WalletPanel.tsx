import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Icon, type AppIconName } from '@/shared/components/ui/Icon';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import {
  WALLET_TRANSFER_NUMBER,
  mockWalletService,
  type WalletTopUpMethod,
} from '@/shared/api/mock/wallets.mock';
import { compressMedicalImage, pickMedicalImage } from '@/shared/lib/pick-medical-image';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';
import { themeBg } from '@/shared/lib/utils';
import { useAuthStore } from '@/shared/stores';

interface WalletPanelProps {
  mode: 'self' | 'admin';
}

const METHODS: { id: WalletTopUpMethod; label: string; icon: AppIconName }[] = [
  { id: 'instapay', label: 'إنستاباي', icon: 'instapay' },
  { id: 'wallet', label: 'محفظة', icon: 'wallet' },
];

function methodLabel(method: WalletTopUpMethod) {
  return METHODS.find((item) => item.id === method)?.label ?? method;
}

export function WalletPanel({ mode }: WalletPanelProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const isDark = useResolvedColorScheme() === 'dark';
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<WalletTopUpMethod>('instapay');
  const [senderNumber, setSenderNumber] = useState('');
  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const userId = user?.id ?? '';

  const balanceQuery = useQuery({
    queryKey: ['wallet', userId],
    queryFn: () => mockWalletService.getBalance(userId),
    enabled: mode === 'self' && Boolean(userId),
  });

  const requestsQuery = useQuery({
    queryKey: ['wallet-requests'],
    queryFn: () => mockWalletService.listRequests(),
    enabled: mode === 'admin',
  });

  const requestTopUp = useMutation({
    mutationFn: () =>
      mockWalletService.requestTopUp({
        userId,
        name: `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
        amount: Number(amount),
        method,
        senderNumber,
        receiptUri: receiptUri ?? undefined,
      }),
    onSuccess: () => {
      setAmount('');
      setReceiptUri(null);
      Toast.show({ type: 'success', text1: 'طلب الشحن اتبعت' });
    },
    onError: (error: { message?: string }) => {
      Toast.show({ type: 'error', text1: error?.message ?? 'المبلغ مش صحيح' });
    },
  });

  const credit = useMutation({
    mutationFn: (id: string) => mockWalletService.credit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-requests'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      Toast.show({ type: 'success', text1: 'الرصيد اتضاف' });
    },
  });

  const pickReceipt = async (source: 'camera' | 'library') => {
    setPicking(true);
    try {
      const uri = await pickMedicalImage(source);
      if (!uri) return;
      setReceiptUri(await compressMedicalImage(uri));
    } catch {
      Toast.show({ type: 'error', text1: 'مقدرناش نرفع الصورة' });
    } finally {
      setPicking(false);
    }
  };

  if (mode === 'admin') {
    const pending = requestsQuery.data ?? [];
    return (
      <Card className="mb-4 gap-3">
        <Text variant="titleSm">طلبات شحن المحفظه</Text>
        <Text variant="bodySm" muted>
          رقم التحويل {WALLET_TRANSFER_NUMBER}
        </Text>
        {pending.length === 0 ? <Text variant="bodySm">مفيش طلبات دلوقتى</Text> : null}
        {pending.map((request) => (
          <View key={request.id} className="gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
            <Text variant="bodySm">
              {request.name} — {request.amount} ج.م
            </Text>
            <Text variant="caption" muted>
              {methodLabel(request.method)} · من {request.senderNumber}
            </Text>
            {request.receiptUri ? (
              <Image
                source={{ uri: request.receiptUri }}
                className="h-36 w-full rounded-xl bg-slate-100"
                resizeMode="cover"
              />
            ) : null}
            <Button
              title="تم التحويل"
              onPress={() => credit.mutate(request.id)}
              loading={credit.isPending}
              fullWidth
            />
          </View>
        ))}
      </Card>
    );
  }

  const balance = balanceQuery.data ?? 0;

  return (
    <View className="gap-4">
      <View className="overflow-hidden rounded-3xl bg-primary-600 px-5 py-5">
        <View className="absolute -left-10 -bottom-12 h-36 w-36 rounded-full bg-white/10" />
        <View className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-white/10" />
        <View className="flex-row items-start justify-between">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
            <Icon name="wallet" size={24} color="#FFFFFF" />
          </View>
          <View className="items-end gap-1">
            <Text variant="label" className="text-white/80">
              رصيدك الحالي
            </Text>
            <Text variant="display" className="text-white">
              {balance.toLocaleString('en-US')} ج.م
            </Text>
          </View>
        </View>
      </View>

      <Card className="gap-3">
        <Text variant="titleSm">شحن المحفظة</Text>
        <Text variant="bodySm" muted>
          حوّل على الرقم ده، وبعدين ارفع صورة التحويل.
        </Text>
        <View
          className={`rounded-xl px-4 py-3 ${themeBg(isDark, 'bg-slate-50', 'bg-slate-800')}`}
        >
          <Text variant="caption" muted className="text-right">
            الرقم اللي هتحوّل عليه
          </Text>
          <Text variant="titleMd" className="text-right" style={{ writingDirection: 'ltr' }}>
            {`\u2066${WALLET_TRANSFER_NUMBER}\u2069`}
          </Text>
        </View>

        <Text variant="label" className="text-right">
          طريقة الشحن
        </Text>
        <View className="flex-row gap-2">
          {METHODS.map((option) => {
            const active = method === option.id;
            return (
              <Pressable
                key={option.id}
                onPress={() => setMethod(option.id)}
                className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-3 ${
                  active ? 'bg-primary-600' : themeBg(isDark, 'bg-slate-100', 'bg-slate-800')
                }`}
              >
                <Icon name={option.icon} size={18} color={active ? '#FFFFFF' : '#0D9488'} />
                <Text variant="label" className={active ? 'text-center text-white' : 'text-center'}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Input
          label="المبلغ"
          keyboardType="number-pad"
          value={amount}
          onChangeText={setAmount}
        />
        <Input
          label="الرقم اللي حولت منه"
          keyboardType="phone-pad"
          value={senderNumber}
          onChangeText={setSenderNumber}
          placeholder="01xxxxxx"
          style={{ writingDirection: 'ltr' }}
        />

        {receiptUri ? (
          <Image
            source={{ uri: receiptUri }}
            className="h-40 w-full rounded-2xl bg-slate-100"
            resizeMode="cover"
          />
        ) : (
          <Text variant="caption" muted className="text-right">
            ارفع صورة التحويل
          </Text>
        )}
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button title="كاميرا" variant="outline" onPress={() => void pickReceipt('camera')} />
          </View>
          <View className="flex-1">
            <Button title="المعرض" variant="outline" onPress={() => void pickReceipt('library')} />
          </View>
        </View>

        <Button
          title="اطلب شحن"
          onPress={() => requestTopUp.mutate()}
          loading={requestTopUp.isPending || picking}
          disabled={!amount || !senderNumber || !receiptUri}
          fullWidth
        />
      </Card>
    </View>
  );
}
