import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { HelpCircle, Mail, Book, MessageCircle, ExternalLink, Phone } from 'lucide-react';

export default function Help() {
  const faqs = [
    {
      q: "How do I add a new student?",
      a: "Navigate to the Students module from the sidebar, click the 'Add Student' button in the top right corner, and fill out the required information including their assigned class."
    },
    {
      q: "How does attendance tracking work?",
      a: "Go to the Attendance module, select a class and date, and you will see a roster of students. You can quickly toggle between Present, Absent, and Late for each student."
    },
    {
      q: "Can I export data to Excel?",
      a: "Yes, look for the 'Export CSV' button located next to the search bar in the main data tables (Students, Teachers, Classes, etc.) to download a spreadsheet."
    }
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Help & Support</h3>
          <p className="text-muted-foreground">
            Get assistance and read documentation about the system.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Contact Support */}
        <Card className="border-border/50 md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MessageCircle className="w-5 h-5 mr-2 text-primary" />
              Contact Support
            </CardTitle>
            <CardDescription>
              Need direct help? Reach out to our team.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="What do you need help with?" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea 
                placeholder="Describe your issue in detail..."
                className="min-h-[120px]"
              />
            </div>
            <Button className="w-full">
              <Mail className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            
            <div className="pt-4 mt-4 border-t border-border/50 space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="w-4 h-4 mr-2" />
                +1 (555) 123-4567
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="w-4 h-4 mr-2" />
                support@kirischool.com
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          {/* Documentation Links */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="w-5 h-5 mr-2 text-primary" />
                Documentation
              </CardTitle>
              <CardDescription>
                Read our comprehensive guides on how to use KIRI School.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-4">
                <a href="#" className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="font-medium text-sm">Getting Started Guide</div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
                <a href="#" className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="font-medium text-sm">Managing Attendance</div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
                <a href="#" className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="font-medium text-sm">Exam & Results Config</div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
                <a href="#" className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors">
                  <div className="font-medium text-sm">Fee Collection API</div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>

          {/* FAQs */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="w-5 h-5 mr-2 text-primary" />
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="space-y-1 pb-4 border-b border-border/50 last:border-0 last:pb-0">
                  <h4 className="font-medium text-sm">{faq.q}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
