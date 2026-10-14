import { useQuery } from '@tanstack/react-query';

import { whatsAppService } from '@/features/whatsapp/services/whatsapp.service';
import { queryKeys } from '@/shared/api/query-keys';

export function useAppointmentWhatsAppQuery(appointmentId: string) {
  return useQuery({
    queryKey: queryKeys.whatsapp.forAppointment(appointmentId),
    queryFn: () => whatsAppService.listForAppointment(appointmentId),
    enabled: Boolean(appointmentId),
  });
}
