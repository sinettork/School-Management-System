import jsPDF from 'jspdf';
import { StudentDetail } from '@/features/students/StudentDetail';

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

type AttendanceRecord = {
  id: string;
  attendance_date: string;
  status: string;
  phase: {
    name: string;
  } | null;
};

interface ReportCardData {
  student: StudentDetail;
  results: ExamResult[];
  attendance: AttendanceRecord[];
  academicYear: string;
  phase: string;
  generatedDate: Date;
}

export class ReportCardGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;

  constructor() {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
  }

  generateReportCard(data: ReportCardData): void {
    // Add custom font for better text rendering
    this.doc.setFont('helvetica');
    
    // Header Section
    this.addHeader();
    
    // School Information
    this.addSchoolInfo();
    
    // Student Information
    this.addStudentInfo(data.student);
    
    // Academic Performance
    this.addAcademicPerformance(data.results);
    
    // Attendance Summary
    this.addAttendanceSummary(data.attendance);
    
    // Remarks and Signatures
    this.addRemarksAndSignatures(data);
    
    // Footer
    this.addFooter(data.generatedDate);
  }

  private addHeader(): void {
    // School Name Header
    this.doc.setFontSize(24);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 51, 102); // Dark blue
    this.doc.text('KIRI SCHOOL MANAGEMENT SYSTEM', this.pageWidth / 2, 30, { align: 'center' });
    
    // Report Card Title
    this.doc.setFontSize(18);
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('ACADEMIC REPORT CARD', this.pageWidth / 2, 45, { align: 'center' });
    
    // Decorative line
    this.doc.setDrawColor(0, 51, 102);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, 55, this.pageWidth - this.margin, 55);
  }

  private addSchoolInfo(): void {
    this.doc.setFontSize(10);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('123 Education Street, Learning City', this.pageWidth / 2, 65, { align: 'center' });
    this.doc.text('Phone: (123) 456-7890 | Email: info@kirischool.edu', this.pageWidth / 2, 72, { align: 'center' });
    this.doc.text('Website: www.kirischool.edu', this.pageWidth / 2, 79, { align: 'center' });
  }

  private addStudentInfo(student: StudentDetail): void {
    const startY = 95;
    
    // Student Info Box
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.rect(this.margin, startY, this.pageWidth - 2 * this.margin, 50);
    
    // Title
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    this.doc.text('STUDENT INFORMATION', this.margin + 10, startY + 15);
    
    // Student Details
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    
    const leftCol = this.margin + 15;
    const rightCol = this.pageWidth / 2 + 20;
    let y = startY + 25;
    
    // Left Column
    this.doc.text(`Name: ${student.profile?.full_name || 'N/A'}`, leftCol, y);
    y += 8;
    this.doc.text(`Student Code: ${student.student_code}`, leftCol, y);
    y += 8;
    this.doc.text(`Class: ${student.class?.name || 'N/A'}`, leftCol, y);
    y += 8;
    if (student.section) {
      this.doc.text(`Section: ${student.section.name}`, leftCol, y);
    }
    
    // Right Column
    y = startY + 25;
    this.doc.text(`Email: ${student.profile?.email || 'N/A'}`, rightCol, y);
    y += 8;
    this.doc.text(`Phone: ${student.profile?.phone || 'N/A'}`, rightCol, y);
    y += 8;
    this.doc.text(`Status: ${student.status.toUpperCase()}`, rightCol, y);
    y += 8;
    if (student.admission_date) {
      this.doc.text(`Admission: ${new Date(student.admission_date).toLocaleDateString()}`, rightCol, y);
    }
  }

  private addAcademicPerformance(results: ExamResult[]): void {
    const startY = 160;
    
    // Title
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ACADEMIC PERFORMANCE', this.margin, startY);
    
    // Table Headers
    const tableStartY = startY + 10;
    const columnWidths = [15, 60, 40, 30, 25, 40, 35];
    const tableWidth = columnWidths.reduce((a, b) => a + b, 0);
    const tableX = (this.pageWidth - tableWidth) / 2;
    
    // Header Background
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(tableX, tableStartY, tableWidth, 10, 'F');
    
    // Header Text
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('#', tableX + 2, tableStartY + 7);
    this.doc.text('Subject', tableX + columnWidths[0] + 2, tableStartY + 7);
    this.doc.text('Exam', tableX + columnWidths[0] + columnWidths[1] + 2, tableStartY + 7);
    this.doc.text('Marks', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 2, tableStartY + 7);
    this.doc.text('%', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 2, tableStartY + 7);
    this.doc.text('Grade', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + 2, tableStartY + 7);
    this.doc.text('Remarks', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + 2, tableStartY + 7);
    
    // Table Borders
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(tableX, tableStartY, tableWidth, 10);
    
    // Data Rows
    if (results.length === 0) {
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No exam results available for this period', tableX + tableWidth / 2 - 60, tableStartY + 25);
    } else {
      let currentY = tableStartY + 10;
      
      results.forEach((result, index) => {
        if (currentY > this.pageHeight - 100) {
          this.doc.addPage();
          currentY = 50;
        }
        
        const percentage = Math.round((result.marks_obtained / result.full_marks) * 100);
        
        // Row Background (alternating)
        if (index % 2 === 0) {
          this.doc.setFillColor(250, 250, 250);
          this.doc.rect(tableX, currentY, tableWidth, 10, 'F');
        }
        
        // Row Data
        this.doc.setFontSize(8);
        this.doc.setFont('helvetica', 'normal');
        this.doc.text((index + 1).toString(), tableX + 2, currentY + 7);
        this.doc.text(result.exam?.subject?.name || 'N/A', tableX + columnWidths[0] + 2, currentY + 7);
        this.doc.text(result.exam?.name || 'N/A', tableX + columnWidths[0] + columnWidths[1] + 2, currentY + 7);
        this.doc.text(`${result.marks_obtained}/${result.full_marks}`, tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + 2, currentY + 7);
        this.doc.text(percentage.toString(), tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + 2, currentY + 7);
        
        // Grade with color
        if (percentage >= 70) {
          this.doc.setTextColor(0, 128, 0); // Green
        } else if (percentage >= 50) {
          this.doc.setTextColor(255, 165, 0); // Orange
        } else {
          this.doc.setTextColor(255, 0, 0); // Red
        }
        this.doc.text(result.grade || 'N/A', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + 2, currentY + 7);
        this.doc.setTextColor(0, 0, 0); // Reset color
        
        this.doc.text(result.remarks || '-', tableX + columnWidths[0] + columnWidths[1] + columnWidths[2] + columnWidths[3] + columnWidths[4] + columnWidths[5] + 2, currentY + 7);
        
        // Row Border
        this.doc.setDrawColor(200, 200, 200);
        this.doc.rect(tableX, currentY, tableWidth, 10);
        
        currentY += 10;
      });
      
      // Summary Statistics
      const average = results.reduce((sum, r) => sum + (r.marks_obtained / r.full_marks) * 100, 0) / results.length;
      const highest = Math.max(...results.map(r => (r.marks_obtained / r.full_marks) * 100));
      const lowest = Math.min(...results.map(r => (r.marks_obtained / r.full_marks) * 100));
      
      const summaryY = currentY + 15;
      this.doc.setFontSize(10);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Summary Statistics', tableX, summaryY);
      
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Average: ${Math.round(average)}%`, tableX, summaryY + 10);
      this.doc.text(`Highest: ${Math.round(highest)}%`, tableX + 80, summaryY + 10);
      this.doc.text(`Lowest: ${Math.round(lowest)}%`, tableX + 160, summaryY + 10);
    }
  }

  private addAttendanceSummary(attendance: AttendanceRecord[]): void {
    const startY = this.pageHeight - 120;
    
    // Title
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ATTENDANCE SUMMARY', this.margin, startY);
    
    if (attendance.length === 0) {
      this.doc.setFontSize(9);
      this.doc.setFont('helvetica', 'italic');
      this.doc.text('No attendance records available', this.margin, startY + 15);
      return;
    }
    
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const percentage = Math.round((present / attendance.length) * 100);
    
    // Attendance Box
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(this.margin, startY + 10, 120, 60);
    
    // Stats
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Total Days: ${attendance.length}`, this.margin + 10, startY + 25);
    this.doc.text(`Present: ${present}`, this.margin + 10, startY + 35);
    this.doc.text(`Absent: ${absent}`, this.margin + 10, startY + 45);
    this.doc.text(`Late: ${late}`, this.margin + 10, startY + 55);
    
    // Percentage with visual indicator
    const percentageX = this.margin + 70;
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    
    if (percentage >= 90) {
      this.doc.setTextColor(0, 128, 0);
    } else if (percentage >= 75) {
      this.doc.setTextColor(255, 165, 0);
    } else {
      this.doc.setTextColor(255, 0, 0);
    }
    
    this.doc.text(`${percentage}%`, percentageX + 20, startY + 35);
    this.doc.setTextColor(0, 0, 0);
    
    // Simple progress bar
    this.doc.setDrawColor(200, 200, 200);
    this.doc.rect(percentageX, startY + 45, 40, 8);
    this.doc.setFillColor(percentage >= 90 ? 0 : percentage >= 75 ? 255 : 255, 
                     percentage >= 90 ? 128 : percentage >= 75 ? 165 : 0, 0);
    this.doc.rect(percentageX, startY + 45, (percentage / 100) * 40, 8, 'F');
  }

  private addRemarksAndSignatures(data: ReportCardData): void {
    const startY = this.pageHeight - 50;
    
    // Remarks Section
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Teacher\'s Remarks:', this.margin, startY);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'italic');
    this.doc.text('Student has shown satisfactory performance during this academic period.', this.margin, startY + 10);
    
    // Signature Lines
    const signatureY = startY + 25;
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('_________________________', this.margin, signatureY);
    this.doc.text('Class Teacher', this.margin + 35, signatureY + 10);
    
    this.doc.text('_________________________', this.pageWidth - 120, signatureY);
    this.doc.text('Principal', this.pageWidth - 85, signatureY + 10);
  }

  private addFooter(generatedDate: Date): void {
    const footerY = this.pageHeight - 10;
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text(`Generated on ${generatedDate.toLocaleDateString()} at ${generatedDate.toLocaleTimeString()}`, this.pageWidth / 2, footerY, { align: 'center' });
    this.doc.text('This is a computer-generated document and does not require a signature', this.pageWidth / 2, footerY + 5, { align: 'center' });
  }

  savePDF(studentName: string): void {
    const fileName = `ReportCard_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(fileName);
  }

  getBlob(): Blob {
    return this.doc.output('blob');
  }
}

export function generateReportCard(data: ReportCardData): void {
  const generator = new ReportCardGenerator();
  generator.generateReportCard(data);
  generator.savePDF(data.student.profile?.full_name || 'Student');
}

export async function generateMultipleReportCards(students: ReportCardData[]): Promise<Blob[]> {
  const blobs: Blob[] = [];
  
  for (const studentData of students) {
    const generator = new ReportCardGenerator();
    generator.generateReportCard(studentData);
    blobs.push(generator.getBlob());
  }
  
  return blobs;
}
