import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePaginatedRows } from '@/lib/usePaginatedRows';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type NoticeFormValues = {
  title: string;
  description: string;
  audience: string;
};

const defaultFormValues: NoticeFormValues = {
  title: '',
  description: '',
  audience: 'all',
};

export default function Notices() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<NoticeFormValues>(defaultFormValues);
  const queryClient = useQueryClient();

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createNoticeMut = useMutation({
    mutationFn: async (values: NoticeFormValues) => {
      if (!values.title.trim() || !values.description.trim()) {
        throw new Error('Title and description are required');
      }

      const { data, error } = await supabase
        .from('notices')
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
      queryClient.invalidateQueries({ queryKey: ['notices'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-notices'] });
      toast.success('Notice published successfully');
      setIsDialogOpen(false);
      setFormValues(defaultFormValues);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to publish notice');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notices</h1>
          <p className="text-muted-foreground">Publish announcements for students, teachers, and staff.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Notice
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Notice</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createNoticeMut.mutate(formValues);
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="notice-title">Title</Label>
                <Input
                  id="notice-title"
                  value={formValues.title}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Annual Sports Day"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notice-description">Description</Label>
                <Input
                  id="notice-description"
                  value={formValues.description}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Short announcement details"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Audience</Label>
                <Select
                  value={formValues.audience}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, audience: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select audience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="teachers">Teachers</SelectItem>
                    <SelectItem value="parents">Parents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createNoticeMut.isPending}>
                  {createNoticeMut.isPending ? 'Publishing...' : 'Publish Notice'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {noticePagination.paginatedRows.length > 0 ? (
                    noticePagination.paginatedRows.map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="mt-1 rounded-full bg-primary/10 p-2">
                              <Bell className="h-4 w-4 text-primary" />
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">{notice.title || 'Untitled notice'}</p>
                              <p className="text-sm text-muted-foreground">{notice.description || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {notice.audience || 'all'}
                          </Badge>
                        </TableCell>
                        <TableCell>{notice.created_at ? new Date(notice.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        <EmptyState
                          icon={Bell}
                          title="No notices found"
                          description="Try a different search or publish a new announcement."
                          action={
                            <Button type="button" size="sm" onClick={() => setIsDialogOpen(true)}>
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
    </div>
  );
}
