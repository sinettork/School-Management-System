import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Plus, Search, Edit, Trash2, User, DollarSign, Calendar, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePaginatedRows } from '@/lib/usePaginatedRows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EnhancedForm, FormSection, FormFieldGroup, FormHint } from '@/components/ui/enhanced-form';
import { EnhancedInput, EnhancedSelect, EnhancedDatePicker } from '@/components/ui/form-input';
import { PhaseSelector } from '@/components/ui/phase-selector';

type PaymentFormValues = {
  student_id: string;
  amount: string;
  payment_date: string;
  payment_method: string;
  transaction_id: string;
  phase_id: string;
};

const defaultFormValues: PaymentFormValues = {
  student_id: '',
  amount: '',
  payment_date: new Date().toISOString().slice(0, 10),
  payment_method: 'cash',
  transaction_id: '',
  phase_id: '',
};

export default function FeePayments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<PaymentFormValues>(defaultFormValues);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
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

      if (!values.student_id || Number.isNaN(amount) || amount <= 0 || !values.phase_id) {
        throw new Error('Select a student, enter a valid payment amount, and select an academic phase');
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
            phase_id: values.phase_id,
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
      setShowForm(false);
      setFormValues(defaultFormValues);
      setEditingPayment(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to record payment');
    },
  });

  const updatePaymentMut = useMutation({
    mutationFn: async (values: PaymentFormValues & { id: string }) => {
      const amount = Number(values.amount);

      if (!values.student_id || Number.isNaN(amount) || amount <= 0 || !values.phase_id) {
        throw new Error('Select a student, enter a valid payment amount, and select an academic phase');
      }

      const { data, error } = await supabase
        .from('fee_payments')
        .update({
          student_id: values.student_id,
          amount,
          payment_date: new Date(values.payment_date).toISOString(),
          payment_method: values.payment_method,
          transaction_id: values.transaction_id || null,
          phase_id: values.phase_id,
        })
        .eq('id', values.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payments'] });
      toast.success('Payment updated successfully');
      setShowForm(false);
      setFormValues(defaultFormValues);
      setEditingPayment(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update payment');
    },
  });

  const deletePaymentMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fee_payments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-payments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-payments'] });
      toast.success('Payment deleted successfully');
      setPaymentToDelete(null);
      setDeleteConfirmOpen(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to delete payment');
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

  const handleEdit = (payment: any) => {
    setEditingPayment(payment);
    setFormValues({
      student_id: payment.student_id,
      amount: payment.amount.toString(),
      payment_date: new Date(payment.payment_date).toISOString().slice(0, 10),
      payment_method: payment.payment_method,
      transaction_id: payment.transaction_id || '',
      phase_id: payment.phase_id || '',
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setPaymentToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (editingPayment) {
      updatePaymentMut.mutate({ ...formValues, id: editingPayment.id });
    } else {
      createPaymentMut.mutate(formValues);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setFormValues(defaultFormValues);
    setEditingPayment(null);
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        // Show only form when creating/editing
        <EnhancedForm
          title={editingPayment ? 'Edit Payment' : 'Add Payment'}
          description={editingPayment ? 'Update payment information.' : 'Record a new student payment.'}
          onSubmit={handleSubmit}
          isLoading={createPaymentMut.isPending || updatePaymentMut.isPending}
          submitText={editingPayment ? 'Update Payment' : 'Save Payment'}
          onCancel={handleFormClose}
          submitDisabled={!formValues.student_id || !formValues.amount || Number.isNaN(Number(formValues.amount)) || Number(formValues.amount) <= 0 || !formValues.phase_id}
          status={createPaymentMut.isError || updatePaymentMut.isError ? "error" : "idle"}
          errorMessage={createPaymentMut.error?.message || updatePaymentMut.error?.message}
        >
          <FormSection title="Payment Details" description="Enter the basic payment information">
            <FormFieldGroup columns={2}>
              <EnhancedSelect
                label="Student"
                description="Select the student making the payment"
                value={formValues.student_id}
                onValueChange={(value) => setFormValues((prev) => ({ ...prev, student_id: value }))}
                options={students?.map((student) => ({
                  value: student.id,
                  label: student.profile?.full_name || 'Unnamed Student',
                })) || []}
                required
                leftIcon={<User className="h-4 w-4" />}
                tooltip="Start typing to search for a student"
              />
              <EnhancedInput
                label="Amount ($)"
                description="Enter the payment amount"
                type="number"
                min="0"
                step="0.01"
                value={formValues.amount}
                onChange={(event) => setFormValues((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="0.00"
                required
                leftIcon={<DollarSign className="h-4 w-4" />}
                tooltip="Enter the exact amount received"
              />
            </FormFieldGroup>
          </FormSection>

          <FormSection title="Payment Information" description="Provide additional payment details">
            <FormFieldGroup>
              <PhaseSelector
                value={formValues.phase_id}
                onValueChange={(value) => setFormValues((prev) => ({ ...prev, phase_id: value }))}
                label="Academic Phase"
                description="Select the academic phase for this payment"
                required
              />
            </FormFieldGroup>
            <FormFieldGroup columns={2}>
              <EnhancedDatePicker
                label="Payment Date"
                description="Select when the payment was made"
                value={formValues.payment_date}
                onChange={(value) => setFormValues((prev) => ({ ...prev, payment_date: value }))}
                required
                leftIcon={<Calendar className="h-4 w-4" />}
              />
              <EnhancedSelect
                label="Payment Method"
                description="Choose how the payment was made"
                value={formValues.payment_method}
                onValueChange={(value) => setFormValues((prev) => ({ ...prev, payment_method: value }))}
                options={[
                  { value: 'cash', label: 'Cash' },
                  { value: 'bank_transfer', label: 'Bank Transfer' },
                  { value: 'card', label: 'Credit/Debit Card' },
                  { value: 'mobile_money', label: 'Mobile Money' },
                ]}
                required
                leftIcon={<CreditCard className="h-4 w-4" />}
              />
            </FormFieldGroup>
            
            <EnhancedInput
              label="Transaction ID"
              description="Reference number for tracking (optional)"
              value={formValues.transaction_id}
              onChange={(event) => setFormValues((prev) => ({ ...prev, transaction_id: event.target.value }))}
              placeholder="Enter transaction reference number"
              tooltip="Leave empty if not applicable"
            />
            
            <FormHint variant="info">
              Payment records are automatically added to the student's fee history. Make sure all information is accurate before submitting.
            </FormHint>
          </FormSection>
        </EnhancedForm>
      ) : (
        // Show list view when not creating/editing
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Fee Payments</h1>
              <p className="text-muted-foreground">Record and review student payment history.</p>
            </div>

            <Button onClick={() => setShowForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Payment
              </Button>
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
                        <TableHead className="w-[100px]">Actions</TableHead>
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
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="action"
                                  size="icon-sm"
                                  onClick={() => handleEdit(payment)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="action-destructive"
                                  size="icon-sm"
                                  onClick={() => handleDelete(payment.id)}
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
                              icon={Banknote}
                              title="No payments found"
                              description="Try a different search or record a new payment."
                              action={
                                <Button type="button" size="sm" onClick={() => setShowForm(true)}>
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
        </>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Payment"
        description="Are you sure you want to delete this payment record? This action cannot be undone."
        confirmText="Delete"
        
        onConfirm={() => paymentToDelete && deletePaymentMut.mutate(paymentToDelete)}
        
      />
    </div>
  );
}
