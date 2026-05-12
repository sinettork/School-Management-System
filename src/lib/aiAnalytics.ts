import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface StudentPerformanceData {
  studentName: string;
  results: Array<{
    subject: string;
    marks: number;
    totalMarks: number;
    exam: string;
    date: string;
  }>;
  attendance: Array<{
    date: string;
    status: 'present' | 'absent' | 'late';
  }>;
}

export interface ClassPerformanceData {
  className: string;
  students: StudentPerformanceData[];
  subjectAverages: Array<{
    subject: string;
    average: number;
    highest: number;
    lowest: number;
  }>;
}

export interface AIInsight {
  type: 'performance' | 'attendance' | 'recommendation' | 'alert';
  title: string;
  description: string;
  confidence: number;
  data?: any;
}

export class AIAnalyticsService {
  private model: any;

  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not found. AI features will be disabled.');
      return;
    }
    this.model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async analyzeStudentPerformance(data: StudentPerformanceData): Promise<AIInsight[]> {
    if (!this.model) {
      return this.getFallbackInsights('student');
    }

    try {
      const prompt = this.buildStudentAnalysisPrompt(data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text, 'student');
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getFallbackInsights('student');
    }
  }

  async analyzeClassPerformance(data: ClassPerformanceData): Promise<AIInsight[]> {
    if (!this.model) {
      return this.getFallbackInsights('class');
    }

    try {
      const prompt = this.buildClassAnalysisPrompt(data);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text, 'class');
    } catch (error) {
      console.error('AI analysis failed:', error);
      return this.getFallbackInsights('class');
    }
  }

  async generateNoticeDraft(topic: string, audience: string, keyPoints: string[]): Promise<string> {
    if (!this.model) {
      return this.getFallbackNoticeDraft(topic, audience, keyPoints);
    }

    try {
      const prompt = `
You are a school administrator writing an official notice. Generate a professional notice based on the following:

Topic: ${topic}
Audience: ${audience}
Key Points: ${keyPoints.join(', ')}

Requirements:
- Professional and formal tone
- Clear and concise language
- Include date and reference number
- Proper notice format
- Call to action if applicable

Generate the notice:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Notice generation failed:', error);
      return this.getFallbackNoticeDraft(topic, audience, keyPoints);
    }
  }

  async detectAnomalies(data: StudentPerformanceData): Promise<AIInsight[]> {
    if (!this.model) {
      return [];
    }

    try {
      const prompt = `
Analyze the following student data for anomalies or patterns that need attention:

Student: ${data.studentName}
Recent Performance: ${JSON.stringify(data.results.slice(-5))}
Attendance Pattern: ${JSON.stringify(data.attendance.slice(-10))}

Look for:
- Sudden drops in performance
- Consistent absence patterns
- Subject-specific difficulties
- Attendance issues

Provide specific actionable insights:
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return this.parseAIResponse(text, 'anomaly');
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return [];
    }
  }

  private buildStudentAnalysisPrompt(data: StudentPerformanceData): string {
    const recentResults = data.results.slice(-10);
    const attendanceRate = this.calculateAttendanceRate(data.attendance);
    const performanceTrend = this.calculatePerformanceTrend(recentResults);

    return `
You are an educational AI assistant analyzing student performance. Analyze the following data:

Student: ${data.studentName}
Recent Results: ${JSON.stringify(recentResults)}
Overall Attendance Rate: ${attendanceRate}%
Performance Trend: ${performanceTrend}

Provide insights in the following format:
1. PERFORMANCE: [analysis of academic performance]
2. ATTENDANCE: [analysis of attendance patterns]
3. RECOMMENDATION: [specific recommendations for improvement]
4. ALERT: [any concerns that need immediate attention]

Focus on:
- Strengths and weaknesses
- Learning patterns
- Areas needing improvement
- Attendance correlation with performance
- Actionable recommendations for teachers and parents
`;
  }

  private buildClassAnalysisPrompt(data: ClassPerformanceData): string {
    return `
You are an educational AI assistant analyzing class performance. Analyze the following data:

Class: ${data.className}
Number of Students: ${data.students.length}
Subject Averages: ${JSON.stringify(data.subjectAverages)}

Provide insights in the following format:
1. PERFORMANCE: [overall class performance analysis]
2. SUBJECT_ANALYSIS: [subject-specific insights]
3. RECOMMENDATION: [teaching strategies and interventions]
4. ALERT: [class-wide concerns]

Focus on:
- Class strengths and weaknesses
- Subject-specific challenges
- Teaching strategy recommendations
- Students who may need additional support
- Curriculum effectiveness
`;
  }

  private parseAIResponse(text: string, context: string): AIInsight[] {
    const insights: AIInsight[] = [];
    const lines = text.split('\n').filter(line => line.trim());

    for (const line of lines) {
      const match = line.match(/^(PERFORMANCE|ATTENDANCE|RECOMMENDATION|ALERT|SUBJECT_ANALYSIS):\s*(.+)$/i);
      if (match) {
        const [, type, description] = match;
        insights.push({
          type: this.mapInsightType(type),
          title: type.charAt(0) + type.slice(1).toLowerCase(),
          description: description.trim(),
          confidence: 0.85,
        });
      }
    }

    return insights;
  }

  private mapInsightType(type: string): AIInsight['type'] {
    const typeMap: Record<string, AIInsight['type']> = {
      'PERFORMANCE': 'performance',
      'ATTENDANCE': 'attendance',
      'RECOMMENDATION': 'recommendation',
      'ALERT': 'alert',
      'SUBJECT_ANALYSIS': 'performance',
    };
    return typeMap[type] || 'recommendation';
  }

  private calculateAttendanceRate(attendance: Array<{ status: string }>): number {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'present').length;
    return Math.round((present / attendance.length) * 100);
  }

  private calculatePerformanceTrend(results: Array<{ marks: number; totalMarks: number }>): string {
    if (results.length < 2) return 'insufficient_data';
    
    const percentages = results.map(r => (r.marks / r.totalMarks) * 100);
    const recent = percentages.slice(-3);
    const earlier = percentages.slice(0, -3);
    
    if (earlier.length === 0) return 'insufficient_data';
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
    
    if (recentAvg > earlierAvg + 5) return 'improving';
    if (recentAvg < earlierAvg - 5) return 'declining';
    return 'stable';
  }

  private getFallbackInsights(context: string): AIInsight[] {
    if (context === 'student') {
      return [
        {
          type: 'performance',
          title: 'Performance Analysis',
          description: 'Regular performance monitoring is essential for academic success.',
          confidence: 0.5,
        },
        {
          type: 'attendance',
          title: 'Attendance Tracking',
          description: 'Consistent attendance correlates strongly with academic achievement.',
          confidence: 0.5,
        },
      ];
    }

    return [
      {
        type: 'performance',
        title: 'Class Overview',
        description: 'Regular assessment helps identify areas needing attention.',
        confidence: 0.5,
      },
    ];
  }

  private getFallbackNoticeDraft(topic: string, audience: string, keyPoints: string[]): string {
    const date = new Date().toLocaleDateString();
    const refNumber = `NOTICE/${date.replace(/\//g, '')}/${Math.floor(Math.random() * 1000)}`;

    return `
${date}
Ref: ${refNumber}

NOTICE

Subject: ${topic}

Dear ${audience},

${keyPoints.join('. ')}. 

Please take note of the above information and act accordingly.

For any queries, please contact the school administration.

Sincerely,
School Administration
`;
  }
}

export const aiAnalyticsService = new AIAnalyticsService();

// React hook for AI analytics
export function useAIAnalytics() {
  const analyzeStudent = async (data: StudentPerformanceData) => {
    return await aiAnalyticsService.analyzeStudentPerformance(data);
  };

  const analyzeClass = async (data: ClassPerformanceData) => {
    return await aiAnalyticsService.analyzeClassPerformance(data);
  };

  const generateNotice = async (topic: string, audience: string, keyPoints: string[]) => {
    return await aiAnalyticsService.generateNoticeDraft(topic, audience, keyPoints);
  };

  const detectAnomalies = async (data: StudentPerformanceData) => {
    return await aiAnalyticsService.detectAnomalies(data);
  };

  return {
    analyzeStudent,
    analyzeClass,
    generateNotice,
    detectAnomalies,
  };
}
