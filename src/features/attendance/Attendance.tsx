import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Save, CalendarDays, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/app/providers/AuthProvider';

type AttendanceStatus = 'present' | 'absent' | 'late' | '';

export default function Attendance() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('classes').select('id, name').order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      const { data, error } = await supabase
        .from('students')
        .select('id, student_code, profile:profiles(full_name)')
        .eq('class_id', selectedClass)
        .order('student_code');
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass,
  });

  const { data: existingAttendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['attendance', selectedClass, selectedDate],
    queryFn: async () => {
      if (!selectedClass || !selectedDate) return [];
      const { data, error } = await supabase
        .from('attendance')
        .select('student_id, status')
        .eq('class_id', selectedClass)
        .eq('attendance_date', selectedDate);
      if (error) throw error;
      return data || [];
    },
    enabled: !!selectedClass && !!selectedDate,
  });

  useEffect(() => {
    if (existingAttendance) {
      const map: Record<string, AttendanceStatus> = {};
      existingAttendance.forEach((record) => {
        if (record.student_id) {
          map[record.student_id] = (record.status as AttendanceStatus) || '';
        }
      });
      setAttendanceMap(map);
      setHasChanges(false);
    }
  }, [existingAttendance]);

  const saveAttendanceMut = useMutation({
    mutationFn: async () => {
      if (!selectedClass || !selectedDate || !user) return;

      const records = Object.entries(attendanceMap)
        .filter(([, status]) => status !== '')
        .map(([student_id, status]) => ({
          student_id,
          class_id: selectedClass,
          attendance_date: selectedDate,
          status,
          marked_by: user.id,
        }));

      if (records.length === 0) {
        throw new Error('No attendance records to save');
      }

      const { error } = await supabase
        .from('attendance')
        .upsert(records, { onConflict: 'student_id,attendance_date' });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance', selectedClass, selectedDate] });
      toast.success('Attendance saved successfully');
      setHasChanges(false);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to save attendance');
    }
  });

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
    setHasChanges(true);
  };

  const isLoading = studentsLoading || attendanceLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground">Mark daily attendance for students.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              {classesLoading ? (
                <Skeleton className="h-9 w-[200px]" />
              ) : (
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setHasChanges(false);
                }}
                className="w-auto"
              />
            </div>
            {hasChanges && (
              <Button onClick={() => saveAttendanceMut.mutate()} disabled={saveAttendanceMut.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {saveAttendanceMut.isPending ? 'Saving...' : 'Save Attendance'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!selectedClass ? (
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              Please select a class to view students.
            </div>
          ) : isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : students && students.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="w-[300px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => {
                    const status = attendanceMap[student.id] || '';
                    return (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.student_code || 'N/A'}</TableCell>
                        <TableCell>{student.profile?.full_name || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant={status === 'present' ? 'default' : 'outline'}
                              className={status === 'present' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                              onClick={() => handleStatusChange(student.id, 'present')}
                            >
                              Present
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={status === 'absent' ? 'default' : 'outline'}
                              className={status === 'absent' ? 'bg-rose-600 hover:bg-rose-700' : ''}
                              onClick={() => handleStatusChange(student.id, 'absent')}
                            >
                              Absent
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant={status === 'late' ? 'default' : 'outline'}
                              className={status === 'late' ? 'bg-amber-600 hover:bg-amber-700' : ''}
                              onClick={() => handleStatusChange(student.id, 'late')}
                            >
                              Late
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-24 flex items-center justify-center text-muted-foreground">
              No students found in this class.
            </div>
          )}
        </CardContent>
      </Card>

      {selectedClass && students && students.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {Object.values(attendanceMap).filter((s) => s === 'present').length}
                </p>
              </div>
              <Badge className="bg-emerald-600/10 text-emerald-700">P</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-2xl font-bold text-rose-600">
                  {Object.values(attendanceMap).filter((s) => s === 'absent').length}
                </p>
              </div>
              <Badge className="bg-rose-600/10 text-rose-700">A</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Late</p>
                <p className="text-2xl font-bold text-amber-600">
                  {Object.values(attendanceMap).filter((s) => s === 'late').length}
                </p>
              </div>
              <Badge className="bg-amber-600/10 text-amber-700">L</Badge>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
