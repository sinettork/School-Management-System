"use client";

import { useState } from "react";
import { EnhancedForm, FormSection } from "@/components/ui/enhanced-form";
import { EnhancedDatePicker } from "@/components/ui/form-input";

interface SimpleDateFormProps {
  title?: string;
  description?: string;
  submitLabel?: string;
  onSubmit?: (date: string) => void;
  onCancel?: () => void;
  defaultDate?: string;
}

export function SimpleDateForm({
  title = "Select Date",
  description,
  submitLabel = "Confirm",
  onSubmit,
  onCancel,
  defaultDate,
}: SimpleDateFormProps) {
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit?.(date);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <EnhancedForm
      title={title}
      description={description}
      onSubmit={handleSubmit}
      isLoading={isSubmitting}
      submitText={submitLabel}
      onCancel={onCancel}
      submitDisabled={!date}
    >
      <FormSection>
        <EnhancedDatePicker
          label="Date"
          description="Select the date for this action"
          value={date}
          onChange={setDate}
          placeholder="Pick a date"
          required
        />
      </FormSection>
    </EnhancedForm>
  );
}
