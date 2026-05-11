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
        Relationships: []
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
        Relationships: []
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
        Relationships: [
          {
            foreignKeyName: "sections_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_payments: {
        Row: {
          id: string
          student_id: string | null
          amount: number | null
          payment_date: string | null
          payment_method: string | null
          transaction_id: string | null
        }
        Insert: {
          id?: string
          student_id?: string | null
          amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          transaction_id?: string | null
        }
        Update: {
          id?: string
          student_id?: string | null
          amount?: number | null
          payment_date?: string | null
          payment_method?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          id: string
          title: string | null
          description: string | null
          audience: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          description?: string | null
          audience?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          description?: string | null
          audience?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
  }
}
