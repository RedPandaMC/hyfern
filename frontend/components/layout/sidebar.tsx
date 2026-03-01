"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Package,
  Settings,
  Cpu,
  BarChart,
  Globe,
  Folder,
  Database,
  Users,
  LogOut,
  Terminal,
  User,
} from "@/lib/icons";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Role = "OWNER" | "ADMIN" | "MODERATOR" | "VIEWER";

const ROLE_LEVEL: Record<Role, number> = {
  VIEWER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  minRole: Role;
}

const navLinks: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home, minRole: "VIEWER" },
  { href: "/connect", label: "Connect", icon: Globe, minRole: "VIEWER" },
  { href: "/console", label: "Console", icon: Terminal, minRole: "MODERATOR" },
  { href: "/analytics", label: "Analytics", icon: BarChart, minRole: "MODERATOR" },
  { href: "/mods", label: "Mods", icon: Package, minRole: "ADMIN" },
  { href: "/settings", label: "Settings", icon: Settings, minRole: "ADMIN" },
  { href: "/settings/jvm", label: "JVM Config", icon: Cpu, minRole: "OWNER" },
  { href: "/files", label: "Files", icon: Folder, minRole: "ADMIN" },
  { href: "/backups", label: "Backups", icon: Database, minRole: "ADMIN" },
  { href: "/admin/users", label: "Users", icon: Users, minRole: "ADMIN" },
];

interface SidebarProps {
  userRole?: Role;
  username?: string;
  userImage?: string | null;
}

// Menu icon as inline SVG to avoid dependency on icons lib for layout-critical component
function MenuIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function Sidebar({ userRole = "ADMIN", username = "Admin", userImage }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close on escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const visibleLinks = navLinks.filter(
    (link) => ROLE_LEVEL[userRole] >= ROLE_LEVEL[link.minRole]
  );

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Logo size={28} showText={true} />
        </Link>
        {/* Close button on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-8 w-8"
          onClick={() => setMobileOpen(false)}
        >
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const isActive =
            pathname === link.href ||
            (link.href !== "/dashboard" && pathname.startsWith(link.href + "/"));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-border p-4">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full">
            <div className="flex items-center space-x-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent">
              <Avatar className="h-8 w-8 flex-shrink-0">
                {userImage ? (
                  <AvatarImage 
                    src={userImage} 
                    alt={username}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : null}
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left min-w-0">
                <span className="text-sm font-medium truncate w-full">{username}</span>
                <span className="text-xs text-muted-foreground">{userRole}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button - positioned fixed at top-left */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-3 left-3 z-50 md:hidden h-10 w-10 bg-card/80 backdrop-blur-sm border border-border"
        onClick={() => setMobileOpen(true)}
      >
        <MenuIcon className="h-5 w-5" />
      </Button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, slide-in when open */}
      <aside
        className={cn(
          "flex w-64 flex-col border-r border-border bg-card flex-shrink-0",
          // Mobile: fixed overlay sidebar
          "fixed inset-y-0 left-0 z-50 transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
