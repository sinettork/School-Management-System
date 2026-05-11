import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { EmptyState } from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedRows } from "@/lib/usePaginatedRows";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const resultSchema = z.object({
  student_id: z.string().min(1, "Student is required"),
  exam_id: z.string().min(1, "Exam is required"),
  marks_obtained: z.coerce.number().min(0, "Marks must be non-negative"),
  remarks: z.string().optional(),
});

type ResultFormValues = z.infer<typeof resultSchema>;
type ResultRow = {
  id: string;
  student_id: string;
  exam_id: string;
  marks_obtained: number;
  remarks: string | null;
  student: {
    profile: {
      full_name: string | null;
    } | null;
    student_code: string | null;
  } | null;
  exam: {
    title: string | null;
    subject: {
      name: string | null;
    } | null;
    total_marks: number | null;
  } | null;
};

export default function Results() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ResultRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<ResultFormValues>({
    resolver: zodResolver(resultSchema) as Resolver<ResultFormValues>,
    defaultValues: {
      student_id: "",
      exam_id: "",
      marks_obtained: 0,
      remarks: "",
    },
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ["results"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("results")
        .select(`
          *,
          student:students(
            profile:profiles(full_name),
            student_code
          ),
          exam:exams(
            title,
            subject:subjects(name),
            total_marks
          )
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: students } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select(`
          id,
          student_code,
          profile:profiles(full_name)
        `)
        .order("student_code");
      if (error) throw error;
      return data || [];
    }
  });

  const { data: exams } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          id,
          title,
          subject:subjects(name),
          total_marks
        `)
        .order("title");
      if (error) throw error;
      return data || [];
    }
  });

  const createResultMut = useMutation({
    mutationFn: async (values: ResultFormValues) => {
      const { data, error } = await supabase
        .from("results")
        .insert([values])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Result added successfully");
      setShowForm(false);
      setEditingResult(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to add result");
    }
  });

  const updateResultMut = useMutation({
    mutationFn: async (values: ResultFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const { data, error } = await supabase
        .from("results")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Result updated successfully");
      setShowForm(false);
      setEditingResult(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update result");
    }
  });

  const deleteResultMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("results").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["results"] });
      toast.success("Result deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete result");
    }
  });

  const onSubmit = (values: ResultFormValues) => {
    createResultMut.mutate(values);
  };

  const onEditSubmit = (values: ResultFormValues) => {
    if (editingResult) {
      updateResultMut.mutate({ ...values, id: editingResult.id });
    }
  };

  const openEditDialog = (result: ResultRow) => {
    setEditingResult(result);
    form.reset({
      student_id: result.student_id,
      exam_id: result.exam_id,
      marks_obtained: result.marks_obtained,
      remarks: result.remarks || "",
    });
    setShowForm(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingResult(null);
    form.reset();
  };

  const filteredResults = results?.filter(result => 
    result.student?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.student?.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.exam?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.exam?.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const resultPagination = usePaginatedRows(filteredResults);

  const getPercentage = (marks: number, total: number | null) => {
    if (!total || total === 0) return 0;
    return Math.round((marks / total) * 100);
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return "A+";
    if (percentage >= 80) return "A";
    if (percentage >= 70) return "B";
    if (percentage >= 60) return "C";
    if (percentage >= 50) return "D";
    return "F";
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        // Show only form when creating/editing
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{editingResult ? "Edit Result" : "Add Result"}</h1>
              <p className="text-muted-foreground">
                {editingResult ? "Update result information." : "Record examination results for students."}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleFormClose}>
              Cancel
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingResult ? onEditSubmit : onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="student_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students?.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{student.profile?.full_name || "Unnamed Student"}</span>
                                    <span className="text-sm text-muted-foreground">{student.student_code}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exam_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select exam" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {exams?.map((exam) => (
                                <SelectItem key={exam.id} value={exam.id}>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{exam.title}</span>
                                    <span className="text-sm text-muted-foreground">{exam.subject?.name} ({exam.total_marks} marks)</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="marks_obtained"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks Obtained *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="Enter marks obtained" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter any additional comments" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleFormClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createResultMut.isPending || updateResultMut.isPending}>
                      {createResultMut.isPending || updateResultMut.isPending ? "Saving..." : (editingResult ? "Update Result" : "Add Result")}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Show list view when not creating/editing
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Results</h1>
              <p className="text-muted-foreground">Manage student examination results and grades.</p>
            </div>

            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Result
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search results..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
                        <TableHead>Student</TableHead>
                        <TableHead>Exam</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultPagination.paginatedRows.length > 0 ? (
                        resultPagination.paginatedRows.map((result) => {
                          const percentage = getPercentage(result.marks_obtained, result.exam?.total_marks);
                          const grade = getGrade(percentage);
                          
                          return (
                            <TableRow key={result.id}>
                              <TableCell className="font-medium">
                                {result.student?.profile?.full_name || result.student?.student_code || "N/A"}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{result.exam?.title || "N/A"}</p>
                                  <p className="text-sm text-muted-foreground">{result.exam?.subject?.name || ""}</p>
                                </div>
                              </TableCell>
                              <TableCell>{result.marks_obtained}/{result.exam?.total_marks || "N/A"}</TableCell>
                              <TableCell>{percentage}%</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  percentage >= 70 ? "bg-green-100 text-green-800" :
                                  percentage >= 50 ? "bg-yellow-100 text-yellow-800" :
                                  "bg-red-100 text-red-800"
                                }`}>
                                  {grade}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(result)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openDeleteDialog(result.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="h-24 text-center">
                            <EmptyState
                              icon={Award}
                              title="No results found"
                              description="Try a different search or add new results."
                              action={
                                <Button type="button" size="sm" onClick={() => setShowForm(true)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Result
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={resultPagination.page}
                    totalPages={resultPagination.totalPages}
                    totalItems={resultPagination.totalItems}
                    pageSize={resultPagination.pageSize}
                    onPageChange={resultPagination.setPage}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Result"
        description="Are you sure you want to delete this result? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => deleteId && deleteResultMut.mutate(deleteId)}
        isDangerous
      />
    </div>
  );
}
