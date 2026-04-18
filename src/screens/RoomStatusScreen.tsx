import { useState, useMemo } from 'react';
import { Hotel, CheckCircle, AlertCircle, Sparkles, Brush, Moon, Ban, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { Room, RoomState, RoomStatus } from '@/types';
import { ALL_ROOMS, ROOM_STATUSES, ROOM_STATUS_COLORS, ROOM_STATUS_LABELS } from '@/types';

interface RoomStatusScreenProps {
  roomStatus: Record<string, RoomState>;
  updateRoomStatus: (roomId: string, status: RoomStatus, updatedBy: string, updatedById: string) => void;
  currentUser: { name: string; id: string } | null;
  logout: () => void;
}

const STATUS_ICONS: Record<RoomStatus, React.ReactNode> = {
  'Check in': <CheckCircle className="w-4 h-4" />,
  'Checkout': <AlertCircle className="w-4 h-4" />,
  'Ready': <Sparkles className="w-4 h-4" />,
  'Cleaning': <Brush className="w-4 h-4" />,
  'MUR': <Moon className="w-4 h-4" />,
  'DND': <Ban className="w-4 h-4" />
};

// Get room info from ALL_ROOMS
const getRoomInfo = (roomId: string): Room | undefined => {
  return ALL_ROOMS.find(r => r.id === roomId);
};

export function RoomStatusScreen({ 
  roomStatus, 
  updateRoomStatus, 
  currentUser, 
  logout 
}: RoomStatusScreenProps) {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts: Record<RoomStatus, number> = {
      'Check in': 0,
      'Checkout': 0,
      'Ready': 0,
      'Cleaning': 0,
      'MUR': 0,
      'DND': 0
    };
    
    Object.values(roomStatus).forEach(room => {
      counts[room.status]++;
    });
    
    return counts;
  }, [roomStatus]);

  const handleStatusChange = (status: RoomStatus) => {
    if (selectedRoomId && currentUser) {
      updateRoomStatus(selectedRoomId, status, currentUser.name, currentUser.id);
      setSelectedRoomId(null);
    }
  };

  const selectedRoom = selectedRoomId ? getRoomInfo(selectedRoomId) : null;
  const selectedRoomState = selectedRoomId ? roomStatus[selectedRoomId] : null;

  // Render a room card - ULTRA COMPACT SIZE (50% of previous)
  const renderRoomCard = (room: Room) => {
    const state = roomStatus[room.id];
    if (!state) return null;

    const colors = ROOM_STATUS_COLORS[state.status];

    return (
      <button
        key={room.id}
        onClick={() => setSelectedRoomId(room.id)}
        className={`
          relative w-full aspect-square rounded-lg border p-1
          flex flex-col justify-center items-center
          transition-all duration-200 active:scale-95
          ${colors.bg} ${colors.border} ${colors.shadow} shadow-sm
          hover:brightness-110 hover:shadow-md
        `}
      >
        {/* Room number - main focus */}
        <span className={`text-base sm:text-lg font-black ${colors.text} leading-none`}>
          {room.number}
        </span>

        {/* Status icon only */}
        <span className={`${colors.text} mt-0.5 scale-75`}>
          {STATUS_ICONS[state.status]}
        </span>
      </button>
    );
  };

  return (
    <div className="bg-gray-100 min-h-full">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-20 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hotel className="w-7 h-7" />
              <div>
                <h1 className="text-xl font-bold leading-tight">Room Status</h1>
                <p className="text-xs text-blue-200">FO ↔ HK Communication</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm hidden sm:inline">{currentUser?.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={logout}
                className="text-white hover:bg-blue-600"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Status Summary */}
      <div className="bg-white border-b px-4 py-3 sticky top-[72px] z-10 shadow-sm">
        <div className="grid grid-cols-6 gap-2">
          <div className="text-center">
            <Badge className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-1.5">
              {statusCounts['Check in']}
            </Badge>
            <p className="text-[10px] text-gray-600 mt-1 font-medium">Check in</p>
          </div>
          <div className="text-center">
            <Badge className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-1.5">
              {statusCounts['Checkout']}
            </Badge>
            <p className="text-[10px] text-gray-600 mt-1 font-medium">Checkout</p>
          </div>
          <div className="text-center">
            <Badge className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-1.5">
              {statusCounts['Ready']}
            </Badge>
            <p className="text-[10px] text-gray-600 mt-1 font-medium">Ready</p>
          </div>
          <div className="text-center">
            <Badge className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-1.5">
              {statusCounts['Cleaning']}
            </Badge>
            <p className="text-[10px] text-gray-600 mt-1 font-medium">Cleaning</p>
          </div>
          <div className="text-center">
            <Badge className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-1.5">
              {statusCounts['MUR']}
            </Badge>
            <p className="text-[10px] text-gray-600 mt-1 font-medium">MUR</p>
          </div>
          <div className="text-center">
            <Badge className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-1.5">
              {statusCounts['DND']}
            </Badge>
            <p className="text-[10px] text-gray-600 mt-1 font-medium">DND</p>
          </div>
        </div>
      </div>

      {/* Room Cards Grid */}
      <div className="p-4 space-y-6">
        {/* Casa Clara Section */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Casa Clara
          </h2>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
            {ALL_ROOMS.filter(r => r.roomType === 'Casa Clara').map(renderRoomCard)}
          </div>
        </section>

        {/* Casa Grande Section */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            Casa Grande
          </h2>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
            {ALL_ROOMS.filter(r => r.roomType === 'Casa Grande').map(renderRoomCard)}
          </div>
        </section>

        {/* Casa Doble Section */}
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-pink-500"></span>
            Casa Doble
          </h2>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
            {ALL_ROOMS.filter(r => r.roomType === 'Casa Doble').map(renderRoomCard)}
          </div>
        </section>
      </div>

      {/* Status Selection Dialog */}
      <Dialog open={!!selectedRoomId} onOpenChange={() => setSelectedRoomId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">
              Update Room Status
            </DialogTitle>
          </DialogHeader>
          
          {selectedRoom && selectedRoomState && (
            <div className="text-center mb-4">
              <p className="text-3xl font-black text-gray-800">{selectedRoom.displayName}</p>
              <p className="text-gray-500">{selectedRoom.roomType}</p>
              <p className="text-sm mt-2">
                Current: <span className="font-bold">{ROOM_STATUS_LABELS[selectedRoomState.status]}</span>
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            {ROOM_STATUSES.map((status) => {
              const colors = ROOM_STATUS_COLORS[status];
              const isCurrent = selectedRoomState?.status === status;
              
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  className={`
                    flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2
                    transition-all duration-200 active:scale-95 aspect-square
                    ${colors.bg} ${colors.border} ${colors.text}
                    ${isCurrent ? 'ring-4 ring-offset-2 ring-gray-400' : 'hover:brightness-110'}
                  `}
                >
                  <div className="text-xl">{STATUS_ICONS[status]}</div>
                  <span className="text-xs font-bold text-center leading-tight">{ROOM_STATUS_LABELS[status]}</span>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">Current</Badge>
                  )}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
