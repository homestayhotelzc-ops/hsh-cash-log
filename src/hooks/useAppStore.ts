import { useState, useEffect } from 'react';
import type { Transaction, User, CashCount, DailySummary } from '@/types';
import { demoManager, generateDemoTransactions } from '@/data/demoData';

const OPENING_CASH_MAP_KEY = 'hsh_opening_cash_map';
const TRANSACTIONS_KEY = 'hsh_transactions';
const CASH_COUNTS_KEY = 'hsh_cash_counts';
const CURRENT_USER_KEY = 'hsh_current_user';
const LAST_ACTIVITY_KEY = 'hsh_last_activity';
const DEMO_MODE_KEY = 'hsh_demo_mode';

const AUTO_LOGOUT_HOURS = 24;

export function useAppStore() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [openingCashMap, setOpeningCashMap] = useState<Record<string, number>>({});
  const [cashCounts, setCashCounts] = useState<CashCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    const init = () => {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      const savedDemoMode = localStorage.getItem(DEMO_MODE_KEY);
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
      
      // Check for auto-logout
      if (lastActivity && savedUser) {
        const lastActivityTime = parseInt(lastActivity);
        const hoursSinceActivity = (Date.now() - lastActivityTime) / (1000 * 60 * 60);
        
        if (hoursSinceActivity > AUTO_LOGOUT_HOURS) {
          logout();
          setIsLoading(false);
          return;
        }
      }

      if (savedDemoMode === 'true') {
        enableDemoMode();
      } else if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          setCurrentUser(user);
          loadData();
        } catch {
          logout();
        }
      }
      
      setIsLoading(false);
    };

    init();
  }, []);

  // Update last activity
  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }, 60000);
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadData = () => {
    const savedOpeningCashMap = localStorage.getItem(OPENING_CASH_MAP_KEY);
    const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const savedCashCounts = localStorage.getItem(CASH_COUNTS_KEY);

    if (savedOpeningCashMap) {
      try {
        setOpeningCashMap(JSON.parse(savedOpeningCashMap));
      } catch {
        setOpeningCashMap({});
      }
    }
    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch {
        setTransactions([]);
      }
    }
    if (savedCashCounts) {
      try {
        setCashCounts(JSON.parse(savedCashCounts));
      } catch {
        setCashCounts([]);
      }
    }
  };

  const saveData = (newTransactions: Transaction[], newOpeningCashMap: Record<string, number>, newCashCounts: CashCount[]) => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
    localStorage.setItem(OPENING_CASH_MAP_KEY, JSON.stringify(newOpeningCashMap));
    localStorage.setItem(CASH_COUNTS_KEY, JSON.stringify(newCashCounts));
  };

  const enableDemoMode = () => {
    setIsDemoMode(true);
    setCurrentUser(demoManager);
    setOpeningCashMap({});
    setTransactions(generateDemoTransactions());
    setCashCounts([]);
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(demoManager));
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  const login = (email: string, password: string, role?: 'fdo' | 'manager' | 'hk') => {
  if (!role) return false;

  const user: User = {
    id: crypto.randomUUID(),
    email,
    name:
      role === 'manager'
        ? 'Manager'
        : role === 'hk'
        ? 'HK Staff'
        : 'FDO Staff',
    role,
    isActive: true,
  };

  setCurrentUser(user);
  setIsDemoMode(false);

  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  localStorage.removeItem(DEMO_MODE_KEY);

  loadData();

  return true;
};
    
    // Manager login
    if ((email === 'manager@hsh.com' && password === 'manager') || role === 'manager') {
      const user = demoManager;
      setCurrentUser(user);
      setIsDemoMode(false);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.removeItem(DEMO_MODE_KEY);
      loadData();
      return true;
    }
    
    // HK Staff login - only sees Rooms tab
    if ((email === 'hk@hsh.com' && password === 'hk_staff') || role === 'hk_staff') {
      const user: User = {
        id: 'demo-hk-001',
        email: 'hk@hsh.com',
        name: 'HK Staff',
        role: 'hk_staff' as const,
        isActive: true
      };
      setCurrentUser(user);
      setIsDemoMode(false);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.removeItem(DEMO_MODE_KEY);
      loadData();
      return true;
    }
    
    // FDO Staff login (default)
    if ((email === 'staff@hsh.com' && password === 'staff') || role === 'staff') {
      const user: User = {
        id: 'demo-staff-001',
        email: 'staff@hsh.com',
        name: 'FDO Staff',
        role: 'staff' as const,
        isActive: true
      };
      setCurrentUser(user);
      setIsDemoMode(false);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      localStorage.removeItem(DEMO_MODE_KEY);
      loadData();
      return true;
    }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    setIsDemoMode(false);
    setTransactions([]);
    setOpeningCashMap({});
    setCashCounts([]);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(DEMO_MODE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  };

  // Get opening cash for a specific date
  const getOpeningCash = (date: string): number => {
    return openingCashMap[date] ?? 0;
  };

  // Set opening cash for a specific date (can only be set once per day)
  const setDailyOpeningCash = (date: string, amount: number): boolean => {
    if (openingCashMap[date] !== undefined) {
      return false;
    }
    
    const newMap = { ...openingCashMap, [date]: amount };
    setOpeningCashMap(newMap);
    
    const dayTransactions = transactions.filter(t => t.date === date).sort((a, b) => a.timestamp - b.timestamp);
    const withBalance = calculateRunningBalance(dayTransactions, amount);
    
    const updatedTransactions = transactions.map(t => {
      if (t.date === date) {
        const updated = withBalance.find(ut => ut.id === t.id);
        return updated || t;
      }
      return t;
    });
    
    setTransactions(updatedTransactions);
    saveData(updatedTransactions, newMap, cashCounts);
    return true;
  };

  const isOpeningCashSet = (date: string): boolean => {
    return openingCashMap[date] !== undefined;
  };

  // Calculate running balance - ONLY Cash affects balance
  const calculateRunningBalance = (txs: Transaction[], opening: number): Transaction[] => {
    let balance = opening;
    return txs.map(tx => {
      if (tx.flowType === 'TRANSFER') {
        return { ...tx, runningBalance: balance };
      }
      
      if (tx.paymentMethod === 'Cash') {
        if (tx.flowType === 'IN') {
          balance += tx.amount;
        } else if (tx.flowType === 'OUT') {
          balance -= tx.amount;
        }
      }
      return { ...tx, runningBalance: balance };
    });
  };

  const addTransaction = (transactionData: any): Transaction[] => {
    const now = new Date();
    const baseTimestamp = now.getTime();
    const date = transactionData.date;
    const opening = getOpeningCash(date);
    
    const createdTransactions: Transaction[] = [];
    
    // Handle security deposit auto-split for non-cash payments
    if (transactionData.securityDeposit && transactionData.securityDeposit.amount > 0) {
      const secDep = transactionData.securityDeposit;
      const totalAmount = transactionData.amount;
      const roomPaymentAmount = totalAmount - secDep.amount;
      
      // 1. Room Payment entry
      createdTransactions.push({
        id: `tx-${Date.now()}-rp`,
        date: transactionData.date,
        time: transactionData.time,
        timestamp: baseTimestamp,
        staffId: transactionData.staffId,
        staffName: transactionData.staffName,
        flowType: 'IN',
        category: 'Room Payment',
        amount: roomPaymentAmount,
        paymentMethod: transactionData.paymentMethod,
        guestName: transactionData.guestName,
        roomBookings: transactionData.roomBookings,
        notes: transactionData.notes,
        isReversal: false,
        roomStatusUpdate: transactionData.roomStatusUpdate,
        runningBalance: 0
      });
      
      // 2. Security Deposit entry
      createdTransactions.push({
        id: `tx-${Date.now()}-sd`,
        date: transactionData.date,
        time: transactionData.time,
        timestamp: baseTimestamp + 1,
        staffId: transactionData.staffId,
        staffName: transactionData.staffName,
        flowType: 'IN',
        category: 'Security Deposit',
        amount: secDep.amount,
        paymentMethod: transactionData.paymentMethod,
        guestName: transactionData.guestName,
        roomBookings: transactionData.roomBookings,
        notes: 'Security Deposit',
        isReversal: false,
        runningBalance: 0
      });
      
      // 3. Sec Dep Cash Movement (Cash Out) - affects cash on hand only
      createdTransactions.push({
        id: `tx-${Date.now()}-mv`,
        date: transactionData.date,
        time: transactionData.time,
        timestamp: baseTimestamp + 2,
        staffId: transactionData.staffId,
        staffName: transactionData.staffName,
        flowType: 'OUT',
        category: 'Sec Dep Cash Movement',
        amount: secDep.amount,
        paymentMethod: 'Cash', // Always Cash
        guestName: transactionData.guestName,
        notes: 'Security Deposit Cash Movement',
        isReversal: false,
        isSecDepMovement: true,
        runningBalance: 0
      });
    } else if (transactionData.charges && transactionData.charges.length > 1) {
      // Multiple charges - create separate transaction for each
      transactionData.charges.forEach((charge: any, index: number) => {
        const id = `tx-${Date.now()}-${index}`;
        createdTransactions.push({
          id,
          date: transactionData.date,
          time: transactionData.time,
          timestamp: baseTimestamp + index,
          staffId: transactionData.staffId,
          staffName: transactionData.staffName,
          flowType: transactionData.flowType,
          category: charge.category,
          amount: charge.amount,
          paymentMethod: transactionData.paymentMethod,
          transferTo: transactionData.transferTo,
          guestName: transactionData.guestName,
          roomBookings: transactionData.roomBookings,
          notes: index === 0 ? transactionData.notes : '',
          isReversal: false,
          roomStatusUpdate: index === 0 ? transactionData.roomStatusUpdate : undefined,
          runningBalance: 0
        });
      });
    } else {
      // Single charge
      const id = `tx-${Date.now()}`;
      createdTransactions.push({
        id,
        date: transactionData.date,
        time: transactionData.time,
        timestamp: baseTimestamp,
        staffId: transactionData.staffId,
        staffName: transactionData.staffName,
        flowType: transactionData.flowType,
        category: transactionData.category || transactionData.charges?.[0]?.category || 'Room Payment',
        amount: transactionData.amount,
        paymentMethod: transactionData.paymentMethod,
        transferTo: transactionData.transferTo,
        guestName: transactionData.guestName,
        roomBookings: transactionData.roomBookings,
        notes: transactionData.notes,
        isReversal: false,
        roomStatusUpdate: transactionData.roomStatusUpdate,
        runningBalance: 0
      });
    }

    const updatedTransactions = [...transactions, ...createdTransactions].sort((a, b) => a.timestamp - b.timestamp);
    const withBalance = calculateRunningBalance(updatedTransactions, opening);
    
    setTransactions(withBalance);
    saveData(withBalance, openingCashMap, cashCounts);
    
    return createdTransactions;
  };

  // Edit a transaction (manager only)
  const editTransaction = (transactionId: string, updates: Partial<Transaction>): boolean => {
    const txIndex = transactions.findIndex(t => t.id === transactionId);
    if (txIndex === -1) return false;
    
    const updatedTransactions = transactions.map(t => {
      if (t.id === transactionId) {
        return { ...t, ...updates, editedByManager: true, editedAt: new Date().toISOString() };
      }
      return t;
    });
    
    const date = transactions[txIndex].date;
    const opening = getOpeningCash(date);
    const withBalance = calculateRunningBalance(updatedTransactions, opening);
    
    setTransactions(withBalance);
    saveData(withBalance, openingCashMap, cashCounts);
    return true;
  };

  // Delete/Void a transaction (manager only)
  const deleteTransaction = (transactionId: string, voidInstead: boolean = true): boolean => {
    if (voidInstead) {
      // Mark as void instead of permanent delete
      const updatedTransactions = transactions.map(t => {
        if (t.id === transactionId) {
          return { ...t, isVoid: true, voidedAt: new Date().toISOString() };
        }
        return t;
      });
      
      setTransactions(updatedTransactions);
      saveData(updatedTransactions, openingCashMap, cashCounts);
    } else {
      // Permanent delete
      const updatedTransactions = transactions.filter(t => t.id !== transactionId);
      
      // Recalculate balances for affected date
      const allDates = [...new Set(updatedTransactions.map(t => t.date))];
      let finalTransactions = updatedTransactions;
      
      allDates.forEach(date => {
        const opening = getOpeningCash(date);
        const dayTxs = updatedTransactions.filter(t => t.date === date).sort((a, b) => a.timestamp - b.timestamp);
        const withBalance = calculateRunningBalance(dayTxs, opening);
        
        finalTransactions = finalTransactions.map(t => {
          if (t.date === date) {
            const updated = withBalance.find(ut => ut.id === t.id);
            return updated || t;
          }
          return t;
        });
      });
      
      setTransactions(finalTransactions);
      saveData(finalTransactions, openingCashMap, cashCounts);
    }
    
    return true;
  };

  const addReversal = (originalTransaction: Transaction, reason: string): Transaction => {
    const now = new Date();
    const id = `tx-${Date.now()}`;
    
    const reversalTransaction: Transaction = {
      id,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      timestamp: now.getTime(),
      staffId: currentUser!.id,
      staffName: currentUser!.name,
      flowType: originalTransaction.flowType === 'IN' ? 'OUT' : 'IN',
      category: originalTransaction.category,
      amount: originalTransaction.amount,
      paymentMethod: originalTransaction.paymentMethod,
      guestName: originalTransaction.guestName,
      roomBookings: originalTransaction.roomBookings,
      notes: `REVERSAL: ${reason}`,
      isReversal: true,
      originalTransactionId: originalTransaction.id,
      reversalReason: reason,
      runningBalance: 0
    };

    const date = reversalTransaction.date;
    const opening = getOpeningCash(date);
    
    const updatedTransactions = [...transactions, reversalTransaction].sort((a, b) => a.timestamp - b.timestamp);
    const withBalance = calculateRunningBalance(updatedTransactions, opening);
    
    setTransactions(withBalance);
    saveData(withBalance, openingCashMap, cashCounts);
    
    return withBalance.find(t => t.id === id)!;
  };

  const addCashCount = (cashCount: CashCount) => {
    const updated = [...cashCounts.filter(c => c.date !== cashCount.date), cashCount];
    setCashCounts(updated);
    saveData(transactions, openingCashMap, updated);
  };

  const getDailySummary = (date: string): DailySummary => {
    const openingCash = getOpeningCash(date);
    const dayTransactions = transactions.filter(t => t.date === date && !t.isReversal);
    
    let cashIn = 0;
    let cashOut = 0;
    let gCashTotal = 0;
    let mayaTotal = 0;
    let bankTotal = 0;

    dayTransactions.forEach(t => {
      if (t.flowType === 'TRANSFER') {
        return;
      }
      
      if (t.flowType === 'IN') {
        if (t.paymentMethod === 'Cash') cashIn += t.amount;
        else if (t.paymentMethod === 'GCash') gCashTotal += t.amount;
        else if (t.paymentMethod === 'Maya') mayaTotal += t.amount;
        else if (t.paymentMethod === 'Bank') bankTotal += t.amount;
      } else if (t.flowType === 'OUT') {
        if (t.paymentMethod === 'Cash') cashOut += t.amount;
        else if (t.paymentMethod === 'GCash') gCashTotal -= t.amount;
        else if (t.paymentMethod === 'Maya') mayaTotal -= t.amount;
        else if (t.paymentMethod === 'Bank') bankTotal -= t.amount;
      }
    });

    return {
      date,
      openingCash,
      cashIn,
      cashOut,
      expectedEndingCash: openingCash + cashIn - cashOut,
      gCashTotal,
      mayaTotal,
      bankTotal,
      transactionCount: dayTransactions.filter(t => t.flowType !== 'TRANSFER').length
    };
  };

  const getTransactionsByDate = (date: string): Transaction[] => {
    return transactions.filter(t => t.date === date);
  };

  const getCashCountByDate = (date: string): CashCount | undefined => {
    return cashCounts.find(c => c.date === date);
  };

  const getCurrentBalance = (date: string): number => {
    const dayTransactions = transactions.filter(t => t.date === date).sort((a, b) => a.timestamp - b.timestamp);
    if (dayTransactions.length === 0) return getOpeningCash(date);
    const lastTx = dayTransactions[dayTransactions.length - 1];
    return lastTx.runningBalance;
  };

  return {
    currentUser,
    isDemoMode,
    transactions,
    openingCashMap,
    cashCounts,
    isLoading,
    login,
    logout,
    enableDemoMode,
    getOpeningCash,
    setDailyOpeningCash,
    isOpeningCashSet,
    addTransaction,
    addReversal,
    editTransaction,
    deleteTransaction,
    addCashCount,
    getDailySummary,
    getTransactionsByDate,
    getCashCountByDate,
    getCurrentBalance
  };
}
