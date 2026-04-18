import { useState } from 'react';
import { useAppStore } from '@/hooks/useAppStore';
import { useRoomStatus } from '@/hooks/useRoomStatus';
import { LoginScreen } from '@/screens/LoginScreen';
import { CashLogScreen } from '@/screens/CashLogScreen';
import { AddEntryScreen } from '@/screens/AddEntryScreen';
import { DailySummaryScreen } from '@/screens/DailySummaryScreen';
import { RoomStatusScreen } from '@/screens/RoomStatusScreen';
import { ManagerViewScreen } from '@/screens/ManagerViewScreen';
import { BottomNav } from '@/components/BottomNav';
import { Loader2 } from 'lucide-react';

export type Screen =
  | 'login'
  | 'cash-log'
  | 'add-entry'
  | 'daily-summary'
  | 'room-status'
  | 'manager-view';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');

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

    if (success && role === 'manager') {
      setCurrentScreen('manager-view');
    } else if (success && role === 'hk') {
      setCurrentScreen('room-status');
    } else if (success) {
      setCurrentScreen('cash-log');
    }

    return success;
  };

  if (!appStore.currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleAddTransaction = (data: any) => {
    const txs = appStore.addTransaction(data);

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
            onReversal={() => {}}
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
            onReversal={() => {}}
          />
        );

      default:
        return (
          <CashLogScreen
            appStore={appStore}
            onReversal={() => {}}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <main className="flex-1 pb-24 overflow-auto">
        {renderScreen()}
      </main>

      <BottomNav
        currentScreen={currentScreen}
        onNavigate={navigateTo}
        userRole={appStore.currentUser?.role || 'fdo'}
      />
    </div>
  );
}

export default App;