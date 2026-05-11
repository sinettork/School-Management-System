import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Plus, Search, Edit, Trash2, AcademicCap, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePaginatedRows } from "@/lib/usePaginatedRows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { EnhancedForm, FormSection, FormFieldGroup, FormHint } from "@/components/ui/enhanced-form";
import { EnhancedInput, EnhancedSelect, EnhancedDatePicker } from "@/components/ui/form-input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

type AcademicYearFormValues = {
  name: string;
  start_date: string;
  end_date: string;
};

type PhaseFormValues = {
  academic_year_id: string;
  name: string;
  phase_type: string;
  sequence_number: string;
  start_date: string;
  end_date: string;
};

const defaultAcademicYearValues: AcademicYearFormValues = {
  name: "",
  start_date: "",
  end_date: "",
};

const defaultPhaseValues: PhaseFormValues = {
  academic_year_id: "",
  name: "",
  phase_type: "term",
  sequence_number: "1",
  start_date: "",
  end_date: "",
};

export default function Phases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showAcademicYearForm, setShowAcademicYearForm] = useState(false);
  const [showPhaseForm, setShowPhaseForm] = useState(false);
  const [academicYearFormValues, setAcademicYearFormValues] = useState<AcademicYearFormValues>(defaultAcademicYearValues);
  const [phaseFormValues, setPhaseFormValues] = useState<PhaseFormValues>(defaultPhaseValues);
  const [editingAcademicYear, setEditingAcademicYear] = useState<any>(null);
  const [editingPhase, setEditingPhase] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: string; id: string } | null>(null);
  const queryClient = useQueryClient();

  // Fetch academic years
  const { data: academicYears, isLoading: academicYearsLoading } = useQuery({
    queryKey: ["academic-years"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch phases
  const { data: phases, isLoading: phasesLoading } = useQuery({
    queryKey: ["phases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("phases")
        .select("*, academic_year:academic_years(name)")
        .order("academic_year_id", { ascending: false })
        .order("sequence_number", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Create academic year mutation
  const createAcademicYearMut = useMutation({
    mutationFn: async (values: AcademicYearFormValues) => {
      if (!values.name.trim() || !values.start_date || !values.end_date) {
        throw new Error("All fields are required");
      }

      const { data, error } = await supabase
        .from("academic_years")
        .insert([{
          name: values.name.trim(),
          start_date: values.start_date,
          end_date: values.end_date,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast.success("Academic year created successfully");
      setShowAcademicYearForm(false);
      setAcademicYearFormValues(defaultAcademicYearValues);
      setEditingAcademicYear(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create academic year");
    },
  });

  // Update academic year mutation
  const updateAcademicYearMut = useMutation({
    mutationFn: async (values: AcademicYearFormValues & { id: string }) => {
      if (!values.name.trim() || !values.start_date || !values.end_date) {
        throw new Error("All fields are required");
      }

      const { data, error } = await supabase
        .from("academic_years")
        .update({
          name: values.name.trim(),
          start_date: values.start_date,
          end_date: values.end_date,
        })
        .eq("id", values.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast.success("Academic year updated successfully");
      setShowAcademicYearForm(false);
      setAcademicYearFormValues(defaultAcademicYearValues);
      setEditingAcademicYear(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update academic year");
    },
  });

  // Create phase mutation
  const createPhaseMut = useMutation({
    mutationFn: async (values: PhaseFormValues) => {
      if (!values.academic_year_id || !values.name.trim() || !values.start_date || !values.end_date) {
        throw new Error("All fields are required");
      }

      const { data, error } = await supabase
        .from("phases")
        .insert([{
          academic_year_id: values.academic_year_id,
          name: values.name.trim(),
          phase_type: values.phase_type,
          sequence_number: parseInt(values.sequence_number),
          start_date: values.start_date,
          end_date: values.end_date,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast.success("Phase created successfully");
      setShowPhaseForm(false);
      setPhaseFormValues(defaultPhaseValues);
      setEditingPhase(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create phase");
    },
  });

  // Update phase mutation
  const updatePhaseMut = useMutation({
    mutationFn: async (values: PhaseFormValues & { id: string }) => {
      if (!values.academic_year_id || !values.name.trim() || !values.start_date || !values.end_date) {
        throw new Error("All fields are required");
      }

      const { data, error } = await supabase
        .from("phases")
        .update({
          academic_year_id: values.academic_year_id,
          name: values.name.trim(),
          phase_type: values.phase_type,
          sequence_number: parseInt(values.sequence_number),
          start_date: values.start_date,
          end_date: values.end_date,
        })
        .eq("id", values.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast.success("Phase updated successfully");
      setShowPhaseForm(false);
      setPhaseFormValues(defaultPhaseValues);
      setEditingPhase(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update phase");
    },
  });

  // Delete mutations
  const deleteAcademicYearMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("academic_years")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast.success("Academic year deleted successfully");
      setItemToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete academic year");
    },
  });

  const deletePhaseMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("phases")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["phases"] });
      toast.success("Phase deleted successfully");
      setItemToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete phase");
    },
  });

  const filteredPhases = phases?.filter((phase) => {
    const query = searchTerm.toLowerCase();
    return (
      phase.name?.toLowerCase().includes(query) ||
      phase.phase_type?.toLowerCase().includes(query) ||
      phase.academic_year?.name?.toLowerCase().includes(query)
    );
  });

  const phasePagination = usePaginatedRows(filteredPhases);

  const handleEditAcademicYear = (academicYear: any) => {
    setEditingAcademicYear(academicYear);
    setAcademicYearFormValues({
      name: academicYear.name,
      start_date: academicYear.start_date,
      end_date: academicYear.end_date,
    });
    setShowAcademicYearForm(true);
  };

  const handleEditPhase = (phase: any) => {
    setEditingPhase(phase);
    setPhaseFormValues({
      academic_year_id: phase.academic_year_id,
      name: phase.name,
      phase_type: phase.phase_type,
      sequence_number: phase.sequence_number.toString(),
      start_date: phase.start_date,
      end_date: phase.end_date,
    });
    setShowPhaseForm(true);
  };

  const handleDelete = (type: string, id: string) => {
    setItemToDelete({ type, id });
    setDeleteConfirmOpen(true);
  };

  const handleAcademicYearSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingAcademicYear) {
      updateAcademicYearMut.mutate({ ...academicYearFormValues, id: editingAcademicYear.id });
    } else {
      createAcademicYearMut.mutate(academicYearFormValues);
    }
  };

  const handlePhaseSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingPhase) {
      updatePhaseMut.mutate({ ...phaseFormValues, id: editingPhase.id });
    } else {
      createPhaseMut.mutate(phaseFormValues);
    }
  };

  const handleFormClose = (formType: "academic-year" | "phase") => {
    if (formType === "academic-year") {
      setShowAcademicYearForm(false);
      setAcademicYearFormValues(defaultAcademicYearValues);
      setEditingAcademicYear(null);
    } else {
      setShowPhaseForm(false);
      setPhaseFormValues(defaultPhaseValues);
      setEditingPhase(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      upcoming: "secondary",
      active: "default",
      completed: "outline",
    } as const;

    const icons = {
      upcoming: Clock,
      active: CheckCircle,
      completed: AlertCircle,
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <Badge variant={variants[status as keyof typeof variants]} className="capitalize">
        <Icon className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {showAcademicYearForm ? (
        <EnhancedForm
          title={editingAcademicYear ? "Edit Academic Year" : "Add Academic Year"}
          description={editingAcademicYear ? "Update academic year information." : "Create a new academic year for the school."}
          onSubmit={handleAcademicYearSubmit}
          isLoading={createAcademicYearMut.isPending || updateAcademicYearMut.isPending}
          submitText={editingAcademicYear ? "Update Academic Year" : "Create Academic Year"}
          onCancel={() => handleFormClose("academic-year")}
          submitDisabled={!academicYearFormValues.name.trim() || !academicYearFormValues.start_date || !academicYearFormValues.end_date}
          status={createAcademicYearMut.isError || updateAcademicYearMut.isError ? "error" : "idle"}
          errorMessage={createAcademicYearMut.error?.message || updateAcademicYearMut.error?.message}
        >
          <FormSection title="Academic Year Details" description="Enter the basic information for the academic year">
            <FormFieldGroup>
              <EnhancedInput
                label="Academic Year Name"
                description="Enter the academic year name (e.g., 2024-2025)"
                value={academicYearFormValues.name}
                onChange={(event) => setAcademicYearFormValues((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g., 2024-2025"
                required
                leftIcon={<AcademicCap className="h-4 w-4" />}
              />
            </FormFieldGroup>
            <FormFieldGroup columns={2}>
              <EnhancedDatePicker
                label="Start Date"
                description="First day of the academic year"
                value={academicYearFormValues.start_date}
                onChange={(value) => setAcademicYearFormValues((prev) => ({ ...prev, start_date: value }))}
                required
              />
              <EnhancedDatePicker
                label="End Date"
                description="Last day of the academic year"
                value={academicYearFormValues.end_date}
                onChange={(value) => setAcademicYearFormValues((prev) => ({ ...prev, end_date: value }))}
                required
              />
            </FormFieldGroup>
            <FormHint variant="info">
              Academic years typically span 12 months and should not overlap with existing academic years.
            </FormHint>
          </FormSection>
        </EnhancedForm>
      ) : showPhaseForm ? (
        <EnhancedForm
          title={editingPhase ? "Edit Phase" : "Add Phase"}
          description={editingPhase ? "Update phase information." : "Create a new phase/term/semester for the academic year."}
          onSubmit={handlePhaseSubmit}
          isLoading={createPhaseMut.isPending || updatePhaseMut.isPending}
          submitText={editingPhase ? "Update Phase" : "Create Phase"}
          onCancel={() => handleFormClose("phase")}
          submitDisabled={!phaseFormValues.academic_year_id || !phaseFormValues.name.trim() || !phaseFormValues.start_date || !phaseFormValues.end_date}
          status={createPhaseMut.isError || updatePhaseMut.isError ? "error" : "idle"}
          errorMessage={createPhaseMut.error?.message || updatePhaseMut.error?.message}
        >
          <FormSection title="Phase Details" description="Enter the basic information for the phase">
            <FormFieldGroup columns={2}>
              <EnhancedSelect
                label="Academic Year"
                description="Select the academic year"
                value={phaseFormValues.academic_year_id}
                onValueChange={(value) => setPhaseFormValues((prev) => ({ ...prev, academic_year_id: value }))}
                options={academicYears?.map((year) => ({
                  value: year.id,
                  label: year.name,
                })) || []}
                required
                leftIcon={<AcademicCap className="h-4 w-4" />}
              />
              <EnhancedSelect
                label="Phase Type"
                description="Choose the type of phase"
                value={phaseFormValues.phase_type}
                onValueChange={(value) => setPhaseFormValues((prev) => ({ ...prev, phase_type: value }))}
                options={[
                  { value: "term", label: "Term" },
                  { value: "semester", label: "Semester" },
                  { value: "quarter", label: "Quarter" },
                ]}
                required
              />
            </FormFieldGroup>
            <FormFieldGroup columns={2}>
              <EnhancedInput
                label="Phase Name"
                description="Enter the phase name"
                value={phaseFormValues.name}
                onChange={(event) => setPhaseFormValues((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="e.g., First Term, Fall Semester"
                required
                leftIcon={<CalendarDays className="h-4 w-4" />}
              />
              <EnhancedInput
                label="Sequence Number"
                description="Order within the academic year (1, 2, 3...)"
                type="number"
                min="1"
                value={phaseFormValues.sequence_number}
                onChange={(event) => setPhaseFormValues((prev) => ({ ...prev, sequence_number: event.target.value }))}
                placeholder="1"
                required
              />
            </FormFieldGroup>
            <FormFieldGroup columns={2}>
              <EnhancedDatePicker
                label="Start Date"
                description="First day of the phase"
                value={phaseFormValues.start_date}
                onChange={(value) => setPhaseFormValues((prev) => ({ ...prev, start_date: value }))}
                required
              />
              <EnhancedDatePicker
                label="End Date"
                description="Last day of the phase"
                value={phaseFormValues.end_date}
                onChange={(value) => setPhaseFormValues((prev) => ({ ...prev, end_date: value }))}
                required
              />
            </FormFieldGroup>
            <FormHint variant="info">
              Phases should not overlap within the same academic year and should follow a logical sequence.
            </FormHint>
          </FormSection>
        </EnhancedForm>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Academic Phases</h1>
              <p className="manage academic years, terms, semesters, and quarters.</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowAcademicYearForm(true)}>
                <AcademicCap className="mr-2 h-4 w-4" />
                Add Academic Year
              </Button>
              <Button onClick={() => setShowPhaseForm(true)}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Add Phase
              </Button>
            </div>
          </div>

          {/* Academic Years Summary */}
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Academic Years</h3>
            </CardHeader>
            <CardContent>
              {academicYearsLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {academicYears?.map((year) => (
                    <Card key={year.id} className={year.is_active ? "border-primary" : ""}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold">{year.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(year.start_date).toLocaleDateString()} - {new Date(year.end_date).toLocaleDateString()}
                            </p>
                          </div>
                          {year.is_active && (
                            <Badge variant="default">Active</Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAcademicYear(year)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete("academic-year", year.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Phases Table */}
          <Card>
            <CardHeader>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search phases..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {phasesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phase</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Academic Year</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {phasePagination.paginatedRows.length > 0 ? (
                        phasePagination.paginatedRows.map((phase) => (
                          <TableRow key={phase.id}>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <div className="mt-1 rounded-full bg-primary/10 p-2">
                                  <CalendarDays className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{phase.name || "Unnamed Phase"}</p>
                                  <p className="text-sm text-muted-foreground">Sequence {phase.sequence_number}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {phase.phase_type || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>{phase.academic_year?.name || "N/A"}</TableCell>
                            <TableCell>
                              {phase.start_date && phase.end_date
                                ? `${new Date(phase.start_date).toLocaleDateString()} - ${new Date(phase.end_date).toLocaleDateString()}`
                                : "N/A"}
                            </TableCell>
                            <TableCell>{getStatusBadge(phase.status || "upcoming")}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditPhase(phase)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete("phase", phase.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <EmptyState
                              icon={CalendarDays}
                              title="No phases found"
                              description="Try a different search or create a new phase."
                              action={
                                <Button type="button" size="sm" onClick={() => setShowPhaseForm(true)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Phase
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={phasePagination.page}
                    totalPages={phasePagination.totalPages}
                    totalItems={phasePagination.totalItems}
                    pageSize={phasePagination.pageSize}
                    onPageChange={phasePagination.setPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete ${itemToDelete?.type === "academic-year" ? "Academic Year" : "Phase"}`}
        description={`Are you sure you want to delete this ${itemToDelete?.type}? This action cannot be undone and may affect related data.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {
          if (itemToDelete) {
            if (itemToDelete.type === "academic-year") {
              deleteAcademicYearMut.mutate(itemToDelete.id);
            } else {
              deletePhaseMut.mutate(itemToDelete.id);
            }
          }
        }}
        isDangerous
      />
    </div>
  );
}
