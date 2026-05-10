import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  FileEdit, 
  Award, 
  Banknote, 
  Bell, 
  Settings, 
  LogOut, 
  Menu,
  School
} from 'lucide-react';

const sidebarRoutes = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Students', path: '/students', icon: Users },
  { name: 'Teachers', path: '/teachers', icon: GraduationCap },
  { name: 'Classes', path: '/classes', icon: BookOpen },
  { name: 'Subjects', path: '/subjects', icon: ClipboardList },
  { name: 'Attendance', path: '/attendance', icon: ClipboardList },
  { name: 'Exams', path: '/exams', icon: FileEdit },
  { name: 'Results', path: '/results', icon: Award },
];

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const NavItems = () => (
    <div className="flex flex-col space-y-1 py-4">
      {sidebarRoutes.map((route) => (
        <NavLink
          key={route.path}
          to={route.path}
          className={({ isActive }) =>
            `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:text-primary ${
              isActive ? 'bg-muted text-primary' : 'text-muted-foreground'
            }`
          }
          onClick={() => setMobileMenuOpen(false)}
        >
          <route.icon className="h-4 w-4" />
          {route.name}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/dashboard" className="flex items-center gap-2 font-semibold">
              <School className="h-6 w-6 text-primary" />
              <span>EduManage</span>
            </NavLink>
          </div>
          <ScrollArea className="flex-1 px-2 lg:px-4">
            <NavItems />
          </ScrollArea>
          <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
              </div>
              <div className="flex flex-col text-sm overflow-hidden">
                <span className="font-semibold truncate">{profile?.full_name || 'User'}</span>
                <span className="text-xs text-muted-foreground capitalize">{profile?.role || 'Guest'}</span>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        {/* Mobile Header */}
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6 md:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger render={<Button variant="outline" size="icon" className="shrink-0 md:hidden" />}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle navigation menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-72">
              <div className="flex h-14 items-center border-b px-4 font-semibold">
                <School className="h-6 w-6 text-primary mr-2" />
                EduManage
              </div>
              <ScrollArea className="flex-1 px-4">
                <NavItems />
              </ScrollArea>
              <div className="mt-auto p-4 border-t">
                 <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold flex-1">EduManage</span>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
