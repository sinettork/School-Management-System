import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, Mail, Phone, Camera, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfileEdit() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile, form]);

  const updateProfileMut = useMutation({
    mutationFn: async (values: ProfileFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: values.full_name,
          phone: values.phone,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update email if changed
      if (values.email !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: values.email,
        });

        if (emailError) throw emailError;
      }

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        const { error: avatarUpdateError } = await supabase
          .from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', user.id);

        if (avatarUpdateError) throw avatarUpdateError;
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
      navigate('/profile');
    },
    onError: (error: { message?: string }) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar file size must be less than 5MB');
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Avatar must be an image file');
        return;
      }

      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (values: ProfileFormData) => {
    updateProfileMut.mutate(values);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/profile')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground">Update your personal information</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Picture</CardTitle>
            <CardDescription>
              Upload a new profile picture. Recommended size: 200x200px
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="text-lg">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('avatar-upload')?.click()}
                  className="w-full"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Change Avatar
                </Button>
                {avatarFile && (
                  <p className="text-xs text-muted-foreground text-center">
                    Selected: {avatarFile.name}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    {...form.register('full_name')}
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.full_name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    {...form.register('phone')}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Badge variant="secondary" className="text-sm">
                    {profile?.role?.toUpperCase() || 'N/A'}
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Role cannot be changed. Contact administrator if needed.
                  </p>
                </div>
              </div>

              {profile?.email !== form.watch('email') && (
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    You are changing your email address. You will need to verify your new email address.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateProfileMut.isPending}
                >
                  {updateProfileMut.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
