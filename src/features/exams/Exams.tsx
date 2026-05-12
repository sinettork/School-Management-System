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
import { Plus, Search, Pencil, Trash2, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedRows } from "@/lib/usePaginatedRows";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

const examSchema = z.object({
  title: z.string().min(1, "Exam title is required"),
  subject_id: z.string().min(1, "Subject is required"),
  class_id: z.string().min(1, "Class is required"),
  exam_date: z.string().min(1, "Exam date is required"),
  total_marks: z.coerce.number().min(1, "Total marks must be positive"),
  duration_minutes: z.coerce.number().min(1, "Duration must be positive"),
});

type ExamFormValues = z.infer<typeof examSchema>;
type ExamRow = {
  id: string;
  title: string;
  subject_id: string;
  class_id: string;
  exam_date: string;
  total_marks: number;
  duration_minutes: number;
  subject: {
    name: string;
  } | null;
  class: {
    name: string;
  } | null;
};

export default function Exams() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<ExamRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema) as Resolver<ExamFormValues>,
    defaultValues: {
      title: "",
      subject_id: "",
      class_id: "",
      exam_date: "",
      total_marks: 100,
      duration_minutes: 60,
    },
  });

  const { data: exams, isLoading } = useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exams")
        .select(`
          *,
          subject:subjects(name),
          class:classes(name)
        `)
        .order("exam_date", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase.from("subjects").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    }
  });

  const { data: classes } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("classes").select("id, name").order("name");
      if (error) throw error;
      return data || [];
    }
  });

  const createExamMut = useMutation({
    mutationFn: async (values: ExamFormValues) => {
      const { data, error } = await supabase
        .from("exams")
        .insert([values])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam created successfully");
      setShowForm(false);
      setEditingExam(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to create exam");
    }
  });

  const updateExamMut = useMutation({
    mutationFn: async (values: ExamFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const { data, error } = await supabase
        .from("exams")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam updated successfully");
      setShowForm(false);
      setEditingExam(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update exam");
    }
  });

  const deleteExamMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("exams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      toast.success("Exam deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete exam");
    }
  });

  const onSubmit = (values: ExamFormValues) => {
    createExamMut.mutate(values);
  };

  const onEditSubmit = (values: ExamFormValues) => {
    if (editingExam) {
      updateExamMut.mutate({ ...values, id: editingExam.id });
    }
  };

  const openEditDialog = (exam: ExamRow) => {
    setEditingExam(exam);
    form.reset({
      title: exam.title,
      subject_id: exam.subject_id,
      class_id: exam.class_id,
      exam_date: exam.exam_date,
      total_marks: exam.total_marks,
      duration_minutes: exam.duration_minutes,
    });
    setShowForm(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingExam(null);
    form.reset();
  };

  const filteredExams = exams?.filter(exam => 
    exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exam.class?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const examPagination = usePaginatedRows(filteredExams);

  return (
    <div className="space-y-6">
      {showForm ? (
        // Show only form when creating/editing
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{editingExam ? "Edit Exam" : "Create Exam"}</h1>
              <p className="text-muted-foreground">
                {editingExam ? "Update exam information." : "Schedule a new examination."}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleFormClose}>
              Cancel
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingExam ? onEditSubmit : onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mid-term Mathematics Examination" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="subject_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects?.map((subject) => (
                                <SelectItem key={subject.id} value={subject.id}>
                                  {subject.name}
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
                      name="class_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes?.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="exam_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exam Date *</FormLabel>
                          <FormControl>
                            <DatePicker
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select exam date"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="total_marks"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Marks *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="100" 
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
                      name="duration_minutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="60" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleFormClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="warning" disabled={createExamMut.isPending || updateExamMut.isPending}>
                      {createExamMut.isPending || updateExamMut.isPending ? "Saving..." : (editingExam ? "Update Exam" : "Create Exam")}
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
              <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
              <p className="text-muted-foreground">Manage examination schedules and details.</p>
            </div>

            <Button variant="warning" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Exam
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search exams..."
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
                        <TableHead>Exam Title</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {examPagination.paginatedRows.length > 0 ? (
                        examPagination.paginatedRows.map((exam) => (
                          <TableRow key={exam.id}>
                            <TableCell className="font-medium">{exam.title}</TableCell>
                            <TableCell>{exam.subject?.name || "N/A"}</TableCell>
                            <TableCell>{exam.class?.name || "N/A"}</TableCell>
                            <TableCell>{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>{exam.total_marks}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="action"
                                  size="icon-sm"
                                  onClick={() => openEditDialog(exam)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="action-destructive"
                                  size="icon-sm"
                                  onClick={() => openDeleteDialog(exam.id)}
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
                              icon={FileText}
                              title="No exams found"
                              description="Try a different search or create a new exam."
                              action={
                                <Button type="button" size="sm" variant="warning" onClick={() => setShowForm(true)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Create Exam
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={examPagination.page}
                    totalPages={examPagination.totalPages}
                    totalItems={examPagination.totalItems}
                    pageSize={examPagination.pageSize}
                    onPageChange={examPagination.setPage}
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
        title="Delete Exam"
        description="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete"
        
        onConfirm={() => deleteId && deleteExamMut.mutate(deleteId)}
        
      />
    </div>
  );
}
