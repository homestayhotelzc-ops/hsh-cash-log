import { useState, useMemo } from 'react';
import { Printer, ChevronLeft, ChevronRight, Save, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { format } from 'date-fns';
interface DailySummaryScreenProps {
  appStore: {
    currentUser: { name: string } | null;
    transactions: Transaction[];
    getDailySummary: (date: string) => {
      openingCash: number;
      cashIn: number;
      cashOut: number;
      expectedEndingCash: number;
      gCashTotal: number;
      mayaTotal: number;
      bankTotal: number;
    };
    addCashCount: (data: any) => void;
    getCashCountByDate: (date: string) => { actualCash: number; status: string; difference: number } | undefined;
  };
}

import type { Transaction } from '@/types';

export function DailySummaryScreen({ appStore }: DailySummaryScreenProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [actualCash, setActualCash] = useState('');
  const [cashCountNotes, setCashCountNotes] = useState('');
  const [showCashCountSuccess, setShowCashCountSuccess] = useState(false);

  const summary = useMemo(() => appStore.getDailySummary(selectedDate), [appStore, selectedDate]);
  const existingCount = useMemo(() => appStore.getCashCountByDate(selectedDate), [appStore, selectedDate]);
  
  // Category breakdown for selected date
  const categoryBreakdown = useMemo(() => {
    const dayTxs = appStore.transactions.filter(t => t.date === selectedDate && !t.isVoid && !t.isSecDepMovement && t.flowType !== 'TRANSFER');
    const breakdown: Record<string, { count: number; total: number }> = {};
    dayTxs.forEach(tx => {
      if (!breakdown[tx.category]) breakdown[tx.category] = { count: 0, total: 0 };
      breakdown[tx.category].count++;
      breakdown[tx.category].total += tx.amount;
    });
    return breakdown;
  }, [appStore.transactions, selectedDate]);

  const handlePrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handlePrint = () => {
    window.print();
  };

  const isNegativeBalance = summary.expectedEndingCash < 0;

  // Cash Count Logic
  const expectedCash = summary.expectedEndingCash;
  const actualCashNum = parseFloat(actualCash) || 0;
  const difference = actualCashNum - expectedCash;
  
  let cashCountStatus: 'Balanced' | 'Short' | 'Over' = 'Balanced';
  if (difference < 0) cashCountStatus = 'Short';
  else if (difference > 0) cashCountStatus = 'Over';

  const handleCashCountSubmit = () => {
    const cashCount = {
      date: selectedDate,
      expectedCash,
      actualCash: actualCashNum,
      difference,
      status: cashCountStatus,
      countedBy: appStore.currentUser!.name,
      countedAt: new Date().toISOString(),
      notes: cashCountNotes
    };

    appStore.addCashCount(cashCount);
    setShowCashCountSuccess(true);
    setTimeout(() => setShowCashCountSuccess(false), 2000);
  };

  const getStatusColors = (s: string) => {
    switch (s) {
      case 'Balanced': return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-800', badge: 'bg-green-500' };
      case 'Short': return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-800', badge: 'bg-red-500' };
      case 'Over': return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-800', badge: 'bg-yellow-500' };
      default: return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-800', badge: 'bg-gray-500' };
    }
  };

  const statusColors = getStatusColors(cashCountStatus);

  return (
    <div className="bg-gray-100 min-h-full">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg print:hidden">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold">Daily Summary</h1>
                <p className="text-sm text-blue-200">End of Day Report</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handlePrint}
              className="text-white hover:bg-blue-600"
            >
              <Printer className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Date Navigation */}
      <div className="bg-white border-b px-4 py-4 print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePrevDay} className="h-10 w-10">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="text-center">
            <p className="text-xl font-bold">
              {format(new Date(selectedDate), 'MMMM d, yyyy')}
            </p>
            <p className="text-sm text-gray-500">
              {format(new Date(selectedDate), 'EEEE')}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextDay} className="h-10 w-10">
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Print Header */}
      <div className="hidden print:block p-8 text-center">
        <h1 className="text-3xl font-bold">HSH Cash Log</h1>
        <p className="text-xl">Home Stay Hotel - Daily Summary</p>
        <p className="text-gray-600 text-lg mt-2">{format(new Date(selectedDate), 'EEEE, MMMM d, yyyy')}</p>
        <p className="text-gray-600">Generated by: {appStore.currentUser?.name}</p>
      </div>

      {/* Summary Content */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Main Cash Summary */}
        <Card className={`border-3 shadow-xl ${isNegativeBalance ? 'border-red-400' : 'border-blue-400'}`}>
          <CardHeader className={`py-4 ${isNegativeBalance ? 'bg-red-50' : 'bg-blue-50'}`}>
            <CardTitle className={`text-xl font-bold text-center ${isNegativeBalance ? 'text-red-900' : 'text-blue-900'}`}>
              Cash Position Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {/* Opening Balance */}
            <div className="flex justify-between items-center py-3">
              <span className="text-gray-700 font-semibold text-lg">Opening Cash</span>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(summary.openingCash)}</span>
            </div>

            <Separator className="border-gray-300" />

            {/* Cash In */}
            <div className="flex justify-between items-center py-3">
              <span className="text-green-700 font-bold text-xl flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700">+</span>
                Cash In
              </span>
              <span className="text-3xl font-bold text-green-600">{formatCurrency(summary.cashIn)}</span>
            </div>

            {/* Cash Out */}
            <div className="flex justify-between items-center py-3">
              <span className="text-red-700 font-bold text-xl flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-700">−</span>
                Cash Out
              </span>
              <span className="text-3xl font-bold text-red-600">{formatCurrency(summary.cashOut)}</span>
            </div>

            <Separator className="border-2 border-gray-400" />

            {/* Expected Ending Cash */}
            <div className={`rounded-xl p-5 -mx-2 ${
              isNegativeBalance 
                ? 'bg-red-100 border-3 border-red-500' 
                : 'bg-blue-100 border-3 border-blue-500'
            }`}>
              <div className="flex justify-between items-center">
                <span className={`font-bold text-xl ${isNegativeBalance ? 'text-red-900' : 'text-blue-900'}`}>
                  Expected Cash on Hand
                </span>
                <span className={`text-4xl font-bold ${isNegativeBalance ? 'text-red-700' : 'text-blue-900'}`}>
                  {formatCurrency(summary.expectedEndingCash)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        {Object.keys(categoryBreakdown).length > 0 && (
          <Card className="border-2 border-gray-300">
            <CardHeader className="py-4 bg-gray-50">
              <CardTitle className="text-base font-bold text-gray-700 uppercase">
                Category Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 p-4">
              {Object.entries(categoryBreakdown).map(([cat, data]) => (
                <div key={cat} className="flex justify-between items-center py-2 bg-gray-50 rounded-lg px-4">
                  <span className="text-gray-700 font-medium">{cat} <span className="text-gray-400 text-sm">({data.count})</span></span>
                  <span className="font-bold text-lg">{formatCurrency(data.total)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Digital Wallets */}
        <Card className="border-2 border-gray-300">
          <CardHeader className="py-4 bg-gray-50">
            <CardTitle className="text-base font-bold text-gray-700 uppercase">
              Digital Wallets
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="flex justify-between items-center py-3 bg-blue-50 rounded-lg px-4 border border-blue-200">
              <span className="text-blue-800 font-semibold text-lg">GCash Total</span>
              <span className="text-2xl font-bold text-blue-900">{formatCurrency(summary.gCashTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-purple-50 rounded-lg px-4 border border-purple-200">
              <span className="text-purple-800 font-semibold text-lg">Maya Total</span>
              <span className="text-2xl font-bold text-purple-900">{formatCurrency(summary.mayaTotal)}</span>
            </div>
            <div className="flex justify-between items-center py-3 bg-indigo-50 rounded-lg px-4 border border-indigo-200">
              <span className="text-indigo-800 font-semibold text-lg">Bank Total</span>
              <span className="text-2xl font-bold text-indigo-900">{formatCurrency(summary.bankTotal)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Cash Count Section */}
        <Card className="border-4 border-amber-400 shadow-xl">
          <CardHeader className="py-4 bg-amber-100">
            <CardTitle className="text-xl font-bold text-center text-amber-900">
              Cash Count
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 p-6">
            {/* Expected Cash Display */}
            <div className="bg-amber-50 rounded-xl p-4 border-2 border-amber-300">
              <p className="text-sm text-amber-700 font-semibold text-center">Expected Cash</p>
              <p className="text-4xl font-bold text-center text-amber-900">{formatCurrency(expectedCash)}</p>
            </div>

            {/* Success Message */}
            {showCashCountSuccess && (
              <Alert className="bg-green-100 border-green-500">
                <AlertDescription className="text-green-800 font-bold text-center">
                  Cash count saved!
                </AlertDescription>
              </Alert>
            )}

            {/* Previous Count */}
            {existingCount && (
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-300">
                <p className="text-sm text-gray-600 font-semibold mb-2">Previous Count Today</p>
                <div className="flex justify-between items-center">
                  <span>Actual: {formatCurrency(existingCount.actualCash)}</span>
                  <Badge className={getStatusColors(existingCount.status).badge + ' text-white'}>
                    {existingCount.status}
                  </Badge>
                </div>
              </div>
            )}

            {/* Actual Cash Input */}
            <div className="space-y-3">
              <Label className="text-lg font-bold text-gray-800">Actual Cash Count</Label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl text-gray-500 font-bold">₱</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="h-20 text-4xl font-bold pl-14 text-center border-3"
                />
              </div>
            </div>

            {actualCash && (
              <>
                <Separator className="border-2" />

                {/* Difference Display */}
                <div className={`rounded-xl p-5 border-4 ${statusColors.bg} ${statusColors.border}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {cashCountStatus === 'Balanced' && <CheckCircle className={`w-8 h-8 ${statusColors.text}`} />}
                      {cashCountStatus === 'Short' && <AlertTriangle className={`w-8 h-8 ${statusColors.text}`} />}
                      {cashCountStatus === 'Over' && <TrendingUp className={`w-8 h-8 ${statusColors.text}`} />}
                      <div>
                        <p className={`text-sm font-semibold ${statusColors.text}`}>Difference</p>
                        <p className={`text-2xl font-bold ${statusColors.text}`}>
                          {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                        </p>
                      </div>
                    </div>
                    <Badge className={`text-xl px-4 py-2 font-bold ${statusColors.badge} text-white`}>
                      {cashCountStatus}
                    </Badge>
                  </div>
                </div>

                {/* Status Messages */}
                {cashCountStatus === 'Balanced' && (
                  <Alert className="bg-green-50 border-green-400">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <AlertDescription className="text-green-800 font-bold">Cash is balanced!</AlertDescription>
                  </Alert>
                )}
                {cashCountStatus === 'Short' && (
                  <Alert className="bg-red-50 border-red-400">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <AlertDescription className="text-red-800 font-bold">
                      Cash is SHORT by {formatCurrency(Math.abs(difference))}
                    </AlertDescription>
                  </Alert>
                )}
                {cashCountStatus === 'Over' && (
                  <Alert className="bg-yellow-50 border-yellow-400">
                    <TrendingUp className="w-5 h-5 text-yellow-600" />
                    <AlertDescription className="text-yellow-800 font-bold">
                      Cash is OVER by {formatCurrency(difference)}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Notes (optional)</Label>
                  <textarea
                    value={cashCountNotes}
                    onChange={(e) => setCashCountNotes(e.target.value)}
                    placeholder="Add notes about the cash count..."
                    className="w-full min-h-[80px] p-3 border-2 rounded-lg resize-none"
                  />
                </div>

                {/* Save Button */}
                <Button 
                  onClick={handleCashCountSubmit}
                  className="w-full h-16 text-xl font-bold"
                >
                  <Save className="w-6 h-6 mr-2" />
                  Save Cash Count
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Print Footer */}
      <div className="hidden print:block p-8 text-center text-gray-500 text-sm mt-12">
        <p>--- End of Report ---</p>
        <p className="mt-2">HSH Cash Log - Home Stay Hotel</p>
      </div>
    </div>
  );
}
