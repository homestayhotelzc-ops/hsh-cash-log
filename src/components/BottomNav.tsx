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
        <div className="max-w-3xl mx-auto px-3 py-2">
          <div className="flex items-center justify-center">
            <Button
              onClick={() => onNavigate('room-status')}
              variant={isActive('room-status') ? 'default' : 'ghost'}
              className="h-14 min-w-[90px] flex flex-col items-center justify-center"
            >
              <Home className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (userRole === 'manager') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-3xl mx-auto px-2 py-2">
          <div className="flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap">
            <Button
              onClick={() => onNavigate('cash-log')}
              variant={isActive('cash-log') ? 'default' : 'ghost'}
              className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
            >
              <FileText className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => onNavigate('add-entry')}
              variant={isActive('add-entry') ? 'default' : 'ghost'}
              className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
            >
              <Plus className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => onNavigate('daily-summary')}
              variant={isActive('daily-summary') ? 'default' : 'ghost'}
              className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
            >
              <Calculator className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => onNavigate('room-status')}
              variant={isActive('room-status') ? 'default' : 'ghost'}
              className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
            >
              <Home className="w-5 h-5" />
            </Button>

            <Button
              onClick={() => onNavigate('manager-view')}
              variant={isActive('manager-view') ? 'default' : 'ghost'}
              className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
            >
              <UserCog className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
      <div className="max-w-3xl mx-auto px-2 py-2">
        <div className="flex items-center justify-between gap-2 overflow-x-auto whitespace-nowrap">
          <Button
            onClick={() => onNavigate('cash-log')}
            variant={isActive('cash-log') ? 'default' : 'ghost'}
            className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
          >
            <FileText className="w-5 h-5" />
          </Button>

          <Button
            onClick={() => onNavigate('add-entry')}
            variant={isActive('add-entry') ? 'default' : 'ghost'}
            className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
          >
            <Plus className="w-5 h-5" />
          </Button>

          <Button
            onClick={() => onNavigate('daily-summary')}
            variant={isActive('daily-summary') ? 'default' : 'ghost'}
            className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
          >
            <Calculator className="w-5 h-5" />
          </Button>

          <Button
            onClick={() => onNavigate('room-status')}
            variant={isActive('room-status') ? 'default' : 'ghost'}
            className="h-14 min-w-[70px] flex flex-col items-center justify-center shrink-0"
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}