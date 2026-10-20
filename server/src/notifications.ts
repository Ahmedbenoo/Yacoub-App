import { randomUUID } from 'node:crypto';

import { db } from './db.js';

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  message_key: string | null;
  data: string;
  read_at: string | Date | null;
  created_at: string | Date;
};

function formatWhen(value: string | Date): string {
  return new Intl.DateTimeFormat('ar-EG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: 'numeric',
    minute: '2-digit',
  }).format(value instanceof Date ? value : new Date(value));
}

function iso(value: string | Date): string {
  return (value instanceof Date ? value : new Date(value)).toISOString();
}

function toPublic(row: NotificationRow) {
  let data: Record<string, string> | undefined;
  try {
    const parsed = JSON.parse(row.data) as Record<string, string>;
    data = parsed && typeof parsed === 'object' ? parsed : undefined;
  } catch {
    data = undefined;
  }
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    body: row.body,
    messageKey: row.message_key ?? undefined,
    data,
    readAt: row.read_at ? iso(row.read_at) : undefined,
    createdAt: iso(row.created_at),
  };
}

export async function pushNotification(input: {
  userId: string;
  type: string;
  messageKey: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<void> {
  await db.query(
    `INSERT INTO notifications (id, user_id, type, title, body, message_key, data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      `notif-${randomUUID()}`,
      input.userId,
      input.type,
      input.title,
      input.body,
      input.messageKey,
      JSON.stringify(input.data ?? {}),
    ],
  );
  await sendExpoPush(input.userId, input.title, input.body, { ...(input.data ?? {}), type: input.type });
}

export async function notifySavedAppointment(actorUserId: string, appointmentId: string, messageKey: string, title: string, body: string) {
  const result = await db.query<{
    clinic_id: string;
    scheduled_at: string | Date;
    patient_user_id: string | null;
    doctor_user_id: string | null;
    patient_first: string;
    patient_last: string;
    doctor_first: string;
    doctor_last: string;
  }>(
    `SELECT a.clinic_id, a.scheduled_at, p.user_id AS patient_user_id, d.user_id AS doctor_user_id,
            p.first_name AS patient_first, p.last_name AS patient_last,
            d.first_name AS doctor_first, d.last_name AS doctor_last
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN doctors d ON d.id = a.doctor_id
     WHERE a.id = $1`,
    [appointmentId],
  );
  const row = result.rows[0];
  if (!row) return;
  const when = formatWhen(row.scheduled_at);
  await notifyAppointment({
    actorUserId,
    patientUserId: row.patient_user_id,
    doctorUserId: row.doctor_user_id,
    clinicId: row.clinic_id,
    messageKey,
    title,
    body,
    data: {
      appointmentId,
      time: when,
      patientName: `${row.patient_first} ${row.patient_last}`.trim(),
      doctorName: `${row.doctor_first} ${row.doctor_last}`.trim(),
    },
  });
}

async function notifyAppointment(input: {
  actorUserId: string;
  patientUserId?: string | null;
  doctorUserId?: string | null;
  clinicId: string;
  messageKey: string;
  title: string;
  body: string;
  data: Record<string, string>;
}): Promise<void> {
  const staff = await db.query<{ user_id: string }>(
    `SELECT user_id FROM memberships WHERE clinic_id = $1 AND role IN ('admin', 'secretary')`,
    [input.clinicId],
  );
  const ids = new Set<string>();
  if (input.patientUserId) ids.add(input.patientUserId);
  if (input.doctorUserId) ids.add(input.doctorUserId);
  for (const row of staff.rows) ids.add(row.user_id);
  ids.delete(input.actorUserId);
  for (const userId of ids) {
    await pushNotification({
      userId,
      type: 'appointment',
      messageKey: input.messageKey,
      title: input.title,
      body: input.body,
      data: input.data,
    });
  }
}

export async function listNotifications(userId: string) {
  const result = await db.query<NotificationRow>(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [userId],
  );
  const data = result.rows.map(toPublic);
  return { data, meta: { page: 1, limit: 50, total: data.length, totalPages: 1 } };
}

export async function markNotificationRead(userId: string, id: string) {
  const result = await db.query<NotificationRow>(
    `UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId],
  );
  const row = result.rows[0];
  if (!row) {
    const error = Object.assign(new Error('Notification not found'), { status: 404, code: 'NOT_FOUND' });
    throw error;
  }
  return toPublic(row);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  await db.query(`UPDATE notifications SET read_at = COALESCE(read_at, now()) WHERE user_id = $1`, [userId]);
}

export async function registerDeviceToken(userId: string, token: string, platform: string): Promise<void> {
  const existing = await db.query<{ id: string }>('SELECT id FROM device_tokens WHERE token = $1', [token]);
  if (existing.rows[0]) {
    await db.query('UPDATE device_tokens SET user_id = $2, platform = $3 WHERE token = $1', [token, userId, platform]);
    return;
  }
  await db.query('INSERT INTO device_tokens (id, user_id, token, platform) VALUES ($1, $2, $3, $4)', [
    `device-${randomUUID()}`,
    userId,
    token,
    platform,
  ]);
}

async function sendExpoPush(userId: string, title: string, body: string, data: Record<string, string>): Promise<void> {
  const tokens = await db.query<{ token: string }>('SELECT token FROM device_tokens WHERE user_id = $1', [userId]);
  if (!tokens.rows.length) return;
  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(
      tokens.rows.map((row) => ({
        to: row.token,
        title,
        body,
        sound: 'default',
        data,
      })),
    ),
  }).catch(() => undefined);
}
