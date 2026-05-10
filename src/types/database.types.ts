export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string | null
          role: string
          phone: string | null
          avatar_url: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          full_name?: string | null
          email?: string | null
          role: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string | null
          role?: string
          phone?: string | null
          avatar_url?: string | null
          created_at?: string | null
        }
      }
      classes: {
        Row: {
          id: string
          name: string
          numeric_level: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          numeric_level?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          numeric_level?: number | null
          created_at?: string | null
        }
      }
      sections: {
        Row: {
          id: string
          class_id: string | null
          name: string
        }
        Insert: {
          id?: string
          class_id?: string | null
          name: string
        }
        Update: {
          id?: string
          class_id?: string | null
          name?: string
        }
      }
      students: {
        Row: {
          id: string
          profile_id: string | null
          student_code: string | null
          class_id: string | null
          section_id: string | null
          gender: string | null
          dob: string | null
          address: string | null
          parent_name: string | null
          parent_phone: string | null
          admission_date: string | null
          status: string | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          student_code?: string | null
          class_id?: string | null
          section_id?: string | null
          gender?: string | null
          dob?: string | null
          address?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          admission_date?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          student_code?: string | null
          class_id?: string | null
          section_id?: string | null
          gender?: string | null
          dob?: string | null
          address?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          admission_date?: string | null
          status?: string | null
        }
      }
      teachers: {
        Row: {
          id: string
          profile_id: string | null
          employee_code: string | null
          qualification: string | null
          joining_date: string | null
          salary: number | null
        }
        Insert: {
          id?: string
          profile_id?: string | null
          employee_code?: string | null
          qualification?: string | null
          joining_date?: string | null
          salary?: number | null
        }
        Update: {
          id?: string
          profile_id?: string | null
          employee_code?: string | null
          qualification?: string | null
          joining_date?: string | null
          salary?: number | null
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          code: string | null
          class_id: string | null
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          class_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          class_id?: string | null
        }
      }
      attendance: {
        Row: {
          id: string
          student_id: string | null
          class_id: string | null
          attendance_date: string | null
          status: string | null
          marked_by: string | null
        }
        Insert: {
          id?: string
          student_id?: string | null
          class_id?: string | null
          attendance_date?: string | null
          status?: string | null
          marked_by?: string | null
        }
        Update: {
          id?: string
          student_id?: string | null
          class_id?: string | null
          attendance_date?: string | null
          status?: string | null
          marked_by?: string | null
        }
      }
      exams: {
        Row: {
          id: string
          name: string | null
          class_id: string | null
          start_date: string | null
          end_date: string | null
        }
        Insert: {
          id?: string
          name?: string | null
          class_id?: string | null
          start_date?: string | null
          end_date?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          class_id?: string | null
          start_date?: string | null
          end_date?: string | null
        }
      }
      exam_results: {
        Row: {
          id: string
          exam_id: string | null
          student_id: string | null
          subject_id: string | null
          marks_obtained: number | null
          full_marks: number | null
          grade: string | null
          remarks: string | null
        }
        Insert: {
          id?: string
          exam_id?: string | null
          student_id?: string | null
          subject_id?: string | null
          marks_obtained?: number | null
          full_marks?: number | null
          grade?: string | null
          remarks?: string | null
        }
        Update: {
          id?: string
          exam_id?: string | null
          student_id?: string | null
          subject_id?: string | null
          marks_obtained?: number | null
          full_marks?: number | null
          grade?: string | null
          remarks?: string | null
        }
      }
    }
  }
}
