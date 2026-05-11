import { useQuery } from "@tanstack/react-query";
import { CalendarDays, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { EnhancedSelect } from "@/components/ui/form-input";
import { Badge } from "@/components/ui/badge";
import { FormHint } from "@/components/ui/enhanced-form";

interface PhaseSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  includeAllOption?: boolean;
  showActiveOnly?: boolean;
  className?: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function PhaseSelector({
  value,
  onValueChange,
  placeholder = "Select a phase",
  includeAllOption = true,
  showActiveOnly = false,
  className,
  label = "Academic Phase",
  description = "Select the academic phase/term",
  required = false,
}: PhaseSelectorProps) {
  const { data: phases, isLoading, error } = useQuery({
    queryKey: ["phases-selector", showActiveOnly],
    queryFn: async () => {
      let query = supabase
        .from("phases")
        .select("*, academic_year:academic_years(name)")
        .order("academic_year_id", { ascending: false })
        .order("sequence_number", { ascending: true });

      if (showActiveOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const options = phases?.map((phase) => ({
    value: phase.id,
    label: `${phase.name} (${phase.academic_year?.name})`,
    disabled: phase.status !== "active" && phase.status !== "upcoming",
  })) || [];

  if (includeAllOption) {
    options.unshift({ value: "all", label: "All Phases", disabled: false });
  }

  if (error) {
    return (
      <div className="space-y-2">
        <FormHint variant="warning">
          <AlertCircle className="h-4 w-4" />
          Unable to load phases. Please refresh the page.
        </FormHint>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <EnhancedSelect
        label={label}
        description={description}
        value={value}
        onValueChange={onValueChange}
        options={options}
        placeholder={placeholder}
        required={required}
        leftIcon={<CalendarDays className="h-4 w-4" />}
        className={className}
        tooltip="Select the academic phase to filter or organize data"
      />
      {value && value !== "all" && phases && (
        <div className="flex items-center gap-2">
          {phases.find(p => p.id === value) && (
            <Badge 
              variant={
                phases.find(p => p.id === value)?.status === "active" ? "default" :
                phases.find(p => p.id === value)?.status === "upcoming" ? "secondary" : "outline"
              }
              className="capitalize"
            >
              {phases.find(p => p.id === value)?.status}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

interface AcademicYearSelectorProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  includeAllOption?: boolean;
  showActiveOnly?: boolean;
  className?: string;
  label?: string;
  description?: string;
  required?: boolean;
}

export function AcademicYearSelector({
  value,
  onValueChange,
  placeholder = "Select an academic year",
  includeAllOption = true,
  showActiveOnly = false,
  className,
  label = "Academic Year",
  description = "Select the academic year",
  required = false,
}: AcademicYearSelectorProps) {
  const { data: academicYears, isLoading, error } = useQuery({
    queryKey: ["academic-years-selector", showActiveOnly],
    queryFn: async () => {
      let query = supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (showActiveOnly) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const options = academicYears?.map((year) => ({
    value: year.id,
    label: `${year.name} (${new Date(year.start_date).getFullYear()}-${new Date(year.end_date).getFullYear()})`,
    disabled: false,
  })) || [];

  if (includeAllOption) {
    options.unshift({ value: "all", label: "All Academic Years", disabled: false });
  }

  if (error) {
    return (
      <div className="space-y-2">
        <FormHint variant="warning">
          <AlertCircle className="h-4 w-4" />
          Unable to load academic years. Please refresh the page.
        </FormHint>
      </div>
    );
  }

  return (
    <EnhancedSelect
      label={label}
      description={description}
      value={value}
      onValueChange={onValueChange}
      options={options}
      placeholder={placeholder}
      required={required}
      className={className}
      tooltip="Select the academic year to filter or organize data"
    />
  );
}
