import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, GraduationCap, DollarSign, BookOpen, Bell } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useMemo } from 'react';

export default function Dashboard() {
  const { data: counts } = useQuery({
    queryKey: ['dashboard-counts'],
    queryFn: async () => {
      const [studentsRes, teachersRes, classesRes, paymentsRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('teachers').select('*', { count: 'exact', head: true }),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('fee_payments').select('amount'),
      ]);
      return {
        students: studentsRes.count || 0,
        teachers: teachersRes.count || 0,
        classes: classesRes.count || 0,
        fees: paymentsRes.data?.reduce((sum, payment) => sum + Number(payment.amount || 0), 0) || 0,
      };
    }
  });

  const { data: payments } = useQuery({
    queryKey: ['dashboard-payments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fee_payments')
        .select('amount, payment_date')
        .order('payment_date', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: notices } = useQuery({
    queryKey: ['dashboard-notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  const chartData = useMemo(() => {
    const monthMap = new Map<string, number>();
    const formatter = new Intl.DateTimeFormat('en', { month: 'short' });
    const today = new Date();

    for (let index = 5; index >= 0; index -= 1) {
      const date = new Date(today.getFullYear(), today.getMonth() - index, 1);
      monthMap.set(formatter.format(date), 0);
    }

    payments?.forEach((payment) => {
      if (!payment.payment_date) return;
      const date = new Date(payment.payment_date);
      const key = formatter.format(date);
      if (monthMap.has(key)) {
        monthMap.set(key, (monthMap.get(key) || 0) + Number(payment.amount || 0));
      }
    });

    return Array.from(monthMap.entries()).map(([name, revenue]) => ({ name, revenue }));
  }, [payments]);

  const stats = [
    { title: 'Total Students', value: counts?.students ?? '-', icon: Users, description: 'Active enrollments' },
    { title: 'Active Teachers', value: counts?.teachers ?? '-', icon: GraduationCap, description: 'Current academic staff' },
    { title: 'Total Classes', value: counts?.classes ?? '-', icon: BookOpen, description: 'Registered classes' },
    { title: 'Fees Collected', value: counts ? `$${counts.fees.toLocaleString()}` : '-', icon: DollarSign, description: 'Recorded payments' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Overview of school metrics and performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Fee Collections</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="revenue" fill="var(--color-primary)" radius={[4, 4, 0, 0]} className="fill-primary" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
          </CardHeader>
          <CardContent>
            {notices && notices.length > 0 ? (
              <div className="space-y-6">
                {notices.map((notice) => (
                  <div key={notice.id} className="flex items-start">
                    <div className="bg-primary/10 p-2 rounded-full mr-4">
                      <Bell className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{notice.title || 'Untitled notice'}</p>
                      <p className="text-sm text-muted-foreground">{notice.description || '-'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                No notices published yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
