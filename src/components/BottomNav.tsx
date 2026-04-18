import { FileText, Plus, Calculator, Home, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Screen } from '@/App';
import type { UserRole } from '@/types';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  userRole: UserRole;
}

export function BottomNav({ currentScreen, onNavigate, userRole }: BottomNavProps) {
  const isActive = (screen: Screen) => currentScreen === screen;

  if (userRole === 'hk') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-md mx-auto px-4 py-3">
          <Button
            onClick={() => onNavigate('room-status')}
            variant={isActive('room-status') ? 'default' : 'ghost'}
            className="w-full h-12"
          >
            <Home className="w-5 h-5 mr-2" />
            Room Status
          </Button>
        </div>
      </div>
    );
  }

  if (userRole === 'manager') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2 px-4 py-3">
          <Button
            onClick={() => onNavigate('manager-view')}
            variant={isActive('manager-view') ? 'default' : 'ghost'}
            className="h-12"
          >
            <UserCog className="w-5 h-5 mr-2" />
            Manager
          </Button>

          <Button
            onClick={() => onNavigate('reversal')}
            variant={isActive('reversal') ? 'default' : 'ghost'}
            className="h-12"
          >
            <Calculator className="w-5 h-5 mr-2" />
            Reversal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-2 px-4 py-3">
        <Button
          onClick={() => onNavigate('cash-log')}
          variant={isActive('cash-log') ? 'default' : 'ghost'}
          className="h-12"
        >
          <FileText className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => onNavigate('add-entry')}
          variant={isActive('add-entry') ? 'default' : 'ghost'}
          className="h-12"
        >
          <Plus className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => onNavigate('daily-summary')}
          variant={isActive('daily-summary') ? 'default' : 'ghost'}
          className="h-12"
        >
          <Calculator className="w-5 h-5" />
        </Button>

        <Button
          onClick={() => onNavigate('room-status')}
          variant={isActive('room-status') ? 'default' : 'ghost'}
          className="h-12"
        >
          <Home className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}