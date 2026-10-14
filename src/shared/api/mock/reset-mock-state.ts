import { resetMockAppointments } from './appointments.mock';
import { resetMockAuthState } from './auth.mock';
import { resetMockAvailability } from './doctor.mock';
import { resetMockDoctors } from './doctors.mock';
import { resetMockHistory } from './history.mock';
import { resetMockLabRequests } from './lab-requests.mock';
import { resetMockNewborns } from './newborn.mock';
import { resetMockNotifications } from './notifications.mock';
import { resetMockObgyn } from './obgyn.mock';
import { resetMockPatients } from './patients.mock';
import { resetMockPrescriptions } from './prescriptions.mock';
import { resetMockVisits } from './visits.mock';

export function resetMockState(): void {
  resetMockAuthState();
  resetMockPatients();
  resetMockDoctors();
  resetMockAppointments();
  resetMockVisits();
  resetMockPrescriptions();
  resetMockLabRequests();
  resetMockObgyn();
  resetMockNewborns();
  resetMockHistory();
  resetMockNotifications();
  resetMockAvailability();
}
