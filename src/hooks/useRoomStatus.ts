import { useState, useEffect } from 'react';
import type { RoomState, RoomStatus } from '@/types';
import { ALL_ROOMS } from '@/types';

const ROOM_STATUS_KEY = 'hsh_room_status_v2';

// Initialize all rooms in "Ready" status
const initializeRooms = (): Record<string, RoomState> => {
  const now = new Date().toISOString();
  const rooms: Record<string, RoomState> = {};
  
  ALL_ROOMS.forEach(room => {
    rooms[room.id] = {
      roomId: room.id,
      roomType: room.roomType,
      status: 'Ready',
      lastUpdated: now,
      updatedBy: 'System',
      updatedById: 'system'
    };
  });
  
  return rooms;
};

export function useRoomStatus() {
  const [roomStatus, setRoomStatus] = useState<Record<string, RoomState>>(initializeRooms());
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(ROOM_STATUS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with default rooms to ensure all rooms exist
        const merged = { ...initializeRooms(), ...parsed };
        setRoomStatus(merged);
      } catch {
        setRoomStatus(initializeRooms());
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever roomStatus changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(ROOM_STATUS_KEY, JSON.stringify(roomStatus));
    }
  }, [roomStatus, isLoaded]);

  const updateRoomStatus = (
    roomId: string, 
    status: RoomStatus, 
    updatedBy: string, 
    updatedById: string,
    notes?: string
  ) => {
    setRoomStatus(prev => {
      const room = prev[roomId];
      if (!room) return prev;
      
      return {
        ...prev,
        [roomId]: {
          ...room,
          status,
          lastUpdated: new Date().toISOString(),
          updatedBy,
          updatedById,
          notes
        }
      };
    });
  };

  const updateMultipleRooms = (
    roomIds: string[],
    status: RoomStatus,
    updatedBy: string,
    updatedById: string
  ) => {
    const now = new Date().toISOString();
    setRoomStatus(prev => {
      const updated = { ...prev };
      roomIds.forEach(roomId => {
        if (updated[roomId]) {
          updated[roomId] = {
            ...updated[roomId],
            status,
            lastUpdated: now,
            updatedBy,
            updatedById
          };
        }
      });
      return updated;
    });
  };

  const getRoomStatus = (roomId: string): RoomState | undefined => {
    return roomStatus[roomId];
  };

  const getAllRooms = (): RoomState[] => {
    return Object.values(roomStatus);
  };

  const getRoomsByStatus = (status: RoomStatus): RoomState[] => {
    return getAllRooms().filter(room => room.status === status);
  };

  const getStatusCounts = (): Record<RoomStatus, number> => {
    const counts: Record<RoomStatus, number> = {
      'Check in': 0,
      'Checkout': 0,
      'Ready': 0,
      'Cleaning': 0,
      'MUR': 0,
      'DND': 0
    };
    
    getAllRooms().forEach(room => {
      counts[room.status]++;
    });
    
    return counts;
  };

  return {
    roomStatus,
    isLoaded,
    updateRoomStatus,
    updateMultipleRooms,
    getRoomStatus,
    getAllRooms,
    getRoomsByStatus,
    getStatusCounts
  };
}
