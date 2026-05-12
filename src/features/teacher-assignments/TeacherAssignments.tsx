import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Search, Edit, Trash2, Calendar, BookOpen, GraduationCap, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { usePaginatedRows } from '@/lib/usePaginatedRows';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/EmptyState';
import { TablePagination } from '@/components/shared/TablePagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Skeleton } from '@/components/ui/skeleton';

type TeacherAssignment = {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  phase_id: string;
  is_active: boolean;
  assigned_at: string;
  assigned_by: string;
  teacher: {
    id: string;
    profile: {
      full_name: string | null;
      email: string | null;
    } | null;
    employee_code: string | null;
  } | null;
  class: {
    id: string;
    name: string;
  } | null;
  subject: {
    id: string;
    name: string;
  } | null;
  academic_year: {
    id: string;
    name: string;
    is_active: boolean;
  } | null;
  phase: {
    id: string;
    name: string;
    phase_type: string;
    status: string;
  } | null;
};

type AssignmentFormValues = {
  teacher_id: string;
  class_id: string;
  subject_id: string;
  academic_year_id: string;
  phase_id: string;
};

export default function TeacherAssignments() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: assignments, isLoading } = useQuery({
    queryKey: ['teacher-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .select(`
          *,
          teacher:teachers(
            profile:profiles(full_name, email),
            employee_code
          ),
          class:classes(id, name),
          subject:subjects(id, name),
          academic_year:academic_years(id, name, is_active),
          phase:phases(id, name, phase_type, status)
        `)
        .order('assigned_at', { ascending: false });
      if (error) throw error;
      return data || [];
    }
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          employee_code,
          profile:profiles(full_name, email)
        `)
        .order('employee_code');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: classes } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: academicYears } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('id, name, is_active')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: phases } = useQuery({
    queryKey: ['phases'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('phases')
        .select('id, name, phase_type, academic_year_id')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });

  const createAssignmentMut = useMutation({
    mutationFn: async (values: AssignmentFormValues) => {
      const { data, error } = await supabase
        .from('teacher_assignments')
        .insert([values])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Teacher assignment created successfully');
      handleFormClose();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to create assignment');
    }
  });

  const updateAssignmentMut = useMutation({
    mutationFn: async (values: AssignmentFormValues & { id: string }) => {
      const { id, ...updateData } = values;
      const { data, error } = await supabase
        .from('teacher_assignments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Teacher assignment updated successfully');
      handleFormClose();
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update assignment');
    }
  });

  const deleteAssignmentMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('teacher_assignments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacher-assignments'] });
      toast.success('Teacher assignment deleted successfully');
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to delete assignment');
    }
  });

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAssignment(null);
  };

  const handleEdit = (assignment: TeacherAssignment) => {
    setEditingAssignment(assignment);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const filteredAssignments = assignments?.filter(assignment =>
    assignment.teacher?.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.teacher?.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.class?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.subject?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.academic_year?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.phase?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const assignmentPagination = usePaginatedRows(filteredAssignments);

  if (showForm) {
    return <TeacherAssignmentForm
      editingAssignment={editingAssignment}
      onClose={handleFormClose}
      onSubmit={editingAssignment ? updateAssignmentMut.mutate : createAssignmentMut.mutate}
      teachers={teachers || []}
      classes={classes || []}
      subjects={subjects || []}
      academicYears={academicYears || []}
      phases={phases || []}
    />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Assignments</h1>
          <p className="text-muted-foreground">Manage teacher assignments to classes and subjects.</p>
        </div>
        <Button variant="success" onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Assignment
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Assignments</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                type="text"
                placeholder="Search assignments..."
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : filteredAssignments && filteredAssignments.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignmentPagination.paginatedRows.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {assignment.teacher?.profile?.full_name || 'N/A'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.teacher?.employee_code || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{assignment.class?.name || 'N/A'}</TableCell>
                      <TableCell>{assignment.subject?.name || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {assignment.academic_year?.name || 'N/A'}
                          {assignment.academic_year?.is_active && (
                            <Badge variant="success" className="text-xs">Active</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{assignment.phase?.name || 'N/A'}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.phase?.phase_type || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={assignment.is_active ? 'success' : 'secondary'}>
                          {assignment.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(assignment.assigned_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="action"
                            size="icon-sm"
                            onClick={() => handleEdit(assignment)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="action-destructive"
                            size="icon-sm"
                            onClick={() => handleDelete(assignment.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                page={assignmentPagination.page}
                totalPages={assignmentPagination.totalPages}
                setPage={assignmentPagination.setPage}
              />
            </>
          ) : (
            <EmptyState
              icon={Users}
              title="No assignments found"
              description={searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first teacher assignment'}
              action={
                !searchTerm && (
                  <Button variant="success" onClick={() => setShowForm(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Assignment
                  </Button>
                )
              }
            />
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Assignment"
        description="Are you sure you want to delete this teacher assignment? This action cannot be undone."
        confirmText="Delete"
        onConfirm={() => deleteId && deleteAssignmentMut.mutate(deleteId)}
      />
    </div>
  );
}

// Teacher Assignment Form Component
function TeacherAssignmentForm({
  editingAssignment,
  onClose,
  onSubmit,
  teachers,
  classes,
  subjects,
  academicYears,
  phases
}: {
  editingAssignment: TeacherAssignment | null;
  onClose: () => void;
  onSubmit: (values: any) => void;
  teachers: any[];
  classes: any[];
  subjects: any[];
  academicYears: any[];
  phases: any[];
}) {
  const [formData, setFormData] = useState({
    teacher_id: editingAssignment?.teacher_id || '',
    class_id: editingAssignment?.class_id || '',
    subject_id: editingAssignment?.subject_id || '',
    academic_year_id: editingAssignment?.academic_year_id || '',
    phase_id: editingAssignment?.phase_id || '',
  });

  const [selectedYearId, setSelectedYearId] = useState(editingAssignment?.academic_year_id || '');

  const filteredPhases = phases.filter(phase => phase.academic_year_id === selectedYearId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingAssignment) {
      onSubmit({ ...formData, id: editingAssignment.id });
    } else {
      onSubmit(formData);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
          </h1>
          <p className="text-muted-foreground">
            {editingAssignment ? 'Update teacher assignment details' : 'Assign a teacher to a class and subject'}
          </p>
        </div>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="teacher_id" className="text-sm font-medium">Teacher</label>
                <select
                  id="teacher_id"
                  className="w-full p-2 border rounded-md"
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.profile?.full_name} ({teacher.employee_code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="class_id" className="text-sm font-medium">Class</label>
                <select
                  id="class_id"
                  className="w-full p-2 border rounded-md"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  required
                >
                  <option value="">Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="subject_id" className="text-sm font-medium">Subject</label>
                <select
                  id="subject_id"
                  className="w-full p-2 border rounded-md"
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  required
                >
                  <option value="">Select Subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="academic_year_id" className="text-sm font-medium">Academic Year</label>
                <select
                  id="academic_year_id"
                  className="w-full p-2 border rounded-md"
                  value={formData.academic_year_id}
                  onChange={(e) => {
                    setFormData({ ...formData, academic_year_id: e.target.value, phase_id: '' });
                    setSelectedYearId(e.target.value);
                  }}
                  required
                >
                  <option value="">Select Academic Year</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.name} {year.is_active && '(Active)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="phase_id" className="text-sm font-medium">Phase</label>
                <select
                  id="phase_id"
                  className="w-full p-2 border rounded-md"
                  value={formData.phase_id}
                  onChange={(e) => setFormData({ ...formData, phase_id: e.target.value })}
                  required
                  disabled={!selectedYearId}
                >
                  <option value="">Select Phase</option>
                  {filteredPhases.map((phase) => (
                    <option key={phase.id} value={phase.id}>
                      {phase.name} ({phase.phase_type})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="success">
                {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
