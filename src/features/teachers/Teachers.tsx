import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Pencil, Trash2, GraduationCap } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { usePaginatedRows } from "@/lib/usePaginatedRows";

const teacherSchema = z.object({
  profile_id: z.string().min(1, "Profile is required"),
  employee_code: z.string().min(1, "Employee code is required"),
  qualification: z.string().min(1, "Qualification is required"),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;
type TeacherRow = {
  id: string;
  profile_id: string | null;
  employee_code: string | null;
  qualification: string | null;
  joining_date: string | null;
  salary: number | null;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      profile_id: "",
      employee_code: "",
      qualification: "",
    },
  });

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teachers")
        .select(`
          *,
          profile:profiles(full_name, email, phone)
        `)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: availableProfiles } = useQuery({
    queryKey: ["teacher-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "teacher");
      if (error) throw error;
      return data || [];
    }
  });

  const createTeacherMut = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      const { data, error } = await supabase
        .from("teachers")
        .insert([values])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher added successfully");
      setShowForm(false);
      setEditingTeacher(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to add teacher");
    }
  });

  const updateTeacherMut = useMutation({
    mutationFn: async (values: TeacherFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const { data, error } = await supabase
        .from("teachers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher updated successfully");
      setShowForm(false);
      setEditingTeacher(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update teacher");
    }
  });

  const deleteTeacherMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teachers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Teacher deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete teacher");
    }
  });

  const onSubmit = (values: TeacherFormValues) => {
    createTeacherMut.mutate(values);
  };

  const onEditSubmit = (values: TeacherFormValues) => {
    if (editingTeacher) {
      updateTeacherMut.mutate({ ...values, id: editingTeacher.id });
    }
  };

  const openEditDialog = (teacher: TeacherRow) => {
    setEditingTeacher(teacher);
    form.reset({
      profile_id: teacher.profile_id || "",
      employee_code: teacher.employee_code || "",
      qualification: teacher.qualification || "",
    });
    setShowForm(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingTeacher(null);
    form.reset();
  };

  const filteredTeachers = teachers?.filter(teacher => 
    teacher.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const teacherPagination = usePaginatedRows(filteredTeachers);

  return (
    <div className="space-y-6">
      {showForm ? (
        // Show only form when creating/editing
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{editingTeacher ? "Edit Teacher" : "Add Teacher"}</h1>
              <p className="text-muted-foreground">
                {editingTeacher ? "Update teacher information." : "Add a new teacher to the system."}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleFormClose}>
              Cancel
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingTeacher ? onEditSubmit : onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="profile_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher Profile *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a teacher profile" />
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
                    name="employee_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., TCH001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="qualification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Highest Qualification *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Masters in Education, B.Sc. Mathematics" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleFormClose}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTeacherMut.isPending || updateTeacherMut.isPending}>
                      {createTeacherMut.isPending || updateTeacherMut.isPending ? "Saving..." : (editingTeacher ? "Update Teacher" : "Add Teacher")}
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
              <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
              <p className="text-muted-foreground">Manage teacher records and qualifications.</p>
            </div>

            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teachers..."
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
                        <TableHead>Teacher</TableHead>
                        <TableHead>Employee Code</TableHead>
                        <TableHead>Qualification</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherPagination.paginatedRows.length > 0 ? (
                        teacherPagination.paginatedRows.map((teacher) => (
                          <TableRow key={teacher.id}>
                            <TableCell className="font-medium">
                              {teacher.profile?.full_name || "N/A"}
                            </TableCell>
                            <TableCell>{teacher.employee_code || "N/A"}</TableCell>
                            <TableCell>{teacher.qualification || "N/A"}</TableCell>
                            <TableCell>{teacher.profile?.phone || "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="action"
                                  size="icon-sm"
                                  onClick={() => openEditDialog(teacher)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="action-destructive"
                                  size="icon-sm"
                                  onClick={() => openDeleteDialog(teacher.id)}
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
                              icon={GraduationCap}
                              title="No teachers found"
                              description="Try a different search or add a new teacher."
                              action={
                                <Button type="button" size="sm" onClick={() => setShowForm(true)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Teacher
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={teacherPagination.page}
                    totalPages={teacherPagination.totalPages}
                    totalItems={teacherPagination.totalItems}
                    pageSize={teacherPagination.pageSize}
                    onPageChange={teacherPagination.setPage}
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
        title="Delete Teacher"
        description="Are you sure you want to delete this teacher record? This action cannot be undone."
        confirmText="Delete"
        
        onConfirm={() => deleteId && deleteTeacherMut.mutate(deleteId)}
        
      />
    </div>
  );
}
