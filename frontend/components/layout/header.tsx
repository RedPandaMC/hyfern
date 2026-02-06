"use client";

import { useState } from "react";
import { Moon, Sun, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type ServerStatus = "online" | "offline" | "starting";

interface HeaderProps {
  pageTitle?: string;
  serverStatus?: ServerStatus;
  playersOnline?: number;
  maxPlayers?: number;
  tps?: number;
  username?: string;
}

export function Header({
  pageTitle = "Dashboard",
  serverStatus = "online",
  playersOnline = 0,
  maxPlayers = 20,
  tps = 20,
  username = "Admin",
}: HeaderProps) {
  const [isDark, setIsDark] = useState(true);

  const statusConfig = {
    online: {
      color: "bg-green-500",
      text: "Online",
      badgeVariant: "default" as const,
    },
    offline: {
      color: "bg-red-500",
      text: "Offline",
      badgeVariant: "destructive" as const,
    },
    starting: {
      color: "bg-yellow-500",
      text: "Starting",
      badgeVariant: "secondary" as const,
    },
  };

  const status = statusConfig[serverStatus];

  const handleLogout = async () => {
    // TODO: Implement logout functionality
    console.log("Logout clicked");
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      {/* Left side - Page title and server status */}
      <div className="flex items-center space-x-6">
        <h1 className="text-xl font-semibold">{pageTitle}</h1>

        <Separator orientation="vertical" className="h-8" />

        {/* Server Status */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center space-x-2">
                <div className={`h-2 w-2 rounded-full ${status.color} animate-pulse`} />
                <span className="text-sm font-medium">{status.text}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Server is {status.text.toLowerCase()}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Quick Stats */}
        {serverStatus === "online" && (
          <>
            <Separator orientation="vertical" className="h-8" />

            <div className="flex items-center space-x-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {playersOnline}/{maxPlayers}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Players online</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant={tps >= 19 ? "default" : tps >= 15 ? "secondary" : "destructive"}
                    >
                      {tps.toFixed(1)} TPS
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Server ticks per second</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        )}
      </div>

      {/* Right side - Theme toggle and user menu */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="h-9 w-9"
              >
                {isDark ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{username}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@hyfern.local
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive focus:text-destructive"
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
