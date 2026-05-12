import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { User, Calendar, Award, DollarSign, BookOpen, AlertCircle, TrendingUp, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type ParentStudent = {
  id: string;
  student_code: string;
  full_name: string;
  class: string;
  section: string;
  status: string;
  avatar_url: string | null;
};

type StudentResult = {
  id: string;
  exam_name: string;
  subject_name: string;
  marks_obtained: number;
  full_marks: number;
  grade: string;
  percentage: number;
  exam_date: string;
};

type StudentAttendance = {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  phase_name: string;
};

type StudentFee = {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  phase_name: string;
  transaction_id: string | null;
};

type StudentNotice = {
  id: string;
  title: string;
  description: string;
  audience: string;
  created_at: string;
  priority: 'high' | 'medium' | 'low';
};

export default function ParentDashboard() {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  // Get parent's students
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['parent-students'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Get parent's profile to find linked students
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) throw new Error('Profile not found');

      // Get students linked to this parent
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          student_code,
          profile:profiles(full_name, avatar_url),
          class:classes(name),
          section:sections(name),
          status
        `)
        .eq('parent_phone', (await supabase.from('profiles').select('phone').eq('id', user.id).single()).data?.phone)
        .eq('status', 'active');

      if (error) throw error;

      return data?.map(student => ({
        id: student.id,
        student_code: student.student_code,
        full_name: student.profile?.full_name || 'N/A',
        class: student.class?.name || 'N/A',
        section: student.section?.name || 'N/A',
        status: student.status,
        avatar_url: student.profile?.avatar_url,
      })) || [];
    }
  });

  // Get selected student's results
  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['student-results', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];

      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          id,
          marks_obtained,
          full_marks,
          grade,
          exam:exams(name, start_date),
          subject:subjects(name),
          phase:phases(name)
        `)
        .eq('student_id', selectedStudent)
        .order('exam->start_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data?.map(result => ({
        id: result.id,
        exam_name: result.exam?.name || 'N/A',
        subject_name: result.subject?.name || 'N/A',
        marks_obtained: result.marks_obtained,
        full_marks: result.full_marks,
        grade: result.grade,
        percentage: Math.round((result.marks_obtained / result.full_marks) * 100),
        exam_date: result.exam?.start_date || '',
      })) || [];
    },
    enabled: !!selectedStudent
  });

  // Get selected student's attendance
  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];

      const { data, error } = await supabase
        .from('attendance')
        .select(`
          id,
          attendance_date,
          status,
          phase:phases(name)
        `)
        .eq('student_id', selectedStudent)
        .order('attendance_date', { ascending: false })
        .limit(30);

      if (error) throw error;

      return data?.map(record => ({
        id: record.id,
        date: record.attendance_date,
        status: record.status,
        phase_name: record.phase?.name || 'N/A',
      })) || [];
    },
    enabled: !!selectedStudent
  });

  // Get selected student's fee payments
  const { data: fees, isLoading: feesLoading } = useQuery({
    queryKey: ['student-fees', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];

      const { data, error } = await supabase
        .from('fee_payments')
        .select(`
          id,
          amount,
          payment_date,
          payment_method,
          transaction_id,
          phase:phases(name)
        `)
        .eq('student_id', selectedStudent)
        .order('payment_date', { ascending: false })
        .limit(10);

      if (error) throw error;

      return data || [];
    },
    enabled: !!selectedStudent
  });

  // Get relevant notices for parents
  const { data: notices, isLoading: noticesLoading } = useQuery({
    queryKey: ['parent-notices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .or('audience.eq.all,audience.eq.parents')
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      return data || [];
    }
  });

  // Calculate statistics for selected student
  const calculateStats = () => {
    if (!selectedStudent || !results || !attendance) return null;

    const attendanceStats = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'present').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      late: attendance.filter(a => a.status === 'late').length,
      percentage: attendance.length > 0 
        ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
        : 0
    };

    const academicStats = {
      total: results.length,
      average: results.length > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.percentage, 0) / results.length)
        : 0,
      highest: results.length > 0 
        ? Math.max(...results.map(r => r.percentage))
        : 0,
      lowest: results.length > 0 
        ? Math.min(...results.map(r => r.percentage))
        : 0
    };

    const feeStats = {
      total: fees?.reduce((sum, f) => sum + Number(f.amount), 0) || 0,
      count: fees?.length || 0
    };

    return { attendanceStats, academicStats, feeStats };
  };

  const stats = calculateStats();

  if (studentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Parent Dashboard</h1>
          <p className="text-muted-foreground">Monitor your children's academic progress</p>
        </div>
        <Badge variant="outline" className="text-sm">
          Parent Portal
        </Badge>
      </div>

      {/* Student Selection */}
      {students && students.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Student
            </CardTitle>
            <CardDescription>Choose which student's information to view</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedStudent === student.id 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedStudent(student.id)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar_url || undefined} />
                      <AvatarFallback>
                        {student.full_name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{student.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {student.class} {student.section && `• ${student.section}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{student.student_code}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {students && students.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No students are currently linked to your account. Please contact the school administration to link your children.
          </AlertDescription>
        </Alert>
      )}

      {/* Student Details */}
      {selectedStudent && stats && (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academics">Academics</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="fees">Fees</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.attendanceStats.percentage}%</div>
                  <Progress value={stats.attendanceStats.percentage} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.attendanceStats.present} present, {stats.attendanceStats.absent} absent
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.academicStats.average}%</div>
                  <Progress value={stats.academicStats.average} className="mt-2" />
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.academicStats.total} results recorded
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Fees Paid</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.feeStats.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stats.feeStats.count} payments
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Notices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Recent Notices
                </CardTitle>
              </CardHeader>
              <CardContent>
                {noticesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : notices && notices.length > 0 ? (
                  <div className="space-y-4">
                    {notices.map((notice) => (
                      <div key={notice.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium">{notice.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notice.description}
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-4">
                            {new Date(notice.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No notices available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="academics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Recent Results
                </CardTitle>
                <CardDescription>Latest exam performance</CardDescription>
              </CardHeader>
              <CardContent>
                {resultsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : results && results.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Exam</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead>Grade</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {results.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">{result.exam_name}</TableCell>
                          <TableCell>{result.subject_name}</TableCell>
                          <TableCell>{result.marks_obtained}/{result.full_marks}</TableCell>
                          <TableCell>{result.percentage}%</TableCell>
                          <TableCell>
                            <Badge variant={
                              result.percentage >= 70 ? 'default' :
                              result.percentage >= 50 ? 'secondary' : 'destructive'
                            }>
                              {result.grade}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No results available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Attendance History
                </CardTitle>
                <CardDescription>Recent attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                {attendanceLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : attendance && attendance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Phase</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attendance.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={
                              record.status === 'present' ? 'default' :
                              record.status === 'absent' ? 'destructive' : 'secondary'
                            }>
                              {record.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.phase_name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No attendance records available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fees">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Fee Payment History
                </CardTitle>
                <CardDescription>Recent fee payments</CardDescription>
              </CardHeader>
              <CardContent>
                {feesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : fees && fees.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Transaction ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fees.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">${Number(payment.amount).toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_method}</Badge>
                          </TableCell>
                          <TableCell>{payment.transaction_id || 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No fee payments available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
