import { FileText, Plus, Calculator, Home, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Screen } from '@/App';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  userRole: 'staff' | 'manager' | 'hk_staff';
}

export function BottomNav({ currentScreen, onNavigate, userRole }: BottomNavProps) {
  const isActive = (screen: Screen) => currentScreen === screen;
  
  // HK Staff only sees Rooms tab
  const isHKStaff = userRole === 'hk_staff';

  // For HK Staff: only show Rooms tab
  if (isHKStaff) {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] z-[100]">
        <div className="flex justify-center p-3 max-w-lg mx-auto">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center justify-center gap-2.5 h-[88px] px-8 rounded-2xl transition-all duration-200 active:scale-95 ${
              isActive('room-status')
                ? 'text-orange-700 bg-orange-100 font-bold ring-2 ring-orange-400'
                : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
            }`}
            onClick={() => onNavigate('room-status')}
          >
            <Home className={`w-9 h-9 ${isActive('room-status') ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-sm font-bold">Rooms</span>
          </Button>
        </div>
      </nav>
    );
  }

  // For FDO/Manager: show all tabs
  const gridCols = userRole === 'manager' ? 'grid-cols-5' : 'grid-cols-4';

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-[0_-4px-20px_rgba(0,0,0,0.15)] z-[100]">
      <div className={`grid ${gridCols} gap-3 p-3 max-w-lg mx-auto`}>
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center justify-center gap-2.5 h-[88px] px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
            isActive('cash-log')
              ? 'text-blue-700 bg-blue-100 font-bold ring-2 ring-blue-400'
              : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
          }`}
          onClick={() => onNavigate('cash-log')}
        >
          <FileText className={`w-9 h-9 ${isActive('cash-log') ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-sm font-bold">Dashboard</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center justify-center gap-2 h-20 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
            isActive('add-entry')
              ? 'text-green-700 bg-green-100 font-bold ring-2 ring-green-400'
              : 'text-gray-500 hover:text-green-600 hover:bg-green-50'
          }`}
          onClick={() => onNavigate('add-entry')}
        >
          <Plus className={`w-9 h-9 ${isActive('add-entry') ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-sm font-bold">Add Entry</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center justify-center gap-2 h-20 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
            isActive('daily-summary')
              ? 'text-purple-700 bg-purple-100 font-bold ring-2 ring-purple-400'
              : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50'
          }`}
          onClick={() => onNavigate('daily-summary')}
        >
          <Calculator className={`w-9 h-9 ${isActive('daily-summary') ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-sm font-bold">Summary</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className={`flex flex-col items-center justify-center gap-2 h-20 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
            isActive('room-status')
              ? 'text-orange-700 bg-orange-100 font-bold ring-2 ring-orange-400'
              : 'text-gray-500 hover:text-orange-600 hover:bg-orange-50'
          }`}
          onClick={() => onNavigate('room-status')}
        >
          <Home className={`w-9 h-9 ${isActive('room-status') ? 'stroke-[2.5px]' : ''}`} />
          <span className="text-sm font-bold">Rooms</span>
        </Button>
        
        {userRole === 'manager' && (
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center justify-center gap-2 h-20 px-2 rounded-2xl transition-all duration-200 active:scale-95 ${
              isActive('manager-view')
                ? 'text-red-700 bg-red-100 font-bold ring-2 ring-red-400'
                : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
            }`}
            onClick={() => onNavigate('manager-view')}
          >
            <UserCog className={`w-9 h-9 ${isActive('manager-view') ? 'stroke-[2.5px]' : ''}`} />
            <span className="text-sm font-bold">Manager</span>
          </Button>
        )}
      </div>
    </nav>
  );
}
