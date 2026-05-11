import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { usePaginatedRows } from '@/lib/usePaginatedRows';

const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  numeric_level: z.coerce.number().min(1, 'Must be a positive number').optional(),
});

type ClassFormValues = z.infer<typeof classSchema>;
type ClassRow = {
  id: string;
  name: string;
  numeric_level: number | null;
};

export default function Classes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema) as Resolver<ClassFormValues>,
    defaultValues: {
      name: '',
      numeric_level: 1,
    },
  });

  const { data: classes, isLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('numeric_level', { ascending: true });
      
      if (error) throw error;
      return data || [];
    }
  });

  const createClassMut = useMutation({
    mutationFn: async (values: ClassFormValues) => {
      const { data, error } = await supabase
        .from('classes')
        .insert([{
          name: values.name,
          numeric_level: values.numeric_level,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class created successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to create class');
    }
  });

  const updateClassMut = useMutation({
    mutationFn: async (values: ClassFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const { data, error } = await supabase
        .from('classes')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class updated successfully');
      setIsEditDialogOpen(false);
      setEditingClass(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update class');
    }
  });

  const deleteClassMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classes'] });
      toast.success('Class deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to delete class');
    }
  });

  const onSubmit = (values: ClassFormValues) => {
    createClassMut.mutate(values);
  };

  const onEditSubmit = (values: ClassFormValues) => {
    if (editingClass) {
      updateClassMut.mutate({ ...values, id: editingClass.id });
    }
  };

  const openEditDialog = (c: ClassRow) => {
    setEditingClass(c);
    form.reset({
      name: c.name || '',
      numeric_level: c.numeric_level || 1,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const filteredClasses = classes?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const classPagination = usePaginatedRows(filteredClasses);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes</h1>
          <p className="text-muted-foreground">Manage school classes and levels.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
              <Plus className="mr-2 h-4 w-4" />
              Add Class
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Grade 10 A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeric_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numeric Level</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createClassMut.isPending}>
                    {createClassMut.isPending ? 'Saving...' : 'Save Class'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Class</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Grade 10 A" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="numeric_level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numeric Level</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateClassMut.isPending}>
                    {updateClassMut.isPending ? 'Updating...' : 'Update Class'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Class"
          description="Are you sure you want to delete this class? This action cannot be undone."
          isPending={deleteClassMut.isPending}
          onConfirm={() => deleteId && deleteClassMut.mutate(deleteId)}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search classes..."
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
                    <TableHead>Class Name</TableHead>
                    <TableHead>Numeric Level</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classPagination.paginatedRows.length > 0 ? (
                    classPagination.paginatedRows.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell>{c.numeric_level || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(c)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(c.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <EmptyState
                          icon={BookOpen}
                          title="No classes found"
                          description="Try a different search or add a new class."
                          action={
                            <Button type="button" size="sm" onClick={() => setIsDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Class
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={classPagination.page}
                totalPages={classPagination.totalPages}
                totalItems={classPagination.totalItems}
                pageSize={classPagination.pageSize}
                onPageChange={classPagination.setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
