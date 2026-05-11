import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePaginatedRows } from '@/lib/usePaginatedRows';
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

type PaymentFormValues = {
  student_id: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
};

const defaultFormValues: PaymentFormValues = {
  student_id: '',
  amount: '',
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: 'cash',
  transaction_id: '',
};

export default function FeePayments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formValues, setFormValues] = useState<PaymentFormValues>(defaultFormValues);
  const queryClient = useQueryClient();

  const { data: students } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_code, profile:profiles(full_name)')
        .order('student_code');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: payments, isLoading } = useQuery({
    queryKey: ['fee-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_payments')
        .select('*, student:students(student_code, profile:profiles(full_name))')
        .order('payment_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const createPaymentMut = useMutation({
    mutationFn: async (values: PaymentFormValues) => {
      const amount = Number(values.amount);

      if (!values.student_id || Number.isNaN(amount) || amount <= 0) {
        throw new Error('Select a student and enter a valid payment amount');
      }

      const { data, error } = await supabase
        .from('fee_payments')
        .insert([
          {
            student_id: values.student_id,
            amount,
            payment_date: new Date(values.payment_date).toISOString(),
            payment_method: values.payment_method,
            transaction_id: values.transaction_id || null,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payments'] });
      toast.success('Payment recorded successfully');
      setIsDialogOpen(false);
      setFormValues(defaultFormValues);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });

  const totalCollected = useMemo(
    () => payments?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0,
    [payments],
  );

  const filteredPayments = payments?.filter((payment) => {
    const query = searchTerm.toLowerCase();
    return (
      payment.student?.student_code?.toLowerCase().includes(query) ||
      payment.student?.profile?.full_name?.toLowerCase().includes(query) ||
      payment.payment_method?.toLowerCase().includes(query) ||
      payment.transaction_id?.toLowerCase().includes(query)
    );
  });
  const paymentPagination = usePaginatedRows(filteredPayments);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fee Payments</h1>
          <p className="text-muted-foreground">Record and review student payment history.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Payment</DialogTitle>
            </DialogHeader>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                createPaymentMut.mutate(formValues);
              }}
            >
              <div className="space-y-2">
                <Label>Student</Label>
                <Select
                  value={formValues.student_id}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, student_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.profile?.full_name || student.student_code || 'Unnamed Student'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payment-amount">Amount</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formValues.amount}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, amount: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment-date">Date</Label>
                  <Input
                    id="payment-date"
                    type="date"
                    value={formValues.payment_date}
                    onChange={(event) => setFormValues((prev) => ({ ...prev, payment_date: event.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Method</Label>
                <Select
                  value={formValues.payment_method}
                  onValueChange={(value) => setFormValues((prev) => ({ ...prev, payment_method: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="transaction-id">Transaction ID</Label>
                <Input
                  id="transaction-id"
                  value={formValues.transaction_id}
                  onChange={(event) => setFormValues((prev) => ({ ...prev, transaction_id: event.target.value }))}
                  placeholder="Optional"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createPaymentMut.isPending}>
                  {createPaymentMut.isPending ? 'Saving...' : 'Save Payment'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-bold">${totalCollected.toLocaleString()}</p>
            </div>
            <Banknote className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search payments..."
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
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentPagination.paginatedRows.length > 0 ? (
                    paymentPagination.paginatedRows.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="font-medium">
                          {payment.student?.profile?.full_name || payment.student?.student_code || 'N/A'}
                        </TableCell>
                        <TableCell>${Number(payment.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'N/A'}
                        </TableCell>
                        <TableCell className="capitalize">{payment.payment_method?.replace('_', ' ') || 'N/A'}</TableCell>
                        <TableCell>{payment.transaction_id || '-'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <EmptyState
                          icon={Banknote}
                          title="No payments found"
                          description="Try a different search or record a new payment."
                          action={
                            <Button type="button" size="sm" onClick={() => setIsDialogOpen(true)}>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Payment
                            </Button>
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                page={paymentPagination.page}
                totalPages={paymentPagination.totalPages}
                totalItems={paymentPagination.totalItems}
                pageSize={paymentPagination.pageSize}
                onPageChange={paymentPagination.setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
