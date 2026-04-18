import { useState, useMemo } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { Screen } from '@/App';
import { format } from 'date-fns';

interface CashCountScreenProps {
  appStore: {
    currentUser: { name: string } | null;
    getDailySummary: (date: string) => { expectedEndingCash: number };
    addCashCount: (data: any) => void;
    getCashCountByDate: (date: string) => { actualCash: number; status: string; difference: number } | undefined;
  };
  onNavigate: (screen: Screen) => void;
}

export function CashCountScreen({ appStore, onNavigate }: CashCountScreenProps) {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];
  const summary = useMemo(() => appStore.getDailySummary(today), [appStore, today]);
  const existingCount = useMemo(() => appStore.getCashCountByDate(today), [appStore, today]);

  const expectedCash = summary.expectedEndingCash;
  const actualCashNum = parseFloat(actualCash) || 0;
  const difference = actualCashNum - expectedCash;
  
  let status: 'Balanced' | 'Short' | 'Over' = 'Balanced';
  if (difference < 0) status = 'Short';
  else if (difference > 0) status = 'Over';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cashCount = {
      date: today,
      expectedCash,
      actualCash: actualCashNum,
      difference,
      status,
      countedBy: appStore.currentUser!.name,
      countedAt: new Date().toISOString(),
      notes
    };

    appStore.addCashCount(cashCount);
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const getStatusColors = (s: string) => {
    switch (s) {
      case 'Balanced': return {
        bg: 'bg-green-100',
        border: 'border-green-500',
        text: 'text-green-800',
        badge: 'bg-green-500 text-white',
        icon: 'text-green-600'
      };
      case 'Short': return {
        bg: 'bg-red-100',
        border: 'border-red-500',
        text: 'text-red-800',
        badge: 'bg-red-500 text-white',
        icon: 'text-red-600'
      };
      case 'Over': return {
        bg: 'bg-yellow-100',
        border: 'border-yellow-500',
        text: 'text-yellow-800',
        badge: 'bg-yellow-500 text-white',
        icon: 'text-yellow-600'
      };
      default: return {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-800',
        badge: 'bg-gray-500 text-white',
        icon: 'text-gray-600'
      };
    }
  };

  const statusColors = getStatusColors(status);

  return (
    <div className="min-h-screen bg-gray-100 pb-8">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onNavigate('cash-log')}
              className="text-white hover:bg-blue-600 -ml-2"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Cash Count</h1>
              <p className="text-sm text-blue-200">End of Day Verification</p>
            </div>
          </div>
        </div>
      </header>

      {/* Success Alert */}
      {showSuccess && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <Alert className="bg-green-100 border-green-500">
            <AlertDescription className="text-green-800 font-semibold text-center text-lg">
              Cash count saved successfully!
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 space-y-4 max-w-2xl mx-auto">
        {/* Date Display */}
        <div className="text-center py-2">
          <p className="text-xl font-bold text-gray-800">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>

        {/* Expected Cash Card - BIG Display */}
        <Card className="border-4 border-blue-500 shadow-xl">
          <CardHeader className="bg-blue-600 py-6">
            <CardTitle className="text-center text-xl font-bold text-white">
              Expected Cash on Hand
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-10">
            <p className="text-6xl font-bold text-center text-blue-900">
              {formatCurrency(expectedCash)}
            </p>
            <p className="text-center text-gray-500 mt-3 text-lg">
              Based on all transactions today
            </p>
          </CardContent>
        </Card>

        {/* Actual Cash Input */}
        <Card className="border-2 border-gray-300">
          <CardHeader className="py-4 bg-gray-50">
            <CardTitle className="text-base font-bold text-gray-700">
              Actual Cash Count
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="actualCash" className="text-xl font-bold text-gray-800">
                  Enter Actual Cash Amount
                </Label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-3xl text-gray-500 font-bold">₱</span>
                  <Input
                    id="actualCash"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={actualCash}
                    onChange={(e) => setActualCash(e.target.value)}
                    className="h-24 text-5xl font-bold pl-14 text-center border-3"
                    required
                  />
                </div>
              </div>

              {actualCash && (
                <>
                  <Separator className="border-2" />

                  {/* Difference Display */}
                  <div className={`rounded-xl p-6 border-4 ${statusColors.bg} ${statusColors.border}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {status === 'Balanced' && <CheckCircle className={`w-10 h-10 ${statusColors.icon}`} />}
                        {status === 'Short' && <AlertTriangle className={`w-10 h-10 ${statusColors.icon}`} />}
                        {status === 'Over' && <TrendingUp className={`w-10 h-10 ${statusColors.icon}`} />}
                        <div>
                          <p className={`text-sm font-semibold ${statusColors.text}`}>Difference</p>
                          <p className={`text-3xl font-bold ${statusColors.text}`}>
                            {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                          </p>
                        </div>
                      </div>
                      <Badge 
                        className={`text-xl px-5 py-3 font-bold ${statusColors.badge}`}
                      >
                        {status}
                      </Badge>
                    </div>
                  </div>

                  {/* Status Message */}
                  {status === 'Balanced' && (
                    <Alert className="bg-green-50 border-green-400">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                      <AlertDescription className="text-green-800 font-bold text-lg">
                        Cash is balanced! Great job.
                      </AlertDescription>
                    </Alert>
                  )}
                  {status === 'Short' && (
                    <Alert className="bg-red-50 border-red-400">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                      <AlertDescription className="text-red-800 font-bold text-lg">
                        Cash is SHORT by {formatCurrency(Math.abs(difference))}
                      </AlertDescription>
                    </Alert>
                  )}
                  {status === 'Over' && (
                    <Alert className="bg-yellow-50 border-yellow-400">
                      <TrendingUp className="w-6 h-6 text-yellow-600" />
                      <AlertDescription className="text-yellow-800 font-bold text-lg">
                        Cash is OVER by {formatCurrency(difference)}
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-lg font-medium">Notes (optional)</Label>
                    <textarea
                      id="notes"
                      placeholder="Add any notes about the cash count..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full min-h-[100px] p-4 border-2 rounded-lg resize-none text-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-16 text-xl font-bold"
                  >
                    <Save className="w-6 h-6 mr-2" />
                    Save Cash Count
                  </Button>
                </>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Previous Count */}
        {existingCount && (
          <Card className="bg-gray-50 border-2 border-gray-300">
            <CardHeader className="py-4">
              <CardTitle className="text-base font-bold text-gray-700">
                Previous Count Today
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-lg">Actual Cash:</span>
                <span className="font-bold text-xl">{formatCurrency(existingCount.actualCash)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-lg">Difference:</span>
                <span className={`font-bold text-xl ${
                  existingCount.difference < 0 ? 'text-red-600' : 
                  existingCount.difference > 0 ? 'text-yellow-600' : 
                  'text-green-600'
                }`}>
                  {existingCount.difference >= 0 ? '+' : ''}{formatCurrency(existingCount.difference)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-lg">Status:</span>
                <Badge className={getStatusColors(existingCount.status).badge + ' text-lg px-4 py-2'}>
                  {existingCount.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <div className="text-center text-base text-gray-500 space-y-2 py-4">
          <p>Count all physical cash in the register</p>
          <p>Include all bills and coins</p>
          <p className="font-semibold text-gray-600">Do NOT include GCash, Maya, or Bank transfers</p>
        </div>
      </div>
    </div>
  );
}
