import { useState, useMemo } from 'react';
import { Filter, RotateCcw, User, Search, X, Calendar, Trash2, Edit3, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Transaction, FlowType, PaymentMethod, TransactionCategory } from '@/types';
import { INFLOW_CATEGORIES } from '@/types';
import { format, parseISO, isSameWeek, isSameMonth } from 'date-fns';

interface ManagerViewScreenProps {
  appStore: {
    currentUser: { name: string; role: string } | null;
    transactions: Transaction[];
    logout: () => void;
    editTransaction: (id: string, updates: Partial<Transaction>) => boolean;
    deleteTransaction: (id: string, voidInstead?: boolean) => boolean;
  };
  onReversal: (transactionId: string) => void;
}

type AuditDateRange = 'today' | 'week' | 'month' | 'custom';

export function ManagerViewScreen({ appStore, onReversal }: ManagerViewScreenProps) {
  // Transaction filters
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    staffName: '',
    flowType: '' as FlowType | '',
    paymentMethod: '' as PaymentMethod | '',
    guestName: '',
  });
  
  // Audit states
  const [showAudit, setShowAudit] = useState(false);
  const [auditRange, setAuditRange] = useState<AuditDateRange>('today');
  const [auditCategory, setAuditCategory] = useState<TransactionCategory | 'all'>('all');
  const [auditMethod, setAuditMethod] = useState<PaymentMethod | 'all'>('all');
  const [auditDateFrom, setAuditDateFrom] = useState('');
  const [auditDateTo, setAuditDateTo] = useState('');
  
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState({ category: '', amount: '', notes: '' });
  const [deleteVoid, setDeleteVoid] = useState(true);

  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return appStore.transactions.filter(tx => {
      if (tx.isVoid) return false;
      if (filters.dateFrom && tx.date < filters.dateFrom) return false;
      if (filters.dateTo && tx.date > filters.dateTo) return false;
      if (filters.staffName && !tx.staffName.toLowerCase().includes(filters.staffName.toLowerCase())) return false;
      if (filters.flowType && tx.flowType !== filters.flowType) return false;
      if (filters.paymentMethod && tx.paymentMethod !== filters.paymentMethod) return false;
      if (filters.guestName && !tx.guestName?.toLowerCase().includes(filters.guestName.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.timestamp - a.timestamp);
  }, [appStore.transactions, filters]);

  // Charge Audit calculation
  const auditTransactions = useMemo(() => {
    let txs = appStore.transactions.filter(tx => !tx.isVoid && !tx.isSecDepMovement && tx.flowType !== 'TRANSFER');
    
    // Date range filter
    switch (auditRange) {
      case 'today':
        txs = txs.filter(t => t.date === today);
        break;
      case 'week':
        txs = txs.filter(t => isSameWeek(new Date(t.date), now, { weekStartsOn: 1 }));
        break;
      case 'month':
        txs = txs.filter(t => isSameMonth(new Date(t.date), now));
        break;
      case 'custom':
        if (auditDateFrom) txs = txs.filter(t => t.date >= auditDateFrom);
        if (auditDateTo) txs = txs.filter(t => t.date <= auditDateTo);
        break;
    }
    
    // Category filter
    if (auditCategory !== 'all') {
      txs = txs.filter(t => t.category === auditCategory);
    }
    
    // Payment method filter
    if (auditMethod !== 'all') {
      txs = txs.filter(t => t.paymentMethod === auditMethod);
    }
    
    return txs;
  }, [appStore.transactions, auditRange, auditCategory, auditMethod, auditDateFrom, auditDateTo, today, now]);

  // Audit summary by category
  const auditSummary = useMemo(() => {
    const summary: Record<string, { count: number; total: number }> = {};
    auditTransactions.forEach(tx => {
      if (!summary[tx.category]) {
        summary[tx.category] = { count: 0, total: 0 };
      }
      summary[tx.category].count++;
      summary[tx.category].total += tx.amount;
    });
    return summary;
  }, [auditTransactions]);

  const auditTotal = auditTransactions.reduce((sum, tx) => sum + tx.amount, 0);

  const clearFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      staffName: '',
      flowType: '',
      paymentMethod: '',
      guestName: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== '');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPaymentMethodBadge = (method: PaymentMethod) => {
    switch (method) {
      case 'Cash': return <Badge className="bg-green-600 text-white font-semibold">Cash</Badge>;
      case 'GCash': return <Badge className="bg-blue-600 text-white font-semibold">GCash</Badge>;
      case 'Maya': return <Badge className="bg-purple-600 text-white font-semibold">Maya</Badge>;
      case 'Bank': return <Badge className="bg-indigo-600 text-white font-semibold">Bank</Badge>;
    }
  };

  const handleReversal = (tx: Transaction) => {
    setSelectedTransaction(null);
    onReversal(tx.id);
  };

  const handleEdit = (tx: Transaction) => {
    setEditForm({
      category: tx.category,
      amount: tx.amount.toString(),
      notes: tx.notes
    });
    setShowEditDialog(true);
  };

  const handleSaveEdit = () => {
    if (selectedTransaction) {
      appStore.editTransaction(selectedTransaction.id, {
        category: editForm.category as TransactionCategory,
        amount: parseFloat(editForm.amount) || 0,
        notes: editForm.notes
      });
      setShowEditDialog(false);
      setSelectedTransaction(null);
    }
  };

  const handleDelete = () => {
    if (selectedTransaction) {
      appStore.deleteTransaction(selectedTransaction.id, deleteVoid);
      setShowDeleteDialog(false);
      setSelectedTransaction(null);
    }
  };

  return (
    <div className="bg-gray-100 min-h-full">
      {/* Header */}
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-bold">Manager View</h1>
                <p className="text-sm text-blue-200">All Transactions & Audit</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAudit(!showAudit)}
                className={`text-white hover:bg-blue-600 ${showAudit ? 'bg-blue-600' : ''}`}
              >
                <BarChart3 className="w-4 h-4 mr-1" />
                Audit
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilters(!showFilters)}
                className={`text-white hover:bg-blue-600 ${showFilters ? 'bg-blue-600' : ''}`}
              >
                <Filter className="w-4 h-4 mr-1" />
                Filters
                {hasActiveFilters && (
                  <Badge className="ml-2 bg-white text-blue-700">!</Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Charge Audit Panel */}
      {showAudit && (
        <div className="bg-white border-b shadow-sm p-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Charge Audit
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date Range */}
              <div className="flex gap-2">
                {(['today', 'week', 'month', 'custom'] as AuditDateRange[]).map(r => (
                  <Button
                    key={r}
                    variant={auditRange === r ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAuditRange(r)}
                    className={`flex-1 h-10 text-sm font-bold ${auditRange === r ? 'bg-blue-600' : ''}`}
                  >
                    {r === 'today' ? 'Today' : r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : 'Custom'}
                  </Button>
                ))}
              </div>
              
              {auditRange === 'custom' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">From</Label>
                    <Input type="date" value={auditDateFrom} onChange={e => setAuditDateFrom(e.target.value)} className="h-12" />
                  </div>
                  <div>
                    <Label className="text-sm">To</Label>
                    <Input type="date" value={auditDateTo} onChange={e => setAuditDateTo(e.target.value)} className="h-12" />
                  </div>
                </div>
              )}
              
              {/* Category & Method Filters */}
              <div className="grid grid-cols-2 gap-3">
                <Select value={auditCategory} onValueChange={(v) => setAuditCategory(v as TransactionCategory | 'all')}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {INFLOW_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={auditMethod} onValueChange={(v) => setAuditMethod(v as PaymentMethod | 'all')}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="All Methods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="GCash">GCash</SelectItem>
                    <SelectItem value="Maya">Maya</SelectItem>
                    <SelectItem value="Bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Results */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Transactions:</span>
                  <span className="font-bold text-lg">{auditTransactions.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Revenue:</span>
                  <span className="font-black text-2xl text-green-700">{formatCurrency(auditTotal)}</span>
                </div>
                
                <Separator />
                
                {/* Category Breakdown */}
                {Object.entries(auditSummary).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-gray-700">By Category:</p>
                    {Object.entries(auditSummary).map(([cat, data]) => (
                      <div key={cat} className="flex justify-between items-center py-1">
                        <span className="text-sm text-gray-600">{cat} ({data.count})</span>
                        <span className="font-bold text-sm">{formatCurrency(data.total)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm p-4">
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Filter Transactions</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600">
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Date From</Label>
                  <Input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Calendar className="w-4 h-4"/> Date To</Label>
                  <Input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="w-4 h-4"/> Staff Name</Label>
                  <Input placeholder="Search staff..." value={filters.staffName} onChange={e => setFilters({...filters, staffName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Flow Type</Label>
                  <Select value={filters.flowType} onValueChange={v => setFilters({...filters, flowType: v as FlowType})}>
                    <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="IN">Cash In</SelectItem>
                      <SelectItem value="OUT">Cash Out</SelectItem>
                      <SelectItem value="TRANSFER">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={filters.paymentMethod} onValueChange={v => setFilters({...filters, paymentMethod: v as PaymentMethod})}>
                    <SelectTrigger><SelectValue placeholder="All methods" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All methods</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="GCash">GCash</SelectItem>
                      <SelectItem value="Maya">Maya</SelectItem>
                      <SelectItem value="Bank">Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Search className="w-4 h-4"/> Guest Name</Label>
                  <Input placeholder="Search guest..." value={filters.guestName} onChange={e => setFilters({...filters, guestName: e.target.value})} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-gray-700 text-lg">
            Showing <span className="font-bold">{filteredTransactions.length}</span> transactions
          </p>
          {hasActiveFilters && (
            <Badge variant="outline" className="text-gray-600 text-base">Filters applied</Badge>
          )}
        </div>

        {/* Transactions Table */}
        <Card className="shadow-lg overflow-hidden border-2 border-gray-300">
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[60vh]">
              <table className="w-full text-sm">
                <thead className="bg-gray-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 border-b-2 border-gray-300">Date/Time</th>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 border-b-2 border-gray-300">Type</th>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 border-b-2 border-gray-300">Category</th>
                    <th className="px-3 py-3 text-right font-bold text-gray-800 border-b-2 border-gray-300">Amount</th>
                    <th className="px-3 py-3 text-center font-bold text-gray-800 border-b-2 border-gray-300">Method</th>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 border-b-2 border-gray-300">Guest</th>
                    <th className="px-3 py-3 text-left font-bold text-gray-800 border-b-2 border-gray-300">Staff</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500 text-lg">
                        No transactions match your filters
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((tx) => (
                      <tr 
                        key={tx.id} 
                        className={`border-b hover:bg-blue-50 cursor-pointer transition-colors ${
                          tx.isReversal ? 'bg-red-50' : 
                          tx.isSecDepMovement ? 'bg-orange-50' :
                          tx.editedByManager ? 'bg-blue-50' :
                          'bg-white'
                        }`}
                        onClick={() => setSelectedTransaction(tx)}
                      >
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="font-mono text-sm">{tx.time}</div>
                          <div className="text-xs text-gray-500">{format(parseISO(tx.date), 'MMM d')}</div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {tx.flowType === 'IN' && <Badge className="bg-green-500 text-white">IN</Badge>}
                          {tx.flowType === 'OUT' && <Badge className="bg-red-500 text-white">OUT</Badge>}
                          {tx.flowType === 'TRANSFER' && <Badge className="bg-blue-500 text-white">TRF</Badge>}
                          {tx.isReversal && <span className="ml-1 text-xs text-red-600 font-bold">(REV)</span>}
                          {tx.editedByManager && <span className="ml-1 text-xs text-blue-600 font-bold">(EDT)</span>}
                          {tx.isSecDepMovement && <span className="ml-1 text-xs text-orange-600 font-bold">(MOV)</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <span className="font-medium">{tx.category}</span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-right">
                          <span className={`font-bold text-base ${
                            tx.flowType === 'IN' ? 'text-green-700' : 
                            tx.flowType === 'OUT' ? 'text-red-700' : 
                            'text-blue-700'
                          }`}>
                            {tx.flowType === 'IN' ? '+' : tx.flowType === 'OUT' ? '−' : '↔'}
                            {formatCurrency(tx.amount)}
                          </span>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-center">
                          {getPaymentMethodBadge(tx.paymentMethod)}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">{tx.guestName || '-'}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-xs">{tx.staffName}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={!!selectedTransaction} onOpenChange={() => setSelectedTransaction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>View and manage transaction</DialogDescription>
          </DialogHeader>
          
          {selectedTransaction && (
            <div className="space-y-4">
              {selectedTransaction.editedByManager && (
                <Alert className="bg-blue-50 border-blue-300">
                  <AlertDescription className="text-blue-800 font-semibold text-center">
                    Edited by Manager
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-semibold">{format(parseISO(selectedTransaction.date), 'MMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Time</p>
                  <p className="font-semibold">{selectedTransaction.time}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-semibold text-lg">{selectedTransaction.category}</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Payment Method</p>
                  {getPaymentMethodBadge(selectedTransaction.paymentMethod)}
                </div>
              </div>

              {selectedTransaction.guestName && (
                <div>
                  <p className="text-sm text-gray-500">Guest</p>
                  <p className="font-semibold">{selectedTransaction.guestName}</p>
                </div>
              )}

              {selectedTransaction.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="text-gray-700 bg-gray-50 p-2 rounded">{selectedTransaction.notes}</p>
                </div>
              )}

              {/* Manager Actions */}
              {appStore.currentUser?.role === 'manager' && (
                <>
                  <Separator />
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline"
                      className="h-12"
                      onClick={() => handleEdit(selectedTransaction)}
                    >
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-12 text-orange-600 border-orange-300"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                    {!selectedTransaction.isReversal && (
                      <Button 
                        variant="destructive"
                        className="h-12"
                        onClick={() => handleReversal(selectedTransaction)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reverse
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category</Label>
              <Input value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} className="h-12" />
            </div>
            <div>
              <Label>Amount</Label>
              <Input 
                type="number" 
                value={editForm.amount} 
                onChange={e => setEditForm({...editForm, amount: e.target.value})} 
                className="h-12"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="h-12" />
            </div>
            <Button onClick={handleSaveEdit} className="w-full h-12 font-bold">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete/Void Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">Choose how to handle this transaction:</p>
            <div className="flex gap-3">
              <Button 
                variant={deleteVoid ? 'default' : 'outline'}
                className="flex-1 h-14"
                onClick={() => setDeleteVoid(true)}
              >
                Mark as Void
              </Button>
              <Button 
                variant={!deleteVoid ? 'destructive' : 'outline'}
                className="flex-1 h-14"
                onClick={() => setDeleteVoid(false)}
              >
                Permanent Delete
              </Button>
            </div>
            <Button onClick={handleDelete} variant="destructive" className="w-full h-12 font-bold">
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
