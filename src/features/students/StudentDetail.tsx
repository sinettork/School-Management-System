import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, User, Calendar, BookOpen, Award, DollarSign, Mail, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

type StudentDetail = {
  id: string;
  student_code: string;
  gender: string | null;
  dob: string | null;
  address: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  admission_date: string | null;
  status: string;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  class: {
    id: string;
    name: string;
  } | null;
  section: {
    id: string;
    name: string;
  } | null;
};

type AttendanceRecord = {
  id: string;
  attendance_date: string;
  status: string;
  marked_by: string;
  phase: {
    name: string;
  } | null;
};

type ExamResult = {
  id: string;
  marks_obtained: number;
  full_marks: number;
  grade: string;
  remarks: string | null;
  exam: {
    name: string;
    subject: {
      name: string;
    } | null;
  } | null;
  phase: {
    name: string;
  } | null;
};

type FeePayment = {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  transaction_id: string | null;
  phase: {
    name: string;
  } | null;
};

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'results' | 'fees'>('overview');

  const { data: student, isLoading: studentLoading } = useQuery({
    queryKey: ['student-detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Student ID is required');
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          profile:profiles(full_name, email, phone, avatar_url),
          class:classes(id, name),
          section:sections(id, name)
        `)
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data as StudentDetail;
    },
    enabled: !!id
  });

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['student-attendance', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          phase:phases(name)
        `)
        .eq('student_id', id)
        .order('attendance_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: !!id
  });

  const { data: results, isLoading: resultsLoading } = useQuery({
    queryKey: ['student-results', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('exam_results')
        .select(`
          *,
          exam:exams(name, subject:subjects(name)),
          phase:phases(name)
        `)
        .eq('student_id', id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as ExamResult[];
    },
    enabled: !!id
  });

  const { data: fees, isLoading: feesLoading } = useQuery({
    queryKey: ['student-fees', id],
    queryFn: async () => {
      if (!id) return [];
      
      const { data, error } = await supabase
        .from('fee_payments')
        .select(`
          *,
          phase:phases(name)
        `)
        .eq('student_id', id)
        .order('payment_date', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data as FeePayment[];
    },
    enabled: !!id
  });

  if (studentLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Student not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate attendance statistics
  const attendanceStats = attendance ? {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
    percentage: attendance.length > 0 
      ? Math.round((attendance.filter(a => a.status === 'present').length / attendance.length) * 100)
      : 0
  } : { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };

  // Calculate academic statistics
  const academicStats = results ? {
    total: results.length,
    average: results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + (r.marks_obtained / r.full_marks) * 100, 0) / results.length)
      : 0,
    highest: results.length > 0 
      ? Math.max(...results.map(r => (r.marks_obtained / r.full_marks) * 100))
      : 0,
    lowest: results.length > 0 
      ? Math.min(...results.map(r => (r.marks_obtained / r.full_marks) * 100))
      : 0
  } : { total: 0, average: 0, highest: 0, lowest: 0 };

  // Calculate fee statistics
  const feeStats = fees ? {
    total: fees.reduce((sum, f) => sum + Number(f.amount), 0),
    count: fees.length
  } : { total: 0, count: 0 };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'results', label: 'Results', icon: Award },
    { id: 'fees', label: 'Fees', icon: DollarSign },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/students')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Students
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Student Details</h1>
            <p className="text-muted-foreground">
              {student.profile?.full_name} • {student.student_code}
            </p>
          </div>
        </div>
        <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
          {student.status}
        </Badge>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={student.profile?.avatar_url || undefined} />
              <AvatarFallback className="text-xl">
                {student.profile?.full_name?.charAt(0).toUpperCase() || 'S'}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Personal Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{student.profile?.full_name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{student.profile?.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{student.profile?.phone || 'N/A'}</span>
                  </div>
                  {student.dob && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{new Date(student.dob).toLocaleDateString()}</span>
                    </div>
                  )}
                  {student.gender && (
                    <div>Gender: {student.gender}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Academic Information</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{student.class?.name || 'N/A'}</span>
                  </div>
                  {student.section && (
                    <div>Section: {student.section.name}</div>
                  )}
                  <div>Student Code: {student.student_code}</div>
                  {student.admission_date && (
                    <div>Admitted: {new Date(student.admission_date).toLocaleDateString()}</div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Parent Information</h3>
                <div className="space-y-1 text-sm">
                  {student.parent_name && <div>Name: {student.parent_name}</div>}
                  {student.parent_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{student.parent_phone}</span>
                    </div>
                  )}
                  {student.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{student.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2"
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </Button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Attendance Rate</span>
                  <span className="font-semibold">{attendanceStats.percentage}%</span>
                </div>
                <Progress value={attendanceStats.percentage} className="h-2" />
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-semibold text-green-600">{attendanceStats.present}</div>
                    <div className="text-muted-foreground">Present</div>
                  </div>
                  <div>
                    <div className="font-semibold text-red-600">{attendanceStats.absent}</div>
                    <div className="text-muted-foreground">Absent</div>
                  </div>
                  <div>
                    <div className="font-semibold text-yellow-600">{attendanceStats.late}</div>
                    <div className="text-muted-foreground">Late</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Academic Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Score</span>
                  <span className="font-semibold">{academicStats.average}%</span>
                </div>
                <Progress value={academicStats.average} className="h-2" />
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div>
                    <div className="font-semibold text-green-600">{academicStats.highest}%</div>
                    <div className="text-muted-foreground">Highest</div>
                  </div>
                  <div>
                    <div className="font-semibold text-red-600">{academicStats.lowest}%</div>
                    <div className="text-muted-foreground">Lowest</div>
                  </div>
                </div>
                <div className="text-center text-sm">
                  <div className="font-semibold">{academicStats.total}</div>
                  <div className="text-muted-foreground">Total Results</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fee Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="font-semibold text-lg">${feeStats.total.toLocaleString()}</div>
                  <div className="text-muted-foreground">Total Paid</div>
                </div>
                <div className="text-center text-sm">
                  <div className="font-semibold">{feeStats.count}</div>
                  <div className="text-muted-foreground">Payments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'attendance' && (
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
            <CardDescription>Recent attendance history</CardDescription>
          </CardHeader>
          <CardContent>
            {attendanceLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : attendance && attendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Marked By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{new Date(record.attendance_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={
                          record.status === 'present' ? 'default' :
                          record.status === 'absent' ? 'destructive' : 'secondary'
                        }>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.phase?.name || 'N/A'}</TableCell>
                      <TableCell>{record.marked_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No attendance records found</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'results' && (
        <Card>
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
            <CardDescription>Academic performance history</CardDescription>
          </CardHeader>
          <CardContent>
            {resultsLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
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
                    <TableHead>Phase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => {
                    const percentage = Math.round((result.marks_obtained / result.full_marks) * 100);
                    return (
                      <TableRow key={result.id}>
                        <TableCell className="font-medium">{result.exam?.name || 'N/A'}</TableCell>
                        <TableCell>{result.exam?.subject?.name || 'N/A'}</TableCell>
                        <TableCell>{result.marks_obtained}/{result.full_marks}</TableCell>
                        <TableCell>{percentage}%</TableCell>
                        <TableCell>
                          <Badge variant={
                            percentage >= 70 ? 'default' :
                            percentage >= 50 ? 'secondary' : 'destructive'
                          }>
                            {result.grade || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>{result.phase?.name || 'N/A'}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No exam results found</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'fees' && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Payments</CardTitle>
            <CardDescription>Payment history</CardDescription>
          </CardHeader>
          <CardContent>
            {feesLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
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
                    <TableHead>Phase</TableHead>
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
                      <TableCell>{payment.phase?.name || 'N/A'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No fee payments found</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
