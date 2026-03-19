"use client"

import * as React from "react"
import {
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Mail,
  MessageSquare,
  Plus,
  PlusCircle,
  Settings,
  Sparkles,
  User,
  UserCircle,
  Camera,
  Moon,
  Sun,
  Laptop
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export interface UserProfileProps {
  user?: {
    name?: string
    email?: string
    avatar?: string
    username?: string
  }
  isCollapsed?: boolean
  onLogout?: () => void
  onUpdateProfile?: (data: { name: string; username: string }) => Promise<void>
}

export function UserProfile({ 
  user = { name: "Guest", email: "", avatar: "", username: "guest" },
  isCollapsed,
  onLogout,
  onUpdateProfile
}: UserProfileProps) {
  const [isProfileOpen, setIsProfileOpen] = React.useState(false)
  const [name, setName] = React.useState(user.name || "")
  const [username, setUsername] = React.useState(user.username || "")
  const [isSaving, setIsSaving] = React.useState(false)

  // Reset form when user changes or dialog opens
  React.useEffect(() => {
    if (isProfileOpen) {
      setName(user.name || "")
      setUsername(user.username || "")
    }
  }, [isProfileOpen, user])

  const handleSaveProfile = async () => {
    if (!onUpdateProfile) return
    
    try {
      setIsSaving(true)
      await onUpdateProfile({ name, username })
      setIsProfileOpen(false)
    } catch (error) {
      console.error("Failed to update profile", error)
    } finally {
      setIsSaving(false)
    }
  }

  const initials = user.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : "G"

  return (
    <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "relative h-14 w-full justify-start rounded-xl outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isCollapsed ? "px-0 justify-center" : "px-3"
            )}
          >
            <div className={cn("flex items-center gap-3", isCollapsed ? "justify-center w-full" : "w-full")}>
              <Avatar className="h-9 w-9 border border-white/10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-sky-500/20 text-sky-200">{initials}</AvatarFallback>
              </Avatar>
              
              {!isCollapsed && (
                <div className="flex flex-1 flex-col items-start text-left">
                  <span className="truncate text-sm font-medium text-slate-200">{user.name}</span>
                  <span className="truncate text-xs text-slate-400">{user.email}</span>
                </div>
              )}
              
              {!isCollapsed && (
                <ChevronsUpDown className="ml-auto h-4 w-4 text-slate-500" />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuPortal>
          <DropdownMenuContent 
            className="w-64 rounded-xl border-white/10 bg-[#0B1121] text-slate-200 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.5)] backdrop-blur-xl" 
            align="start" 
            side="top" 
            sideOffset={8}
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-white">{user.name}</p>
                <p className="text-xs leading-none text-slate-400">{user.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuGroup>
              <DialogTrigger asChild>
                <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </DialogTrigger>
              <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                <Sparkles className="mr-2 h-4 w-4 text-sky-400" />
                <span>Upgrade Plan</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="focus:bg-white/5 focus:text-white cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent className="border-white/10 bg-[#0B1121] text-slate-200 ml-2">
                  <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/5 focus:text-white cursor-pointer">
                    <Laptop className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={onLogout} className="focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer text-rose-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuPortal>
      </DropdownMenu>

      <DialogContent className="sm:max-w-106.25 bg-[#0B1121] border-white/10 text-slate-200">
        <DialogHeader>
          <DialogTitle className="text-white">Edit profile</DialogTitle>
          <DialogDescription className="text-slate-400">
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
             <div className="relative group cursor-pointer">
                <Avatar className="h-24 w-24 border-2 border-white/10 transition-all group-hover:border-sky-500/50">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-slate-800 text-2xl text-slate-400">{initials}</AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera className="h-8 w-8 text-white" />
                </div>
             </div>
             <p className="text-xs text-slate-500">Click to change avatar</p>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="name" className="text-slate-300">
              Display Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950/50 border-white/10 text-white focus-visible:ring-sky-500/50"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username" className="text-slate-300">
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-slate-950/50 border-white/10 text-white focus-visible:ring-sky-500/50"
            />
          </div>
        </div>
        <DialogFooter>
           <DialogClose asChild>
             <Button variant="ghost" className="hover:bg-white/5 text-slate-400 hover:text-white">Cancel</Button>
           </DialogClose>
          <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-sky-500 hover:bg-sky-600 text-white">
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
