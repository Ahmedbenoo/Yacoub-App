import { useTranslation } from 'react-i18next';
import type { Control } from 'react-hook-form';

import { FormInput } from '@/shared/components/form/FormInput';
import { FormSelect } from '@/shared/components/form/FormSelect';
import type { UpdateHealthProfilePayload } from '@/shared/types/models/patient';

export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type HealthProfileFormValues = {
  bloodType: string;
  allergies: string;
  chronicConditions: string;
};

export const emptyHealthProfileForm: HealthProfileFormValues = {
  bloodType: '',
  allergies: '',
  chronicConditions: '',
};

export function healthProfileToForm(profile?: {
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
}): HealthProfileFormValues {
  return {
    bloodType: profile?.bloodType ?? '',
    allergies: (profile?.allergies ?? []).join('، '),
    chronicConditions: (profile?.chronicConditions ?? []).join('، '),
  };
}

export function healthProfileFromForm(values: HealthProfileFormValues): UpdateHealthProfilePayload {
  return {
    bloodType: values.bloodType.trim(),
    allergies: parseMedicalList(values.allergies),
    chronicConditions: parseMedicalList(values.chronicConditions),
  };
}

function parseMedicalList(value: string): string[] {
  return value
    .split(/[،,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function HealthProfileFields({
  control,
  editable = true,
}: {
  control: Control<HealthProfileFormValues>;
  editable?: boolean;
}) {
  const { t } = useTranslation('patient');

  return (
    <>
      <FormSelect
        control={control}
        name="bloodType"
        label={t('profile.bloodType')}
        placeholder={t('profile.bloodTypeUnset')}
        options={[
          { value: '', label: t('profile.bloodTypeUnset') },
          ...BLOOD_TYPES.map((type) => ({ value: type, label: type })),
        ]}
      />
      <FormInput
        control={control}
        name="allergies"
        label={t('profile.allergies')}
        placeholder={t('profile.listHint')}
        helper={t('profile.listHint')}
        editable={editable}
      />
      <FormInput
        control={control}
        name="chronicConditions"
        label={t('profile.conditions')}
        placeholder={t('profile.listHint')}
        helper={t('profile.listHint')}
        editable={editable}
      />
    </>
  );
}
