import { useState, useEffect } from 'react';
import type { Transaction, User, CashCount, DailySummary } from '@/types';
import { generateDemoTransactions } from '@/data/demoData';

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

  useEffect(() => {
    const init = () => {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      const savedDemoMode = localStorage.getItem(DEMO_MODE_KEY);
      const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

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
          const user = JSON.parse(savedUser) as User;
          setCurrentUser(user);
          loadData(false);
        } catch {
          logout();
        }
      }

      setIsLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (currentUser) {
      const interval = setInterval(() => {
        localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const loadData = (demoMode: boolean = isDemoMode) => {
    if (demoMode) return;

    const savedOpeningCashMap = localStorage.getItem(OPENING_CASH_MAP_KEY);
    const savedTransactions = localStorage.getItem(TRANSACTIONS_KEY);
    const savedCashCounts = localStorage.getItem(CASH_COUNTS_KEY);

    if (savedOpeningCashMap) {
      try {
        setOpeningCashMap(JSON.parse(savedOpeningCashMap));
      } catch {
        setOpeningCashMap({});
      }
    } else {
      setOpeningCashMap({});
    }

    if (savedTransactions) {
      try {
        setTransactions(JSON.parse(savedTransactions));
      } catch {
        setTransactions([]);
      }
    } else {
      setTransactions([]);
    }

    if (savedCashCounts) {
      try {
        setCashCounts(JSON.parse(savedCashCounts));
      } catch {
        setCashCounts([]);
      }
    } else {
      setCashCounts([]);
    }
  };

  const saveData = (
    newTransactions: Transaction[],
    newOpeningCashMap: Record<string, number>,
    newCashCounts: CashCount[]
  ) => {
    if (isDemoMode) return;

    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(newTransactions));
    localStorage.setItem(OPENING_CASH_MAP_KEY, JSON.stringify(newOpeningCashMap));
    localStorage.setItem(CASH_COUNTS_KEY, JSON.stringify(newCashCounts));
  };

  const enableDemoMode = () => {
    const demoUser: User = {
      id: 'demo-fdo-training',
      email: 'demo@hsh.com',
      name: 'FDO Training',
      role: 'fdo',
      isActive: true,
    };

    setIsDemoMode(true);
    setCurrentUser(demoUser);
    setOpeningCashMap({});
    setTransactions(generateDemoTransactions());
    setCashCounts([]);

    localStorage.setItem(DEMO_MODE_KEY, 'true');
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(demoUser));
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  };

  const getDisplayNameFromEmail = (email: string, role: 'fdo' | 'manager' | 'hk') => {
    if (email === 'demo@hsh.com') return 'FDO Training';
    if (email === 'manager@hsh.com') return 'Manager';

    const localPart = email.split('@')[0]?.trim().toLowerCase() || '';

    if (role === 'hk') {
      if (localPart === 'hk1') return 'HK Staff';
      if (localPart.startsWith('hk')) return 'HK Staff';
      return 'HK Staff';
    }

    if (role === 'manager') {
      return 'Manager';
    }

    if (!localPart) return 'FDO Staff';

    const cleaned = localPart
      .replace(/[._-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleaned) return 'FDO Staff';

    return cleaned
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const login = (email: string, _password: string, role?: 'fdo' | 'manager' | 'hk') => {
    if (email === 'demo@hsh.com') {
      enableDemoMode();
      return true;
    }

    if (!role) return false;

    const user: User = {
      id: crypto.randomUUID(),
      email,
      name: getDisplayNameFromEmail(email, role),
      role,
      isActive: true,
    };

    setCurrentUser(user);
    setIsDemoMode(false);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    localStorage.removeItem(DEMO_MODE_KEY);
    loadData(false);

    return true;
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

  const getOpeningCash = (date: string): number => {
    return openingCashMap[date] ?? 0;
  };

  const setDailyOpeningCash = (date: string, amount: number): boolean => {
    if (openingCashMap[date] !== undefined) {
      return false;
    }

    const newMap = { ...openingCashMap, [date]: amount };
    setOpeningCashMap(newMap);

    const dayTransactions = transactions
      .filter((t) => t.date === date)
      .sort((a, b) => a.timestamp - b.timestamp);

    const withBalance = calculateRunningBalance(dayTransactions, amount);

    const updatedTransactions = transactions.map((t) => {
      if (t.date === date) {
        const updated = withBalance.find((ut) => ut.id === t.id);
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

  const calculateRunningBalance = (txs: Transaction[], opening: number): Transaction[] => {
    let balance = opening;

    return txs.map((tx) => {
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

    if (transactionData.securityDeposit && transactionData.securityDeposit.amount > 0) {
      const secDep = transactionData.securityDeposit;
      const totalAmount = transactionData.amount;
      const roomPaymentAmount = totalAmount - secDep.amount;

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
        runningBalance: 0,
      });

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
        runningBalance: 0,
      });

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
        paymentMethod: 'Cash',
        guestName: transactionData.guestName,
        notes: 'Security Deposit Cash Movement',
        isReversal: false,
        isSecDepMovement: true,
        runningBalance: 0,
      });
    } else if (transactionData.charges && transactionData.charges.length > 1) {
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
          runningBalance: 0,
        });
      });
    } else {
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
        runningBalance: 0,
      });
    }

    const updatedTransactions = [...transactions, ...createdTransactions].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    const withBalance = calculateRunningBalance(updatedTransactions, opening);

    setTransactions(withBalance);
    saveData(withBalance, openingCashMap, cashCounts);

    return createdTransactions;
  };

  const editTransaction = (transactionId: string, updates: Partial<Transaction>): boolean => {
    const txIndex = transactions.findIndex((t) => t.id === transactionId);
    if (txIndex === -1) return false;

    const updatedTransactions = transactions.map((t) => {
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

  const deleteTransaction = (transactionId: string, voidInstead: boolean = true): boolean => {
    if (voidInstead) {
      const updatedTransactions = transactions.map((t) => {
        if (t.id === transactionId) {
          return { ...t, isVoid: true, voidedAt: new Date().toISOString() };
        }
        return t;
      });

      setTransactions(updatedTransactions);
      saveData(updatedTransactions, openingCashMap, cashCounts);
    } else {
      const updatedTransactions = transactions.filter((t) => t.id !== transactionId);

      const allDates = [...new Set(updatedTransactions.map((t) => t.date))];
      let finalTransactions = updatedTransactions;

      allDates.forEach((date) => {
        const opening = getOpeningCash(date);
        const dayTxs = updatedTransactions
          .filter((t) => t.date === date)
          .sort((a, b) => a.timestamp - b.timestamp);

        const withBalance = calculateRunningBalance(dayTxs, opening);

        finalTransactions = finalTransactions.map((t) => {
          if (t.date === date) {
            const updated = withBalance.find((ut) => ut.id === t.id);
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
      runningBalance: 0,
    };

    const date = reversalTransaction.date;
    const opening = getOpeningCash(date);

    const updatedTransactions = [...transactions, reversalTransaction].sort(
      (a, b) => a.timestamp - b.timestamp
    );
    const withBalance = calculateRunningBalance(updatedTransactions, opening);

    setTransactions(withBalance);
    saveData(withBalance, openingCashMap, cashCounts);

    return withBalance.find((t) => t.id === id)!;
  };

  const addCashCount = (cashCount: CashCount) => {
    const updated = [...cashCounts.filter((c) => c.date !== cashCount.date), cashCount];
    setCashCounts(updated);
    saveData(transactions, openingCashMap, updated);
  };

  const getDailySummary = (date: string): DailySummary => {
    const openingCash = getOpeningCash(date);
    const dayTransactions = transactions.filter((t) => t.date === date && !t.isReversal);

    let cashIn = 0;
    let cashOut = 0;
    let gCashTotal = 0;
    let mayaTotal = 0;
    let bankTotal = 0;

    dayTransactions.forEach((t) => {
      if (t.flowType === 'TRANSFER') return;

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
      transactionCount: dayTransactions.filter((t) => t.flowType !== 'TRANSFER').length,
    };
  };

  const getTransactionsByDate = (date: string): Transaction[] => {
    return transactions.filter((t) => t.date === date);
  };

  const getCashCountByDate = (date: string): CashCount | undefined => {
    return cashCounts.find((c) => c.date === date);
  };

  const getCurrentBalance = (date: string): number => {
    const dayTransactions = transactions
      .filter((t) => t.date === date)
      .sort((a, b) => a.timestamp - b.timestamp);

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
    getCurrentBalance,
  };
}