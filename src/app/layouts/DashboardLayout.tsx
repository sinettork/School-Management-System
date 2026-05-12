import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
  Menu,
  User,
  Settings,
  HelpCircle,
  CalendarDays
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
    label: 'Academic',
    routes: [
      { name: 'Phases', path: '/phases', icon: CalendarDays },
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
                `nav-link-clean ${
                  isActive ? 'nav-link-clean-active' : ''
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

  const SidebarBottomItems = () => (
    <div className="mt-auto p-4 border-t border-border/50 space-y-1">
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `nav-link-clean ${
            isActive ? 'nav-link-clean-active' : ''
          }`
        }
        onClick={() => setMobileMenuOpen(false)}
      >
        <Settings className="h-4 w-4" />
        <span className="truncate">Settings</span>
      </NavLink>
      <NavLink
        to="/help"
        className={({ isActive }) =>
          `nav-link-clean ${
            isActive ? 'nav-link-clean-active' : ''
          }`
        }
        onClick={() => setMobileMenuOpen(false)}
      >
        <HelpCircle className="h-4 w-4" />
        <span className="truncate">Help & Support</span>
      </NavLink>
    </div>
  );

  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full border border-border/50 hover:bg-muted/50 transition-colors">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-transparent text-primary font-semibold text-sm">
              {profile?.full_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-60" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1 p-1">
            <p className="text-sm font-medium leading-none truncate">{profile?.full_name || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {profile?.email}
            </p>
            <div className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold w-fit capitalize bg-primary/10 text-primary border-transparent">
              {profile?.role || 'Guest'}
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>My Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-100 dark:focus:bg-red-950" onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-muted/20 md:block">
        <div className="flex h-full max-h-screen flex-col">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <NavLink to="/dashboard" className="flex items-center gap-2 font-semibold">
              <img src="/KIRI.svg" alt="Logo" className="h-8 w-8 object-contain" />
              <span className="text-lg tracking-tight">KIRI School</span>
            </NavLink>
          </div>
          <ScrollArea className="flex-1 px-3">
            <NavItems />
          </ScrollArea>
          <SidebarBottomItems />
        </div>
      </div>

      <div className="flex flex-col">
        {/* Header (Desktop + Mobile) */}
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6 justify-between md:justify-end">
          <div className="flex items-center md:hidden gap-2">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0 w-72">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <div className="flex h-14 items-center border-b px-4 font-semibold">
                  <img src="/KIRI.svg" alt="Logo" className="h-8 w-8 object-contain mr-2" />
                  <span className="text-lg tracking-tight">KIRI School</span>
                </div>
                <ScrollArea className="flex-1 px-4">
                  <NavItems />
                </ScrollArea>
                <SidebarBottomItems />
              </SheetContent>
            </Sheet>
            <span className="font-semibold text-lg tracking-tight flex-1">KIRI School</span>
          </div>

          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted/10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
