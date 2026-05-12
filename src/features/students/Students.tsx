import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2, Users, Download } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { usePaginatedRows } from "@/lib/usePaginatedRows";
import { exportToCSV } from "@/lib/exportToCSV";

const studentSchema = z.object({
  profile_id: z.string().min(1, "Profile is required"),
  student_code: z.string().min(1, "Student code is required"),
  class_id: z.string().min(1, "Class is required"),
  gender: z.string().optional(),
  parent_name: z.string().min(1, "Parent name is required"),
  status: z.string().default("active"),
});

type StudentFormValues = z.infer<typeof studentSchema>;
type StudentRow = {
  id: string;
  profile_id: string | null;
  student_code: string | null;
  class_id: string | null;
  section_id: string | null;
  gender: string | null;
  parent_name: string | null;
  status: string | null;
  profile: {
    full_name: string | null;
    email: string | null;
  } | null;
  class: {
    name: string;
  } | null;
  section: {
    name: string;
  } | null;
};

export default function Students() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<StudentRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema) as Resolver<StudentFormValues>,
    defaultValues: {
      profile_id: "",
      student_code: "",
      class_id: "",
      gender: "",
      parent_name: "",
      status: "active",
    },
  });

  const { data: students, isLoading } = useQuery({
    queryKey: ["students"],
    queryFn: async () => {
      let data: StudentRow[] | null = null;
      try {
        const result = await supabase
          .from("students")
          .select(`
            *,
            profile:profiles(full_name, email),
            class:classes(name),
            section:sections(name)
          `)
          .order("created_at", { ascending: false, foreignTable: "profiles" });
        data = result.data;
      } catch (e) {
        // failed
      }
      
      // If ordering by joined table fails (due to created_at absence or postgREST limitations), fetch unordered
      if (!data) {
        const fallback = await supabase
          .from("students")
          .select(`
            *,
            profile:profiles(full_name, email),
            class:classes(name),
            section:sections(name)
          `);
        return fallback.data || [];
      }
      return data || [];
    }
  });

  const { data: availableProfiles } = useQuery({
    queryKey: ["student-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "student");
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

  const createStudentMut = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      const { data, error } = await supabase
        .from("students")
        .insert([values])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student added successfully");
      setShowForm(false);
      setEditingStudent(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to add student");
    }
  });

  const updateStudentMut = useMutation({
    mutationFn: async (values: StudentFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const { data, error } = await supabase
        .from("students")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student updated successfully");
      setShowForm(false);
      setEditingStudent(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update student");
    }
  });

  const deleteStudentMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("students").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students"] });
      toast.success("Student deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete student");
    }
  });

  const onSubmit = (values: StudentFormValues) => {
    createStudentMut.mutate(values);
  };

  const onEditSubmit = (values: StudentFormValues) => {
    if (editingStudent) {
      updateStudentMut.mutate({ ...values, id: editingStudent.id });
    }
  };

  const openEditDialog = (student: StudentRow) => {
    setEditingStudent(student);
    form.reset({
      profile_id: student.profile_id || "",
      student_code: student.student_code || "",
      class_id: student.class_id || "",
      gender: student.gender || "",
      parent_name: student.parent_name || "",
      status: student.status || "active",
    });
    setShowForm(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingStudent(null);
    form.reset();
  };

  const filteredStudents = students?.filter(student => 
    student.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const studentPagination = usePaginatedRows(filteredStudents);

  const handleExportCSV = () => {
    if (!students || students.length === 0) return;
    const exportData = students.map((s) => ({
      student_code: s.student_code || "",
      name: s.profile?.full_name || "",
      class: s.class?.name || "",
      parent_name: s.parent_name || "",
      status: s.status || "",
    }));
    exportToCSV(exportData, "students_export");
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        // Show only form when creating/editing
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{editingStudent ? "Edit Student" : "Add Student"}</h1>
              <p className="text-muted-foreground">
                {editingStudent ? "Update student information." : "Enroll a new student in the system."}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleFormClose}>
              Cancel
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingStudent ? onEditSubmit : onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="profile_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Profile *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a student profile" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableProfiles?.map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{p.full_name || "Unnamed User"}</span>
                                  <span className="text-sm text-muted-foreground">{p.email}</span>
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
                    name="student_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., STU001" {...field} />
                        </FormControl>
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
                              <SelectValue placeholder="Select a class" />
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
                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="parent_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent/Guardian Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter parent or guardian full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Enrollment Status *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="graduated">Graduated</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleFormClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="success" disabled={createStudentMut.isPending || updateStudentMut.isPending}>
                      {createStudentMut.isPending || updateStudentMut.isPending ? "Saving..." : (editingStudent ? "Update Student" : "Add Student")}
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
              <h1 className="text-3xl font-bold tracking-tight">Students</h1>
              <p className="text-muted-foreground">Manage student records and enrollments.</p>
            </div>
            
            <div className="flex gap-2">
              <Button variant="info" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button variant="success" onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
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
                        <TableHead>Code</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {studentPagination.paginatedRows.length > 0 ? (
                        studentPagination.paginatedRows.map((student) => (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">
                              {student.profile?.full_name || "N/A"}
                            </TableCell>
                            <TableCell>{student.student_code || "N/A"}</TableCell>
                            <TableCell>{student.class?.name || "N/A"}</TableCell>
                            <TableCell>
                              <Badge variant={student.status === "active" ? "success" : "secondary"}>
                                {student.status || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="action"
                                  size="icon-sm"
                                  onClick={() => openEditDialog(student)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="action-destructive"
                                  size="icon-sm"
                                  onClick={() => openDeleteDialog(student.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="h-24 text-center">
                            <EmptyState
                              icon={Users}
                              title="No students found"
                              description="Try a different search or add a new student."
                              action={
                                <Button type="button" size="sm" variant="success" onClick={() => setShowForm(true)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Student
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={studentPagination.page}
                    totalPages={studentPagination.totalPages}
                    totalItems={studentPagination.totalItems}
                    pageSize={studentPagination.pageSize}
                    onPageChange={studentPagination.setPage}
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
        title="Delete Student"
        description="Are you sure you want to delete this student record? This action cannot be undone."
        confirmText="Delete"
        
        onConfirm={() => deleteId && deleteStudentMut.mutate(deleteId)}
        
      />
    </div>
  );
}
