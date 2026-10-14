import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Select, type SelectOption } from '@/shared/components/form/Select';

interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  searchable?: boolean;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  options,
  searchable,
}: FormSelectProps<T>) {
  const { t } = useTranslation('validation');

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value }, fieldState: { error } }) => (
        <Select
          label={label}
          value={value}
          onChange={onChange}
          options={options}
          placeholder={placeholder}
          searchable={searchable}
          error={error?.message ? t(error.message) : undefined}
        />
      )}
    />
  );
}
