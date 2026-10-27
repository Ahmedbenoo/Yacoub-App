import { useEffect, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useIsRestoring } from '@tanstack/react-query';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colorScheme as nativewindColorScheme } from 'nativewind';
import { I18nextProvider } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { validateSession } from '@/features/auth/lib/session';
import { warmHomeCatalog } from '@/features/catalog/lib/warm-home-catalog';
import { AppSplash } from '@/shared/components/brand/AppSplash';
import { OfflineBanner } from '@/shared/components/feedback/OfflineBanner';
import { usePushNotificationsSetup } from '@/shared/hooks/usePushNotificationsSetup';
import { i18n } from '@/shared/i18n';
import { queryClient } from '@/shared/lib/query-client';
import { asyncStoragePersister } from '@/shared/lib/query-persister';
import { setSessionExpiredHandler } from '@/shared/lib/auth-events';
import { initMonitoring } from '@/shared/lib/monitoring';
import { ErrorBoundaryProvider } from '@/shared/providers/ErrorBoundaryProvider';
import { useAuthStore, useLocaleStore, useThemeStore } from '@/shared/stores';
import { useResolvedColorScheme } from '@/shared/hooks/useTheme';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24,
          dehydrateOptions: {
            shouldDehydrateQuery: (query) => query.state.status === 'success',
          },
        }}
      >
        <AppBootstrap>{children}</AppBootstrap>
      </PersistQueryClientProvider>
    </I18nextProvider>
  );
}

function AppBootstrap({ children }: { children: ReactNode }) {
  const colorScheme = useResolvedColorScheme();
  const hydrateAuth = useAuthStore((s) => s.hydrate);
  const hydrateLocale = useLocaleStore((s) => s.hydrate);
  const isRtl = useLocaleStore((s) => s.isRtl);
  const isRestoring = useIsRestoring();
  const [ready, setReady] = useState(false);

  usePushNotificationsSetup();

  useEffect(() => {
    nativewindColorScheme.set(colorScheme);
  }, [colorScheme]);

  useEffect(() => {
    initMonitoring();
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => {
      router.replace('/(auth)/login');
    });

    return () => setSessionExpiredHandler(null);
  }, []);

  useEffect(() => {
    if (isRestoring) return;

    async function bootstrap() {
      try {
        await useLocaleStore.persist.rehydrate();
        await useThemeStore.persist.rehydrate();
        await Promise.all([hydrateAuth(), hydrateLocale()]);

        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          await validateSession();
        }

        await warmHomeCatalog();
      } catch (error) {
        console.warn('App bootstrap failed', error);
      } finally {
        setReady(true);
      }
    }

    void bootstrap();
  }, [hydrateAuth, hydrateLocale, isRestoring]);

  if (isRestoring || !ready) {
    return <AppSplash />;
  }

  return (
    <SafeAreaProvider>
      <ErrorBoundaryProvider>
        <View
          className={`flex-1 ${colorScheme === 'dark' ? 'dark' : ''}`}
          style={
            Platform.OS === 'web'
              ? { direction: isRtl ? 'rtl' : 'ltr', height: '100%', overflow: 'hidden' }
              : {
                  flex: 1,
                  direction: isRtl ? 'rtl' : 'ltr',
                  backgroundColor: colorScheme === 'dark' ? '#0F172A' : '#F8FAFC',
                }
          }
        >
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <OfflineBanner />
          {children}
          <Toast />
        </View>
      </ErrorBoundaryProvider>
    </SafeAreaProvider>
  );
}
