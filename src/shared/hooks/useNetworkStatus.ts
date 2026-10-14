import { useEffect, useState } from 'react';
import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean | null>(true);

  useEffect(() => {
    const applyState = (state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable);
    };

    const unsubscribe = NetInfo.addEventListener(applyState);
    NetInfo.fetch().then(applyState);

    return unsubscribe;
  }, []);

  const isOffline = !isConnected || isInternetReachable === false;

  return { isConnected, isInternetReachable, isOffline };
}
