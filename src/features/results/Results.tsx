import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, Pencil, Trash2, Award } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { usePaginatedRows } from '@/lib/usePaginatedRows';

const resultSchema = z.object({
  exam_id: z.string().min(1, 'Exam is required'),
  student_id: z.string().min(1, 'Student is required'),
  subject_id: z.string().min(1, 'Subject is required'),
  marks_obtained: z.coerce.number().min(0, 'Marks must be 0 or more'),
  full_marks: z.coerce.number().min(1, 'Full marks must be at least 1'),
  grade: z.string().optional(),
  remarks: z.string().optional(),
});

type ResultFormValues = z.infer<typeof resultSchema>;
type ResultRow = {
  id: string;
  exam_id: string | null;
  student_id: string | null;
  subject_id: string | null;
  marks_obtained: number | null;
  full_marks: number | null;
  grade: string | null;
  remarks: string | null;
  exam: {
    name: string | null;
  } | null;
  student: {
    student_code: string | null;
    profile: {
      full_name: string | null;
    } | null;
  } | null;
  subject: {
    name: string;
    code: string | null;
  } | null;
};

function calculateGrade(obtained: number, full: number): string {
  if (full <= 0) return 'F';
  const pct = (obtained / full) * 100;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'F';
}

export default function Results() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<ResultRow | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<ResultFormValues>({
    resolver: zodResolver(resultSchema) as Resolver<ResultFormValues>,
    defaultValues: {
      exam_id: '',
      student_id: '',
      subject_id: '',
      marks_obtained: 0,
      full_marks: 100,
      grade: '',
      remarks: '',
    },
  });

  const { data: results, isLoading } = useQuery({
    queryKey: ['exam-results'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          exam:exams(name),
          student:students(student_code, profile:profiles(full_name)),
          subject:subjects(name, code)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: exams } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exams').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_code, profile:profiles(full_name)')
        .order('student_code');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase.from('subjects').select('id, name, code').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const createResultMut = useMutation({
    mutationFn: async (values: ResultFormValues) => {
      const grade = values.grade || calculateGrade(values.marks_obtained, values.full_marks);
      const { data, error } = await supabase
        .from('exam_results')
        .insert([{
          exam_id: values.exam_id,
          student_id: values.student_id,
          subject_id: values.subject_id,
          marks_obtained: values.marks_obtained,
          full_marks: values.full_marks,
          grade,
          remarks: values.remarks || null,
        }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results'] });
      toast.success('Result recorded successfully');
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to record result');
    }
  });

  const updateResultMut = useMutation({
    mutationFn: async (values: ResultFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const grade = updateData.grade || calculateGrade(updateData.marks_obtained, updateData.full_marks);
      const { data, error } = await supabase
        .from('exam_results')
        .update({
          exam_id: updateData.exam_id,
          student_id: updateData.student_id,
          subject_id: updateData.subject_id,
          marks_obtained: updateData.marks_obtained,
          full_marks: updateData.full_marks,
          grade,
          remarks: updateData.remarks || null,
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results'] });
      toast.success('Result updated successfully');
      setIsEditDialogOpen(false);
      setEditingResult(null);
      form.reset();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update result');
    }
  });

  const deleteResultMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exam_results').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam-results'] });
      toast.success('Result deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to delete result');
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
      exam_id: result.exam_id || '',
      student_id: result.student_id || '',
      subject_id: result.subject_id || '',
      marks_obtained: result.marks_obtained || 0,
      full_marks: result.full_marks || 100,
      grade: result.grade || '',
      remarks: result.remarks || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const filteredResults = results?.filter(result =>
    result.student?.student_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.student?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    result.exam?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const resultPagination = usePaginatedRows(filteredResults);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Results</h1>
          <p className="text-muted-foreground">Manage exam results and grades.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Result
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Result</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="exam_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an exam" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exams?.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
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
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.profile?.full_name || s.student_code}
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
                  name="subject_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} {s.code ? `(${s.code})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marks_obtained"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks Obtained</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="full_marks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Marks</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-calculated if left blank" {...field} />
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
                        <Input placeholder="e.g., Excellent performance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createResultMut.isPending}>
                    {createResultMut.isPending ? 'Saving...' : 'Save Result'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Result</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="exam_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an exam" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {exams?.map((e) => (
                            <SelectItem key={e.id} value={e.id}>
                              {e.name}
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
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.profile?.full_name || s.student_code}
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
                  name="subject_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} {s.code ? `(${s.code})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="marks_obtained"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Marks Obtained</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="full_marks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Marks</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Grade (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Auto-calculated if left blank" {...field} />
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
                        <Input placeholder="e.g., Excellent performance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end pt-4">
                  <Button type="button" variant="outline" className="mr-2" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateResultMut.isPending}>
                    {updateResultMut.isPending ? 'Updating...' : 'Update Result'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <ConfirmDialog
          open={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          title="Delete Result"
          description="Are you sure you want to delete this result? This action cannot be undone."
          isPending={deleteResultMut.isPending}
          onConfirm={() => deleteId && deleteResultMut.mutate(deleteId)}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search results..."
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
                    <TableHead>Exam</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultPagination.paginatedRows.length > 0 ? (
                    resultPagination.paginatedRows.map((result) => (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.exam?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {result.student?.profile?.full_name || result.student?.student_code || 'N/A'}
                        </TableCell>
                        <TableCell>{result.subject?.name || 'N/A'}</TableCell>
                        <TableCell>
                          {result.marks_obtained ?? '-'}/{result.full_marks ?? '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={result.grade === 'F' ? 'destructive' : 'default'}>
                            {result.grade || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(result)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => openDeleteDialog(result.id)}>
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
                          icon={Award}
                          title="No results found"
                          description="Try a different search or add a new result."
                          action={
                            <Button type="button" size="sm" onClick={() => setIsDialogOpen(true)}>
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
    </div>
  );
}
