import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Plus, Search, Edit, Trash2, Megaphone, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePaginatedRows } from "@/lib/usePaginatedRows";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { TablePagination } from "@/components/shared/TablePagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EnhancedForm, FormSection, FormFieldGroup, FormHint } from "@/components/ui/enhanced-form";
import { EnhancedInput, EnhancedTextarea, EnhancedSelect } from "@/components/ui/form-input";

type NoticeFormValues = {
  title: string;
  description: string;
  audience: string;
};

const defaultFormValues: NoticeFormValues = {
  title: "",
  description: "",
  audience: "all",
};

export default function Notices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<NoticeFormValues>(defaultFormValues);
  const [editingNotice, setEditingNotice] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: notices, isLoading } = useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const createNoticeMut = useMutation({
    mutationFn: async (values: NoticeFormValues) => {
      if (!values.title.trim() || !values.description.trim()) {
        throw new Error("Title and description are required");
      }

      const { data, error } = await supabase
        .from("notices")
        .insert([
          {
            title: values.title.trim(),
            description: values.description.trim(),
            audience: values.audience,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-notices"] });
      toast.success("Notice published successfully");
      setShowForm(false);
      setFormValues(defaultFormValues);
      setEditingNotice(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to publish notice");
    },
  });

  const updateNoticeMut = useMutation({
    mutationFn: async (values: NoticeFormValues & { id: string }) => {
      if (!values.title.trim() || !values.description.trim()) {
        throw new Error("Title and description are required");
      }

      const { data, error } = await supabase
        .from("notices")
        .update({
          title: values.title.trim(),
          description: values.description.trim(),
          audience: values.audience,
        })
        .eq("id", values.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-notices"] });
      toast.success("Notice updated successfully");
      setShowForm(false);
      setFormValues(defaultFormValues);
      setEditingNotice(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to update notice");
    },
  });

  const deleteNoticeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("notices")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notices"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-notices"] });
      toast.success("Notice deleted successfully");
      setNoticeToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || "Failed to delete notice");
    },
  });

  const filteredNotices = notices?.filter((notice) => {
    const query = searchTerm.toLowerCase();
    return (
      notice.title?.toLowerCase().includes(query) ||
      notice.description?.toLowerCase().includes(query) ||
      notice.audience?.toLowerCase().includes(query)
    );
  });
  const noticePagination = usePaginatedRows(filteredNotices);

  const handleEdit = (notice: any) => {
    setEditingNotice(notice);
    setFormValues({
      title: notice.title,
      description: notice.description,
      audience: notice.audience,
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setNoticeToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingNotice) {
      updateNoticeMut.mutate({ ...formValues, id: editingNotice.id });
    } else {
      createNoticeMut.mutate(formValues);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setFormValues(defaultFormValues);
    setEditingNotice(null);
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        // Show only form when creating/editing
        <EnhancedForm
          title={editingNotice ? "Edit Notice" : "Add Notice"}
          description={editingNotice ? "Update notice information." : "Publish a new announcement for students, teachers, and staff."}
          onSubmit={handleSubmit}
          isLoading={createNoticeMut.isPending || updateNoticeMut.isPending}
          submitText={editingNotice ? "Update Notice" : "Publish Notice"}
          onCancel={handleFormClose}
          submitDisabled={!formValues.title.trim() || !formValues.description.trim()}
          status={createNoticeMut.isError || updateNoticeMut.isError ? "error" : "idle"}
          errorMessage={createNoticeMut.error?.message || updateNoticeMut.error?.message}
        >
          <FormSection title="Notice Details" description="Enter the basic information for your notice">
            <FormFieldGroup>
              <EnhancedInput
                label="Notice Title"
                description="Enter a clear, descriptive title for your notice"
                value={formValues.title}
                onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
                placeholder="e.g., School Holiday Announcement"
                required
                leftIcon={<Megaphone className="h-4 w-4" />}
                tooltip="Make sure your title is clear and attention-grabbing"
              />
              <EnhancedSelect
                label="Target Audience"
                description="Choose who will see this notice"
                value={formValues.audience}
                onValueChange={(value) => setFormValues((prev) => ({ ...prev, audience: value }))}
                options={[
                  { value: "all", label: "All Users" },
                  { value: "students", label: "Students Only" },
                  { value: "teachers", label: "Teachers Only" },
                  { value: "parents", label: "Parents Only" },
                ]}
                required
                leftIcon={<Users className="h-4 w-4" />}
              />
            </FormFieldGroup>
          </FormSection>

          <FormSection title="Notice Content" description="Write the full content of your notice">
            <EnhancedTextarea
              label="Description"
              description="Provide all relevant details and information"
              value={formValues.description}
              onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Enter the full notice content with all relevant details. Include dates, times, locations, and any other important information..."
              required
              showCharCount
              maxLength={1000}
              rows={6}
            />
            <FormHint variant="info">
              Tips for effective notices: Be clear and concise, include all necessary details, and use a professional tone. Your notice will be visible to the selected audience immediately after publishing.
            </FormHint>
          </FormSection>
        </EnhancedForm>
      ) : (
        // Show list view when not creating/editing
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
              <p className="text-muted-foreground">Publish announcements for students, teachers, and staff.</p>
            </div>

            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Notice
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notices..."
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
                        <TableHead>Notice</TableHead>
                        <TableHead>Audience</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {noticePagination.paginatedRows.length > 0 ? (
                        noticePagination.paginatedRows.map((notice) => (
                          <TableRow key={notice.id}>
                            <TableCell>
                              <div className="flex items-start gap-3">
                                <div className="icon-accent mt-1">
                                  <Bell className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium">{notice.title || "Untitled"}</p>
                                  <p className="text-sm text-muted-foreground">{notice.description || "-"}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="capitalize">
                                {notice.audience || "all"}
                              </Badge>
                            </TableCell>
                            <TableCell>{notice.created_at ? new Date(notice.created_at).toLocaleDateString() : "N/A"}</TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="action"
                                  size="icon-sm"
                                  onClick={() => handleEdit(notice)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="action-destructive"
                                  size="icon-sm"
                                  onClick={() => handleDelete(notice.id)}
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
                              icon={Bell}
                              title="No notices found"
                              description="Try a different search or publish a new announcement."
                              action={
                                <Button type="button" size="sm" onClick={() => setShowForm(true)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Notice
                                </Button>
                              }
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  <TablePagination
                    page={noticePagination.page}
                    totalPages={noticePagination.totalPages}
                    totalItems={noticePagination.totalItems}
                    pageSize={noticePagination.pageSize}
                    onPageChange={noticePagination.setPage}
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
        title="Delete Notice"
        description="Are you sure you want to delete this notice? This action cannot be undone."
        confirmText="Delete"
        
        onConfirm={() => noticeToDelete && deleteNoticeMut.mutate(noticeToDelete)}
        
      />
    </div>
  );
}
