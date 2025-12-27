import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export function SettingsDropdown() {
  const navigate = useNavigate();
  const { user, signOut, signOutEverywhere } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
    } else {
      navigate('/');
    }
  };

  const handleSignOutEverywhere = async () => {
    setIsSigningOut(true);
    const { error } = await signOutEverywhere();
    setIsSigningOut(false);
    if (error) {
      toast.error('Failed to sign out from all devices');
    } else {
      toast.success('Signed out from all devices');
      navigate('/');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="bg-background/50 backdrop-blur-sm border-border/50">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-popover border-border">
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          {user?.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <User className="mr-2 h-4 w-4" />
          Account Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleSignOutEverywhere}
          disabled={isSigningOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? 'Signing out...' : 'Sign out everywhere'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}