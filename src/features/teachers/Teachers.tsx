import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { usePaginatedRows } from '@/lib/usePaginatedRows';

const teacherSchema = z.object({
  profile_id: z.string().min(1, 'Profile is required'),
  employee_code: z.string().min(1, 'Employee code is required'),
  qualification: z.string().min(1, 'Qualification is required'),
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
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      profile_id: '',
      employee_code: '',
      qualification: '',
    },
  });

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          *,
          profile:profiles(full_name, email, phone)
        `);
      return data || [];
    }
  });

  const { data: availableProfiles } = useQuery({
    queryKey: ['teacher-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'teacher');
      if (error) throw error;
      return data || [];
    }
  });

  const createTeacherMut = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      const { data, error } = await supabase
        .from('teachers')
        .insert([{
            profile_id: values.profile_id,
            employee_code: values.employee_code,
            qualification: values.qualification,
            joining_date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher added successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to add teacher');
    }
  });

  const updateTeacherMut = useMutation({
    mutationFn: async (values: TeacherFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const { data, error } = await supabase
        .from('teachers')
        .update({ ...updateData, joining_date: new Date().toISOString().split('T')[0] })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher updated successfully');
      setIsEditDialogOpen(false);
      setEditingTeacher(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update teacher');
    }
  });

  const deleteTeacherMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teachers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success('Teacher deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to delete teacher');
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
      profile_id: teacher.profile_id || '',
      employee_code: teacher.employee_code || '',
      qualification: teacher.qualification || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const filteredTeachers = teachers?.filter(teacher => 
    teacher.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const teacherPagination = usePaginatedRows(filteredTeachers);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground">Manage teaching staff records.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="profile_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Profile</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableProfiles?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.full_name || p.email || 'Unnamed User'}
                            </SelectItem>
                          ))}
                          {(!availableProfiles || availableProfiles.length === 0) && (
                            <SelectItem value="none" disabled>No teacher profiles available</SelectItem>
                          )}
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
                      <FormLabel>Employee Code</FormLabel>
                      <FormControl>
                        <Input placeholder="TCH001" {...field} />
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
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="M.Sc. Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTeacherMut.isPending}>
                    {createTeacherMut.isPending ? 'Saving...' : 'Save Teacher'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Teacher</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="profile_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Profile</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableProfiles?.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.full_name || p.email || 'Unnamed User'}
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
                      <FormLabel>Employee Code</FormLabel>
                      <FormControl>
                        <Input placeholder="TCH001" {...field} />
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
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="M.Sc. Mathematics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateTeacherMut.isPending}>
                    {updateTeacherMut.isPending ? 'Updating...' : 'Update Teacher'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Teacher"
          description="Are you sure you want to delete this teacher? This action cannot be undone."
          isPending={deleteTeacherMut.isPending}
          onConfirm={() => deleteId && deleteTeacherMut.mutate(deleteId)}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teachers..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Joining Date</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teacherPagination.paginatedRows.length > 0 ? (
                    teacherPagination.paginatedRows.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell className="font-medium">{teacher.employee_code}</TableCell>
                        <TableCell>{teacher.profile?.full_name || 'N/A'}</TableCell>
                        <TableCell>{teacher.profile?.email || 'N/A'}</TableCell>
                        <TableCell>{teacher.qualification || 'N/A'}</TableCell>
                        <TableCell>{teacher.joining_date || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(teacher)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(teacher.id)}>
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
                          icon={GraduationCap}
                          title="No teachers found"
                          description="Try a different search or add a new teacher profile."
                          action={
                            <Button type="button" size="sm" onClick={() => setIsDialogOpen(true)}>
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
    </div>
  );
}
