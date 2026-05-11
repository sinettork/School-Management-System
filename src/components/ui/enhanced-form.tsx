import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react"

interface EnhancedFormProps {
  title: string
  description?: string
  children: React.ReactNode
  onSubmit: (e: React.FormEvent) => void
  isLoading?: boolean
  submitText?: string
  cancelText?: string
  onCancel?: () => void
  submitDisabled?: boolean
  className?: string
  status?: "idle" | "loading" | "success" | "error"
  errorMessage?: string
  successMessage?: string
  showProgress?: boolean
  currentStep?: number
  totalSteps?: number
}

export function EnhancedForm({
  title,
  description,
  children,
  onSubmit,
  isLoading = false,
  submitText = "Submit",
  cancelText = "Cancel",
  onCancel,
  submitDisabled = false,
  className,
  status = "idle",
  errorMessage,
  successMessage,
  showProgress = false,
  currentStep = 1,
  totalSteps = 1,
}: EnhancedFormProps) {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-left space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground text-lg">{description}</p>
        )}
        {showProgress && totalSteps > 1 && (
          <div className="flex items-center gap-2 mt-4">
            <div className="flex items-center gap-1">
              {Array.from({ length: totalSteps }, (_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-200",
                    i < currentStep
                      ? "bg-primary"
                      : i === currentStep - 1
                      ? "bg-primary ring-2 ring-primary ring-offset-2"
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
          </div>
        )}
      </div>

      {/* Status Messages */}
      {status === "success" && successMessage && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{successMessage}</p>
        </div>
      )}

      {status === "error" && errorMessage && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}

      {/* Form Card */}
      <Card className={cn("shadow-sm border-0", className)}>
        <CardContent className="p-8">
          <form onSubmit={onSubmit} className="space-y-8">
            {children}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4" />
                <span>* Required fields</span>
              </div>
              
              <div className="flex gap-3">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={isLoading}
                    className="min-w-[100px]"
                  >
                    {cancelText}
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={submitDisabled || isLoading}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    submitText
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className="space-y-4">{children}</div>
      {title && <Separator className="mt-6" />}
    </div>
  )
}

interface FormFieldGroupProps {
  title?: string
  description?: string
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

export function FormFieldGroup({
  title,
  description,
  children,
  columns = 1,
  className,
}: FormFieldGroupProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  }

  return (
    <div className={cn("space-y-3", className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h4 className="text-sm font-medium text-foreground">{title}</h4>
          )}
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div className={cn("grid gap-4", gridCols[columns])}>{children}</div>
    </div>
  )
}

interface FormHintProps {
  children: React.ReactNode
  variant?: "info" | "warning" | "success"
  className?: string
}

export function FormHint({ children, variant = "info", className }: FormHintProps) {
  const variants = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
    success: "bg-green-50 border-green-200 text-green-800",
  }

  const icons = {
    info: Info,
    warning: AlertCircle,
    success: CheckCircle2,
  }

  const Icon = icons[variant]

  return (
    <div className={cn(
      "flex items-start gap-2 p-3 rounded-md border text-sm",
      variants[variant],
      className
    )}>
      <Icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
      <div>{children}</div>
    </div>
  )
}
