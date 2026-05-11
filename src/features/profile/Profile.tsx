import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, User, Clock, Activity, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold tracking-tight">Account Profile</h3>
          <p className="text-muted-foreground">
            Manage your personal information and account settings.
          </p>
        </div>
        <Button variant="outline" className="hidden sm:flex">
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Card className="border-border/50 overflow-hidden relative">
            <div className="h-32 bg-gradient-to-r from-primary/40 via-primary/20 to-background absolute inset-x-0 top-0"></div>
            <CardContent className="pt-20 pb-8 px-6 sm:px-8 relative z-10">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
                <Avatar className="h-28 w-28 border-4 border-background">
                  <AvatarFallback className="text-3xl bg-primary/10 text-primary font-bold">
                    {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1.5 text-center sm:text-left mb-2">
                  <h4 className="text-2xl font-bold tracking-tight">{profile?.full_name || 'User'}</h4>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <Badge variant="secondary" className="capitalize text-primary bg-primary/10 hover:bg-primary/20 transition-colors">
                      {profile?.role || 'Guest'}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" /> Active now
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic profile details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Full Name</span>
                  </div>
                  <p className="font-medium">{profile?.full_name || 'Not provided'}</p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm font-medium">Email Address</span>
                  </div>
                  <p className="font-medium">{profile?.email || 'Not provided'}</p>
                </div>

                <div className="space-y-3 p-4 rounded-lg bg-muted/30 border border-border/50 transition-colors hover:bg-muted/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Role & Permissions</span>
                  </div>
                  <p className="font-medium capitalize">{profile?.role || 'Guest'} Access</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-4 h-4 mr-2 text-primary" />
                System Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/5 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary/60" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">No recent activity</p>
                  <p className="text-xs text-muted-foreground max-w-[200px]">
                    Your recent interactions and logins will appear here.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
