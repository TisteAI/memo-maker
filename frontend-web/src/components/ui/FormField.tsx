import * as React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Label } from './Label';
import { Input, type InputProps } from './Input';

export interface FormFieldProps extends InputProps {
  name: string;
  label: string;
  required?: boolean;
  description?: string;
}

export function FormField({
  name,
  label,
  required,
  description,
  ...inputProps
}: FormFieldProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className="space-y-2">
          <Label htmlFor={name} required={required}>
            {label}
          </Label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
          <Input
            id={name}
            error={error}
            {...field}
            {...inputProps}
          />
        </div>
      )}
    />
  );
}
