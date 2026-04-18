import { useState } from 'react';
import { RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { Screen } from '@/App';
import type { Transaction } from '@/types';
import { format, parseISO } from 'date-fns';

interface ReversalScreenProps {
  appStore: {
    currentUser: { name: string } | null;
    transactions: Transaction[];
    addReversal: (originalTransaction: Transaction, reason: string) => void;
  };
  onNavigate: (screen: Screen) => void;
  transactionId: string | null;
}

export function ReversalScreen({ appStore, onNavigate, transactionId }: ReversalScreenProps) {
  const [reason, setReason] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const originalTransaction = appStore.transactions.find(t => t.id === transactionId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!originalTransaction) return;

    appStore.addReversal(originalTransaction, reason);
    setShowSuccess(true);
    
    setTimeout(() => {
      onNavigate('cash-log');
    }, 2000);
  };

  if (!originalTransaction) {
    return (
      <div className="bg-gray-100 min-h-full">
        <header className="bg-blue-700 text-white px-4 py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold">Reversal Entry</h1>
          </div>
        </header>
        <div className="p-8 text-center">
          <p className="text-gray-500 text-lg">Transaction not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-full">
      {/* Header */}
      <header className="bg-red-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold">Reversal Entry</h1>
              <p className="text-sm text-red-200">Correct Mistakes</p>
            </div>
          </div>
        </div>
      </header>

      {/* Success Alert */}
      {showSuccess && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <Alert className="bg-green-100 border-green-500">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <AlertDescription className="text-green-800 font-semibold text-center text-lg">
              Reversal created successfully! Redirecting...
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Warning Alert */}
        <Alert className="bg-amber-50 border-amber-400 border-2">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
          <AlertDescription className="text-amber-800 text-base">
            <strong>Important:</strong> Reversals create a new opposite transaction. 
            Original transactions cannot be edited or deleted.
          </AlertDescription>
        </Alert>

        {/* Original Transaction Card */}
        <Card className="border-2 border-gray-300">
          <CardHeader className="bg-gray-50 py-4">
            <CardTitle className="text-base font-bold text-gray-700">
              Original Transaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Date & Time</span>
              <span className="font-semibold">
                {format(parseISO(originalTransaction.date), 'MMM d, yyyy')} at {originalTransaction.time}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Category</span>
              <span className="font-semibold">{originalTransaction.category}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Type</span>
              <Badge className={originalTransaction.flowType === 'IN' ? 'bg-green-600' : originalTransaction.flowType === 'OUT' ? 'bg-red-600' : 'bg-blue-600'}>
                {originalTransaction.flowType === 'IN' ? 'Cash In' : originalTransaction.flowType === 'OUT' ? 'Cash Out' : 'Transfer'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Amount</span>
              <span className={`text-2xl font-bold ${originalTransaction.flowType === 'IN' ? 'text-green-700' : originalTransaction.flowType === 'OUT' ? 'text-red-700' : 'text-blue-700'}`}>
                {formatCurrency(originalTransaction.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Payment Method</span>
              <Badge 
                className={
                  originalTransaction.paymentMethod === 'Cash' ? 'bg-green-600' : 
                  originalTransaction.paymentMethod === 'GCash' ? 'bg-blue-600' :
                  originalTransaction.paymentMethod === 'Maya' ? 'bg-purple-600' :
                  'bg-indigo-600'
                }
              >
                {originalTransaction.paymentMethod}
              </Badge>
            </div>
            {originalTransaction.guestName && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Guest</span>
                <span className="font-semibold">{originalTransaction.guestName}</span>
              </div>
            )}
            {originalTransaction.roomBookings && originalTransaction.roomBookings.length > 0 && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-600">Rooms</span>
                <span className="font-semibold">
                  {originalTransaction.roomBookings.map(rb => `${rb.roomType}×${rb.quantity}`).join(', ')}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-gray-600">Staff</span>
              <span className="font-semibold">{originalTransaction.staffName}</span>
            </div>
            {originalTransaction.notes && (
              <div className="pt-2 border-t">
                <span className="text-gray-600 text-sm">Original Notes:</span>
                <p className="text-gray-700 mt-1 bg-gray-50 p-2 rounded">{originalTransaction.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reversal Preview */}
        <Card className="border-2 border-red-300 bg-red-50">
          <CardHeader className="bg-red-100 py-4">
            <CardTitle className="text-base font-bold text-red-800">
              Reversal Transaction (Preview)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="flex items-center justify-between py-2 border-b border-red-200">
              <span className="text-red-700">Type</span>
              <Badge className={originalTransaction.flowType === 'IN' ? 'bg-red-600' : originalTransaction.flowType === 'OUT' ? 'bg-green-600' : 'bg-blue-600'}>
                {originalTransaction.flowType === 'IN' ? 'Cash Out (Reversal)' : originalTransaction.flowType === 'OUT' ? 'Cash In (Reversal)' : 'Transfer (Reversal)'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-red-200">
              <span className="text-red-700">Amount</span>
              <span className={`text-2xl font-bold ${originalTransaction.flowType === 'IN' ? 'text-red-700' : originalTransaction.flowType === 'OUT' ? 'text-green-700' : 'text-blue-700'}`}>
                {originalTransaction.flowType === 'IN' ? '−' : originalTransaction.flowType === 'OUT' ? '+' : '↔'}
                {formatCurrency(originalTransaction.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-red-700">Payment Method</span>
              <span className="font-semibold text-red-800">{originalTransaction.paymentMethod}</span>
            </div>
          </CardContent>
        </Card>

        {/* Reversal Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base font-bold text-gray-700">
                Reversal Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-2">
                <Label htmlFor="reason" className="text-lg font-medium">
                  Reason for Reversal <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  id="reason"
                  placeholder="Explain why this reversal is needed..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="min-h-[120px] text-lg"
                  required
                />
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <input
                  type="checkbox"
                  id="confirm"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 w-6 h-6"
                />
                <Label htmlFor="confirm" className="text-base cursor-pointer">
                  I confirm that I want to create a reversal for this transaction. 
                  I understand this action cannot be undone and will create a new opposite transaction.
                </Label>
              </div>
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            className="w-full h-16 text-xl font-bold bg-red-600 hover:bg-red-700"
            disabled={!reason.trim() || !confirmed}
          >
            <RotateCcw className="w-6 h-6 mr-2" />
            Create Reversal Entry
          </Button>
        </form>

        {/* Info Box */}
        <div className="text-center text-base text-gray-500 space-y-2 py-4">
          <p>Reversal transactions are marked and linked to the original.</p>
          <p>Both transactions remain visible in the logbook.</p>
        </div>
      </div>
    </div>
  );
}
