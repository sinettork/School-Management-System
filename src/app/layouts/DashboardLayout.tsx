import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { LucideIcon } from 'lucide-react';
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
  LogOut,
  Menu
} from 'lucide-react';

type SidebarRoute = {
  name: string;
  path: string;
  icon: LucideIcon;
};

const sidebarSections: Array<{ label: string; routes: SidebarRoute[] }> = [
  {
    label: 'Main',
    routes: [{ name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'School',
    routes: [
      { name: 'Students', path: '/students', icon: Users },
      { name: 'Teachers', path: '/teachers', icon: GraduationCap },
      { name: 'Classes', path: '/classes', icon: BookOpen },
      { name: 'Subjects', path: '/subjects', icon: ClipboardList },
    ],
  },
  {
    label: 'Academics',
    routes: [
      { name: 'Attendance', path: '/attendance', icon: ClipboardList },
      { name: 'Exams', path: '/exams', icon: FileEdit },
      { name: 'Results', path: '/results', icon: Award },
    ],
  },
  {
    label: 'Office',
    routes: [
      { name: 'Fee Payments', path: '/fees', icon: Banknote },
      { name: 'Notices', path: '/notices', icon: Bell },
    ],
  },
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
    <div className="flex flex-col gap-5 py-4">
      {sidebarSections.map((section) => (
        <div key={section.label} className="space-y-1">
          <div className="px-3 pb-1 text-[0.68rem] font-semibold uppercase tracking-wide text-muted-foreground/70">
            {section.label}
          </div>
          {section.routes.map((route) => (
            <NavLink
              key={route.path}
              to={route.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all hover:bg-muted/70 hover:text-foreground ${
                  isActive ? 'bg-primary/10 text-primary shadow-sm' : 'text-muted-foreground'
                }`
              }
              onClick={() => setMobileMenuOpen(false)}
            >
              <route.icon className="h-4 w-4" />
              <span className="truncate">{route.name}</span>
            </NavLink>
          ))}
        </div>
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
              <img src="/KIRI.svg" alt="Logo" className="h-8 w-8 object-contain" />
              <span>KIRI School</span>
            </NavLink>
          </div>
          <ScrollArea className="flex-1 px-3">
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
                <img src="/KIRI.svg" alt="Logo" className="h-8 w-8 object-contain mr-2" />
                KIRI School
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
          <span className="font-semibold flex-1">KIRI School</span>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
