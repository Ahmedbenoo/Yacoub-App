import { sleep } from '@/shared/lib/utils';

export const WALLET_TRANSFER_NUMBER = '01001234567';

interface WalletAccount {
  userId: string;
  balance: number;
}

interface TopUpRequest {
  id: string;
  userId: string;
  name: string;
  amount: number;
  status: 'pending' | 'credited';
  createdAt: string;
}

const accounts: WalletAccount[] = [];
const requests: TopUpRequest[] = [];

function accountFor(userId: string): WalletAccount {
  const existing = accounts.find((item) => item.userId === userId);
  if (existing) return existing;
  const created = { userId, balance: 0 };
  accounts.push(created);
  return created;
}

export const mockWalletService = {
  async getBalance(userId: string): Promise<number> {
    await sleep(200);
    return accountFor(userId).balance;
  },

  async requestTopUp(userId: string, name: string, amount: number): Promise<TopUpRequest> {
    await sleep(300);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw { code: 'INVALID_AMOUNT', message: 'المبلغ لازم يكون اكبر من صفر' };
    }
    const request: TopUpRequest = {
      id: `topup-${Date.now()}`,
      userId,
      name,
      amount,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    requests.unshift(request);
    return request;
  },

  async listRequests(): Promise<TopUpRequest[]> {
    await sleep(200);
    return requests.filter((item) => item.status === 'pending');
  },

  async credit(id: string): Promise<TopUpRequest> {
    await sleep(300);
    const request = requests.find((item) => item.id === id);
    if (!request || request.status !== 'pending') {
      throw { code: 'NOT_FOUND', message: 'طلب الشحن مش موجود' };
    }
    request.status = 'credited';
    accountFor(request.userId).balance += request.amount;
    return request;
  },
};
