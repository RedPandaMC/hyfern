"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Terminal,
  Package,
  Settings,
  Cpu,
  BarChart,
  Globe,
  Folder,
  Database,
  Users,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  { href: "/admin/users", label: "Users", icon: Users, minRole: "OWNER" },
];

interface SidebarProps {
  userRole?: Role;
  username?: string;
}

export function Sidebar({ userRole = "ADMIN", username = "Admin" }: SidebarProps) {
  const pathname = usePathname();

  const visibleLinks = navLinks.filter(
    (link) => ROLE_LEVEL[userRole] >= ROLE_LEVEL[link.minRole]
  );

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Terminal className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold">HyFern</span>
        </Link>
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
              <Icon className="h-5 w-5" />
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
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium">{username}</span>
                <span className="text-xs text-muted-foreground">{userRole}</span>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
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
    </aside>
  );
}
