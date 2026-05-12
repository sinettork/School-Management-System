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
import { Plus, Search, Pencil, Trash2, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { usePaginatedRows } from "@/lib/usePaginatedRows";

const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required"),
  code: z.string().min(1, "Subject code is required"),
  description: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;
type SubjectRow = {
  id: string;
  name: string;
  code: string;
  description: string | null;
};

export default function Subjects() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectSchema) as Resolver<SubjectFormValues>,
    defaultValues: {
      name: "",
      code: "",
      description: "",
    },
  });

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");
      if (error) throw error;
      return data || [];
    }
  });

  const createSubjectMut = useMutation({
    mutationFn: async (values: SubjectFormValues) => {
      const { data, error } = await supabase
        .from("subjects")
        .insert([values])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject added successfully");
      setShowForm(false);
      setEditingSubject(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to add subject");
    }
  });

  const updateSubjectMut = useMutation({
    mutationFn: async (values: SubjectFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const { data, error } = await supabase
        .from("subjects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject updated successfully");
      setShowForm(false);
      setEditingSubject(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update subject");
    }
  });

  const deleteSubjectMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted successfully");
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete subject");
    }
  });

  const onSubmit = (values: SubjectFormValues) => {
    createSubjectMut.mutate(values);
  };

  const onEditSubmit = (values: SubjectFormValues) => {
    if (editingSubject) {
      updateSubjectMut.mutate({ ...values, id: editingSubject.id });
    }
  };

  const openEditDialog = (subject: SubjectRow) => {
    setEditingSubject(subject);
    form.reset({
      name: subject.name,
      code: subject.code,
      description: subject.description || "",
    });
    setShowForm(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingSubject(null);
    form.reset();
  };

  const filteredSubjects = subjects?.filter(subject => 
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const subjectPagination = usePaginatedRows(filteredSubjects);

  return (
    <div className="space-y-6">
      {showForm ? (
        // Show only form when creating/editing
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{editingSubject ? "Edit Subject" : "Add Subject"}</h1>
              <p className="text-muted-foreground">
                {editingSubject ? "Update subject information." : "Create a new subject for the curriculum."}
              </p>
            </div>
            <Button type="button" variant="outline" onClick={handleFormClose}>
              Cancel
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(editingSubject ? onEditSubmit : onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Mathematics, English, Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., MATH, ENG, SCI" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief description of the subject" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleFormClose}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="success" disabled={createSubjectMut.isPending || updateSubjectMut.isPending}>
                      {createSubjectMut.isPending || updateSubjectMut.isPending ? "Saving..." : (editingSubject ? "Update Subject" : "Add Subject")}
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
              <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
              <p className="text-muted-foreground">Manage curriculum subjects and courses.</p>
            </div>

            <Button variant="success" onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subjects..."
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
                        <TableHead>Subject Name</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjectPagination.paginatedRows.length > 0 ? (
                        subjectPagination.paginatedRows.map((subject) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.name}</TableCell>
                            <TableCell>{subject.code}</TableCell>
                            <TableCell>{subject.description || "-"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="action"
                                  size="icon-sm"
                                  onClick={() => openEditDialog(subject)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="action-destructive"
                                  size="icon-sm"
                                  onClick={() => openDeleteDialog(subject.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="h-24 text-center">
                            <EmptyState
                              icon={BookOpen}
                              title="No subjects found"
                              description="Try a different search or create a new subject."
                              action={
                                <Button type="button" size="sm" variant="success" onClick={() => setShowForm(true)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Subject
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={subjectPagination.page}
                    totalPages={subjectPagination.totalPages}
                    totalItems={subjectPagination.totalItems}
                    pageSize={subjectPagination.pageSize}
                    onPageChange={subjectPagination.setPage}
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
        title="Delete Subject"
        description="Are you sure you want to delete this subject? This action cannot be undone."
        confirmText="Delete"
        
        onConfirm={() => deleteId && deleteSubjectMut.mutate(deleteId)}
        
      />
    </div>
  );
}
