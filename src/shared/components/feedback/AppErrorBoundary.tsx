import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Appearance, View } from 'react-native';

import { captureException } from '@/shared/lib/monitoring';
import { Button } from '@/shared/components/ui/Button';
import { Text } from '@/shared/components/ui/Text';

interface AppErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle: string;
  fallbackDescription: string;
  retryLabel: string;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    captureException(error, { componentStack: info.componentStack });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View
          className="flex-1 items-center justify-center px-8"
          style={{ backgroundColor: Appearance.getColorScheme() === 'dark' ? '#0F172A' : '#F8FAFC' }}
        >
          <Text variant="titleMd" className="mb-2 text-center">
            {this.props.fallbackTitle}
          </Text>
          <Text variant="bodySm" muted className="mb-6 text-center">
            {this.props.fallbackDescription}
          </Text>
          <Button title={this.props.retryLabel} onPress={this.handleRetry} />
        </View>
      );
    }

    return this.props.children;
  }
}
