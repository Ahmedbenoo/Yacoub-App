import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { View } from 'react-native';

import { Button } from '@/shared/components/ui/Button';
import { Card } from '@/shared/components/ui/Card';
import { Input } from '@/shared/components/ui/Input';
import { Text } from '@/shared/components/ui/Text';
import { WALLET_TRANSFER_NUMBER, mockWalletService } from '@/shared/api/mock/wallets.mock';
import { useAuthStore } from '@/shared/stores';

interface WalletPanelProps {
  mode: 'self' | 'admin';
}

export function WalletPanel({ mode }: WalletPanelProps) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
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
      mockWalletService.requestTopUp(
        userId,
        `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim(),
        Number(amount),
      ),
    onSuccess: () => {
      setAmount('');
      Toast.show({ type: 'success', text1: 'طلب الشحن اتبعت' });
    },
    onError: () => {
      Toast.show({ type: 'error', text1: 'المبلغ مش صحيح' });
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
          <View key={request.id} className="gap-2">
            <Text variant="bodySm">
              {request.name} — {request.amount} ج.م
            </Text>
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

  return (
    <Card className="mb-4 gap-3">
      <Text variant="titleSm">المحفظه</Text>
      <Text variant="body">{balanceQuery.data ?? 0} ج.م</Text>
      <Text variant="bodySm" muted>
        الشحن يدوى. اطلب المبلغ، وبعد التحويل على {WALLET_TRANSFER_NUMBER} الإدارة هتضيف الرصيد.
      </Text>
      <Input
        label="المبلغ"
        keyboardType="number-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Button
        title="اطلب شحن"
        onPress={() => requestTopUp.mutate()}
        loading={requestTopUp.isPending}
        disabled={!amount}
        fullWidth
      />
    </Card>
  );
}
