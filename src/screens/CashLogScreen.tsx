import { useState, useMemo } from 'react';
import { 
  LogOut, 
  ChevronLeft,
  ChevronRight,
  Hotel,
  AlertCircle,
  Wallet,
  Search,
  X,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Transaction, PaymentMethod } from '@/types';
import { ALL_ROOMS } from '@/types';
import { format, isSameWeek, isSameMonth } from 'date-fns';

interface CashLogScreenProps {
  appStore: {
    currentUser: { name: string; role: string } | null;
    transactions: Transaction[];
    getOpeningCash: (date: string) => number;
    setDailyOpeningCash: (date: string, amount: number) => boolean;
    isOpeningCashSet: (date: string) => boolean;
    logout: () => void;
    getDailySummary: (date: string) => {
      openingCash: number;
      cashIn: number;
      cashOut: number;
      expectedEndingCash: number;
      gCashTotal: number;
      mayaTotal: number;
      bankTotal: number;
    };
  };
  onReversal: (transactionId: string) => void;
}

type DateFilter = 'today' | 'week' | 'month' | 'custom';

export function CashLogScreen({ appStore }: CashLogScreenProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [openingCashInput, setOpeningCashInput] = useState('');
  const [showOpeningCashSet, setShowOpeningCashSet] = useState(false);
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('today');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  
  const summary = useMemo(() => appStore.getDailySummary(selectedDate), [appStore, selectedDate]);
  const openingCashSet = useMemo(() => appStore.isOpeningCashSet(selectedDate), [appStore, selectedDate]);
  
  const today = new Date().toISOString().split('T')[0];
  const now = new Date();

  // Filter transactions by date filter
  const filteredTransactions = useMemo(() => {
    let txs = appStore.transactions;
    
    // Apply date filter
    switch (dateFilter) {
      case 'today':
        txs = txs.filter(t => t.date === today);
        break;
      case 'week':
        txs = txs.filter(t => {
          const txDate = new Date(t.date);
          return isSameWeek(txDate, now, { weekStartsOn: 1 });
        });
        break;
      case 'month':
        txs = txs.filter(t => {
          const txDate = new Date(t.date);
          return isSameMonth(txDate, now);
        });
        break;
      case 'custom':
        txs = txs.filter(t => t.date === selectedDate);
        break;
    }
    
    // Apply search filter (guest name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      txs = txs.filter(t => 
        (t.guestName?.toLowerCase().includes(q)) ||
        (t.category?.toLowerCase().includes(q)) ||
        (t.staffName?.toLowerCase().includes(q))
      );
    }
    
    // Apply payment method filter
    if (methodFilter !== 'all') {
      txs = txs.filter(t => t.paymentMethod === methodFilter);
    }
    
    // Sort by timestamp descending (newest first)
    return txs.sort((a, b) => b.timestamp - a.timestamp);
  }, [appStore.transactions, dateFilter, selectedDate, today, now, searchQuery, methodFilter]);

  // Day transactions for opening cash (custom date only)
  const dayTransactions = useMemo(() => {
    return appStore.transactions
      .filter(t => t.date === selectedDate)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [appStore.transactions, selectedDate]);

  const handlePrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
    setDateFilter('custom');
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
    setDateFilter('custom');
  };

  const handleSetOpeningCash = () => {
    const amount = parseFloat(openingCashInput);
    if (amount >= 0) {
      const success = appStore.setDailyOpeningCash(selectedDate, amount);
      if (success) {
        setShowOpeningCashSet(true);
        setOpeningCashInput('');
        setTimeout(() => setShowOpeningCashSet(false), 2000);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'Cash':
        return <Badge className="bg-green-600 text-white font-semibold px-2 py-1">Cash</Badge>;
      case 'GCash':
        return <Badge className="bg-blue-600 text-white font-semibold px-2 py-1">GCash</Badge>;
      case 'Maya':
        return <Badge className="bg-purple-600 text-white font-semibold px-2 py-1">Maya</Badge>;
      case 'Bank':
        return <Badge className="bg-indigo-600 text-white font-semibold px-2 py-1">Bank</Badge>;
    }
  };

  // Get amount color by payment method
  const getAmountColor = (method: PaymentMethod) => {
    switch (method) {
      case 'Cash': return 'text-green-700';
      case 'GCash': return 'text-blue-700';
      case 'Maya': return 'text-purple-700';
      case 'Bank': return 'text-indigo-700';
    }
  };

  // Get amount display for In column
  const getInAmount = (tx: Transaction) => {
    if (tx.flowType === 'IN') {
      return <span className={`font-bold text-base ${getAmountColor(tx.paymentMethod)}`}>+{formatCurrency(tx.amount)}</span>;
    }
    if (tx.flowType === 'TRANSFER') {
      return <span className="text-blue-700 font-bold text-base">+{formatCurrency(tx.amount)}</span>;
    }
    return <span className="text-gray-400">-</span>;
  };

  // Get amount display for Out column
  const getOutAmount = (tx: Transaction) => {
    if (tx.flowType === 'OUT') {
      return <span className={`font-bold text-base ${getAmountColor(tx.paymentMethod)}`}>−{formatCurrency(tx.amount)}</span>;
    }
    return <span className="text-gray-400">-</span>;
  };

  const isNegativeBalance = summary.expectedEndingCash < 0;

  const quickDateFilters: { label: string; value: DateFilter }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
  ];

  return (
    <div className="bg-gray-100 min-h-full">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-20 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Hotel className="w-7 h-7" />
              <div>
                <h1 className="text-xl font-bold leading-tight">HSH Cash Log</h1>
                <p className="text-xs text-blue-200">Home Stay Hotel</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm hidden sm:inline">{appStore.currentUser?.name}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={appStore.logout}
                className="text-white hover:bg-blue-600"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Search & Filter Bar */}
      <div className="bg-white border-b px-4 py-3 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search by guest, category, or staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-12 pl-10 text-base w-full"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        {/* Quick Date Filters */}
        <div className="flex gap-2">
          {quickDateFilters.map(f => (
            <Button
              key={f.value}
              variant={dateFilter === f.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateFilter(f.value)}
              className={`flex-1 h-10 text-sm font-bold ${dateFilter === f.value ? 'bg-blue-600' : ''}`}
            >
              <Calendar className="w-4 h-4 mr-1" />
              {f.label}
            </Button>
          ))}
          <Button
            variant={dateFilter === 'custom' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDateFilter('custom')}
            className={`h-10 text-sm font-bold ${dateFilter === 'custom' ? 'bg-blue-600' : ''}`}
          >
            Custom
          </Button>
        </div>

        {/* Payment Method Filter */}
        <div className="flex gap-2 flex-wrap">
          {(['all', 'Cash', 'GCash', 'Maya', 'Bank'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMethodFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                methodFilter === m
                  ? m === 'Cash' ? 'bg-green-500 text-white'
                  : m === 'GCash' ? 'bg-blue-500 text-white'
                  : m === 'Maya' ? 'bg-purple-500 text-white'
                  : m === 'Bank' ? 'bg-indigo-500 text-white'
                  : 'bg-gray-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m === 'all' ? 'All Methods' : m}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Date Navigation (only when custom filter) */}
      {dateFilter === 'custom' && (
        <div className="bg-gray-50 border-b px-4 py-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handlePrevDay} className="h-10 w-10">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="text-center">
              <p className="text-base font-bold">
                {format(new Date(selectedDate), 'EEE, MMM d, yyyy')}
              </p>
              {selectedDate === today && (
                <p className="text-xs text-green-600 font-bold">TODAY</p>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={handleNextDay} className="h-10 w-10">
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>
      )}

      {/* Opening Cash Setup (only for custom/today date) */}
      {(dateFilter === 'custom' || dateFilter === 'today') && !openingCashSet && selectedDate === today && (
        <div className="p-4">
          <Card className="border-2 border-amber-400 bg-amber-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-bold text-amber-800 flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Start Day - Set Opening Cash
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-amber-700">
                Please enter the starting cash amount for today. This can only be set once per day.
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500 font-bold">₱</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value)}
                    className="h-14 text-xl font-bold pl-10"
                  />
                </div>
                <Button 
                  onClick={handleSetOpeningCash}
                  className="h-14 px-6 text-lg font-bold bg-amber-600 hover:bg-amber-700"
                  disabled={!openingCashInput || parseFloat(openingCashInput) < 0}
                >
                  Set
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Opening Cash Set Confirmation */}
      {showOpeningCashSet && (
        <div className="px-4 pb-2">
          <Alert className="bg-green-100 border-green-500">
            <AlertDescription className="text-green-800 font-semibold text-center">
              Opening cash set successfully!
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Daily Totals - Show only for Today/Custom */}
      {(dateFilter === 'today' || dateFilter === 'custom') && (
        <div className="p-4 space-y-4">
          <Card className={`border-2 shadow-lg ${isNegativeBalance ? 'border-red-400' : 'border-blue-300'}`}>
            <CardHeader className="pb-2 bg-gray-50">
              <CardTitle className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                Daily Cash Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {/* Opening Cash */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-gray-600 text-lg">Opening Cash</span>
                <span className="font-bold text-gray-800 text-xl">{formatCurrency(summary.openingCash)}</span>
              </div>
              
              {/* Cash In */}
              <div className="flex justify-between items-center py-2">
                <span className="text-green-700 font-bold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm">+</span>
                  Cash In
                </span>
                <span className="font-bold text-green-700 text-2xl">{formatCurrency(summary.cashIn)}</span>
              </div>
              
              {/* Cash Out */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200">
                <span className="text-red-700 font-bold text-lg flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center text-red-700 text-sm">−</span>
                  Cash Out
                </span>
                <span className="font-bold text-red-700 text-2xl">{formatCurrency(summary.cashOut)}</span>
              </div>
              
              {/* Expected Ending Cash */}
              <div className={`flex justify-between items-center py-4 px-4 rounded-xl -mx-1 ${
                isNegativeBalance 
                  ? 'bg-red-100 border-2 border-red-400' 
                  : 'bg-blue-100 border-2 border-blue-400'
              }`}>
                <span className={`font-bold text-lg ${isNegativeBalance ? 'text-red-900' : 'text-blue-900'}`}>
                  Expected Cash on Hand
                </span>
                <span className={`font-bold text-3xl ${isNegativeBalance ? 'text-red-700' : 'text-blue-900'}`}>
                  {formatCurrency(summary.expectedEndingCash)}
                </span>
              </div>

              {isNegativeBalance && (
                <Alert className="bg-red-50 border-red-400">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <AlertDescription className="text-red-800 font-semibold">
                    Warning: Cash balance is negative!
                  </AlertDescription>
                </Alert>
              )}

              <Separator />

              {/* Other Payment Methods */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-1">GCash</p>
                  <p className="font-bold text-blue-900 text-lg">{formatCurrency(summary.gCashTotal)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 text-center border border-purple-200">
                  <p className="text-xs text-purple-700 font-semibold mb-1">Maya</p>
                  <p className="font-bold text-purple-900 text-lg">{formatCurrency(summary.mayaTotal)}</p>
                </div>
                <div className="bg-indigo-50 rounded-lg p-3 text-center border border-indigo-200">
                  <p className="text-xs text-indigo-700 font-semibold mb-1">Bank</p>
                  <p className="font-bold text-indigo-900 text-lg">{formatCurrency(summary.bankTotal)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* LOGBOOK TABLE */}
      <div className="p-4 space-y-4">
        {/* Transaction Count */}
        <div className="flex justify-between items-center px-1">
          <p className="text-base text-gray-700">
            Transactions: <span className="font-bold text-lg">{filteredTransactions.length}</span>
          </p>
          {(dateFilter === 'today' || dateFilter === 'custom') && dayTransactions.length > 0 && (
            <p className="text-sm text-gray-500">
              Latest: {dayTransactions[0]?.time}
            </p>
          )}
        </div>

        <Card className="shadow-lg overflow-hidden border-2 border-gray-300">
          <CardHeader className="bg-gray-100 py-4 border-b-2 border-gray-300">
            <CardTitle className="text-base font-bold text-gray-800 uppercase tracking-wide">
              Cash Logbook
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300">Time</th>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300">Guest</th>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300">Room</th>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300">Category</th>
                    <th className="px-3 py-3 text-right font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300">In</th>
                    <th className="px-3 py-3 text-right font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300">Out</th>
                    <th className="px-3 py-3 text-center font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300">Method</th>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300">Staff</th>
                    <th className="px-3 py-3 text-right font-bold text-gray-800 whitespace-nowrap border-b-2 border-gray-300 bg-yellow-100">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-gray-500 text-lg">
                        No transactions found
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx, index) => {
                      const isLatest = index === 0; // Newest first
                      return (
                        <tr 
                          key={tx.id} 
                          className={`border-b hover:bg-blue-50 transition-colors ${
                            tx.isReversal ? 'bg-red-50' : 
                            tx.isSecDepMovement ? 'bg-orange-50' :
                            isLatest ? 'bg-green-50' :
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                          }`}
                        >
                          <td className="px-3 py-3 whitespace-nowrap font-mono text-sm font-medium">
                            {tx.time}
                            <div className="text-xs text-gray-400">{tx.date}</div>
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">{tx.guestName || '-'}</td>
                          <td className="px-3 py-3 whitespace-nowrap text-sm">
                            {tx.roomStatusUpdate?.roomIds && tx.roomStatusUpdate.roomIds.length > 0 ? (
                              tx.roomStatusUpdate.roomIds.map(roomId => {
                                const room = ALL_ROOMS.find(r => r.id === roomId);
                                return room ? `${room.displayName} - ${room.roomType}` : roomId;
                              }).join(', ')
                            ) : tx.roomBookings && tx.roomBookings.length > 0 ? (
                              tx.roomBookings.map(rb => `${rb.roomType}${rb.quantity > 1 ? `×${rb.quantity}` : ''}`).join(', ')
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap">
                            <span className={tx.flowType === 'IN' ? 'text-green-700 font-semibold' : tx.flowType === 'OUT' ? 'text-red-700 font-semibold' : 'text-blue-700 font-semibold'}>
                              {tx.category}
                            </span>
                            {tx.isReversal && (
                              <span className="ml-1 text-xs text-red-600 font-bold">(REV)</span>
                            )}
                            {tx.isSecDepMovement && (
                              <span className="ml-1 text-xs text-orange-600 font-bold">(MOV)</span>
                            )}
                            {tx.flowType === 'TRANSFER' && (
                              <span className="ml-1 text-xs text-blue-600">{tx.paymentMethod}→{tx.transferTo}</span>
                            )}
                          </td>
                          {/* In Column - ALL payment methods */}
                          <td className="px-3 py-3 whitespace-nowrap text-right">
                            {getInAmount(tx)}
                          </td>
                          {/* Out Column - ALL payment methods */}
                          <td className="px-3 py-3 whitespace-nowrap text-right">
                            {getOutAmount(tx)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            {getPaymentMethodBadge(tx.paymentMethod)}
                          </td>
                          <td className="px-3 py-3 whitespace-nowrap text-xs">{tx.staffName}</td>
                          <td className={`px-3 py-3 whitespace-nowrap text-right font-mono font-bold text-base bg-yellow-50/50 ${
                            tx.runningBalance < 0 ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {tx.paymentMethod === 'Cash' || tx.flowType === 'TRANSFER' || tx.isSecDepMovement ? (
                              formatCurrency(tx.runningBalance)
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
