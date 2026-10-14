import { ClinicListingEditor } from '@/features/admin/components/ClinicListingEditor';
import { Header } from '@/shared/components/layout/Header';
import { Screen } from '@/shared/components/layout/Screen';

export function AdminClinicPageScreen() {
  return (
    <Screen scroll>
      <Header showBack title="صفحة العيادة" />
      <ClinicListingEditor />
    </Screen>
  );
}
