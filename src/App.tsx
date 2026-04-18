import { useState } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useRoomStatus } from '@/hooks/useRoomStatus';
import { LoginScreen } from '@/screens/LoginScreen';
import { CashLogScreen } from '@/screens/CashLogScreen';
import { AddEntryScreen } from '@/screens/AddEntryScreen';
import { DailySummaryScreen } from '@/screens/DailySummaryScreen';
import { RoomStatusScreen } from '@/screens/RoomStatusScreen';
import { ManagerViewScreen } from '@/screens/ManagerViewScreen';
import { ReversalScreen } from '@/screens/ReversalScreen';
import { BottomNav } from '@/components/BottomNav';
import { Loader2 } from 'lucide-react';

export type Screen = 
  | 'login' 
  | 'cash-log' 
  | 'add-entry' 
  | 'daily-summary' 
  | 'room-status' 
  | 'manager-view' 
  | 'reversal';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  
  const appStore = useAppStore();
  const roomStatus = useRoomStatus();

  if (appStore.isLoading || !roomStatus.isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleLogin = (email: string, password: string, role?: 'fdo' | 'manager' | 'hk') => {
    const success = appStore.login(email, password, role);
    // If HK Staff, redirect to Rooms tab
    if (success && role === 'hk_staff') {
      setCurrentScreen('room-status');
    }
    return success;
  };

  if (!appStore.currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    setSelectedTransactionId(null);
  };

  const handleReversal = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setCurrentScreen('reversal');
  };

  // Update room status from transaction
  const handleAddTransaction = (data: any) => {
    const txs = appStore.addTransaction(data);
    
    // If room status update is included, update room statuses by room ID
    if (data.roomStatusUpdate && data.roomStatusUpdate.roomIds && data.roomStatusUpdate.roomIds.length > 0) {
      data.roomStatusUpdate.roomIds.forEach((roomId: string) => {
        roomStatus.updateRoomStatus(
          roomId,
          data.roomStatusUpdate.status,
          appStore.currentUser!.name,
          appStore.currentUser!.id
        );
      });
    }
    
    return txs;
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'cash-log':
        return (
          <CashLogScreen 
            appStore={appStore}
            onReversal={handleReversal}
          />
        );
      case 'add-entry':
        return (
          <AddEntryScreen 
            appStore={{
              ...appStore,
              addTransaction: handleAddTransaction
            }}
          />
        );
      case 'daily-summary':
        return (
          <DailySummaryScreen 
            appStore={{
              ...appStore,
              transactions: appStore.transactions
            }}
          />
        );
      case 'room-status':
        return (
          <RoomStatusScreen 
            roomStatus={roomStatus.roomStatus}
            updateRoomStatus={roomStatus.updateRoomStatus}
            currentUser={appStore.currentUser}
            logout={appStore.logout}
          />
        );
      case 'manager-view':
        return (
          <ManagerViewScreen 
            appStore={{
              ...appStore,
              editTransaction: appStore.editTransaction,
              deleteTransaction: appStore.deleteTransaction
            }}
            onReversal={handleReversal}
          />
        );
      case 'reversal':
        return (
          <ReversalScreen 
            appStore={appStore}
            onNavigate={navigateTo}
            transactionId={selectedTransactionId}
          />
        );
      default:
        return <CashLogScreen appStore={appStore} onReversal={handleReversal} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Main content area with bottom padding for fixed nav */}
      <main className="flex-1 pb-32 overflow-auto">
        {renderScreen()}
      </main>
      
      {/* Fixed bottom navigation - always visible after login */}
      <BottomNav 
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        userRole={appStore.currentUser?.role || 'staff'}
      />
    </div>
  );
}

export default App;
