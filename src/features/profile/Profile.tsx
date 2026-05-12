import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Mail, Shield, User, Clock, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  if (!profile) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6 pb-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>
          <p className="text-muted-foreground">
            Your account is signed in, but the profile record has not loaded yet.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Profile Unavailable</CardTitle>
            <CardDescription>
              Try refreshing the page. If this keeps happening, your `profiles` row may be missing in Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Refresh Profile</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initial = profile.full_name?.trim().charAt(0) || profile.email?.trim().charAt(0) || 'U';

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Account Profile</h1>
          <p className="text-muted-foreground">
            Manage your personal information and account settings.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-primary/30 via-primary/10 to-background" />
        <CardContent className="-mt-10 px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar className="h-24 w-24 border-4 border-background bg-background">
              <AvatarFallback className="bg-transparent text-2xl font-bold text-primary">
                {initial.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold">{profile.full_name || 'User'}</h2>
              <p className="text-sm capitalize text-muted-foreground">{profile.role} account</p>
              <p className="flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-3.5 w-3.5" />
                Active now
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your basic profile details and contact information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Full Name
              </div>
              <p className="font-medium">{profile.full_name || 'Not provided'}</p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                Email Address
              </div>
              <p className="font-medium">{profile.email || 'Not provided'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Access</CardTitle>
            <CardDescription>Your current role and application permissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                Role
              </div>
              <p className="font-medium capitalize">{profile.role}</p>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Status
              </div>
              <p className="font-medium">Signed in</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
