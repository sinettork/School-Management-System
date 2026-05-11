import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DatePicker } from "@/components/ui/date-picker"
import { FormMessage } from "@/components/ui/form"
import { HelpCircle, Asterisk } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface FormFieldWrapperProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
  tooltip?: string
}

export function FormFieldWrapper({
  label,
  description,
  error,
  required = false,
  children,
  className,
  tooltip,
}: FormFieldWrapperProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-center gap-2">
          <Label className={cn("text-sm font-medium", error && "text-destructive")}>
            {label}
            {required && <Asterisk className="inline h-3 w-3 text-destructive ml-1" />}
          </Label>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs text-destructive flex items-center gap-1">
          {error}
        </p>
      )}
    </div>
  )
}

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  tooltip?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export function EnhancedInput({
  label,
  description,
  error,
  required = false,
  tooltip,
  leftIcon,
  rightIcon,
  className,
  ...props
}: EnhancedInputProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      tooltip={tooltip}
    >
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <Input
          className={cn(
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-destructive focus:border-destructive",
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  )
}

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  tooltip?: string
  showCharCount?: boolean
  maxLength?: number
}

export function EnhancedTextarea({
  label,
  description,
  error,
  required = false,
  tooltip,
  showCharCount = false,
  maxLength,
  value,
  className,
  ...props
}: EnhancedTextareaProps) {
  const charCount = value?.toString().length || 0

  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      tooltip={tooltip}
    >
      <div className="relative">
        <Textarea
          className={cn(
            error && "border-destructive focus:border-destructive",
            showCharCount && "pr-16",
            className
          )}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {showCharCount && maxLength && (
          <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    </FormFieldWrapper>
  )
}

interface EnhancedSelectProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  tooltip?: string
  placeholder?: string
  value?: string
  onValueChange?: (value: string) => void
  options: { value: string; label: string; disabled?: boolean }[]
  className?: string
}

export function EnhancedSelect({
  label,
  description,
  error,
  required = false,
  tooltip,
  placeholder = "Select an option",
  value,
  onValueChange,
  options,
  className,
}: EnhancedSelectProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      tooltip={tooltip}
    >
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={cn(error && "border-destructive", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FormFieldWrapper>
  )
}

interface EnhancedDatePickerProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  tooltip?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function EnhancedDatePicker({
  label,
  description,
  error,
  required = false,
  tooltip,
  placeholder = "Pick a date",
  value,
  onChange,
  disabled = false,
  className,
}: EnhancedDatePickerProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      tooltip={tooltip}
    >
      <DatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(error && "border-destructive", className)}
      />
    </FormFieldWrapper>
  )
}

interface EnhancedCheckboxProps extends React.ComponentProps<typeof Checkbox> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  tooltip?: string
}

export function EnhancedCheckbox({
  label,
  description,
  error,
  required = false,
  tooltip,
  checked,
  onCheckedChange,
  ...props
}: EnhancedCheckboxProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      tooltip={tooltip}
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={checked}
          onCheckedChange={onCheckedChange}
          {...props}
        />
        {label && (
          <Label className={cn("text-sm font-normal", error && "text-destructive")}>
            {label}
            {required && <Asterisk className="inline h-3 w-3 text-destructive ml-1" />}
          </Label>
        )}
      </div>
    </FormFieldWrapper>
  )
}

interface EnhancedRadioGroupProps {
  label?: string
  description?: string
  error?: string
  required?: boolean
  tooltip?: string
  value?: string
  onValueChange?: (value: string) => void
  options: { value: string; label: string; description?: string }[]
  className?: string
}

export function EnhancedRadioGroup({
  label,
  description,
  error,
  required = false,
  tooltip,
  value,
  onValueChange,
  options,
  className,
}: EnhancedRadioGroupProps) {
  return (
    <FormFieldWrapper
      label={label}
      description={description}
      error={error}
      required={required}
      tooltip={tooltip}
    >
      <RadioGroup value={value} onValueChange={onValueChange} className={cn("space-y-3", className)}>
        {options.map((option) => (
          <div key={option.value} className="flex items-start space-x-3">
            <RadioGroupItem value={option.value} id={option.value} />
            <div className="flex-1">
              <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                {option.label}
              </Label>
              {option.description && (
                <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
              )}
            </div>
          </div>
        ))}
      </RadioGroup>
    </FormFieldWrapper>
  )
}
