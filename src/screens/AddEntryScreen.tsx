import { useState } from 'react';
import { Save, User, Home, ArrowRightLeft, Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

import type { FlowType, PaymentMethod, TransactionCategory, RoomType, RoomStatus } from '@/types';
import { INFLOW_CATEGORIES, OUTFLOW_CATEGORIES, EXPENSE_SUBCATEGORIES, ROOM_TYPES, ROOM_STATUSES, ALL_ROOMS, CATEGORIES_REQUIRING_GUEST_NAME } from '@/types';

interface AddEntryScreenProps {
  appStore: {
    currentUser: { id: string; name: string } | null;
    addTransaction: (data: any) => void;
  };
}

const ROOMS_BY_TYPE = {
  'Casa Clara': ALL_ROOMS.filter(r => r.roomType === 'Casa Clara'),
  'Casa Grande': ALL_ROOMS.filter(r => r.roomType === 'Casa Grande'),
  'Casa Doble': ALL_ROOMS.filter(r => r.roomType === 'Casa Doble'),
};

interface ChargeItem {
  id: string;
  category: TransactionCategory;
  amount: string;
}

interface RoomBooking {
  id: string;
  roomType: RoomType;
  quantity: number;
}

// Quick add categories
const QUICK_ADD_CATEGORIES: { label: string; category: TransactionCategory }[] = [
  { label: 'Room Payment', category: 'Room Payment' },
  { label: 'Early Check-in', category: 'Early Check-in Fee' },
  { label: 'Late Check-out', category: 'Late Check-out Fee' },
  { label: 'Extra Pax', category: 'Extra Guest Fee' },
];

export function AddEntryScreen({ appStore }: AddEntryScreenProps) {
  const [flowType, setFlowType] = useState<FlowType>('IN');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
  const [transferTo, setTransferTo] = useState<PaymentMethod>('Cash');
  const [guestName, setGuestName] = useState('');
  const [notes, setNotes] = useState('');
  const [expenseSubcategory, setExpenseSubcategory] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Multiple charges
  const [charges, setCharges] = useState<ChargeItem[]>([
    { id: '1', category: 'Room Payment', amount: '' }
  ]);
  
  // Room bookings
  const [roomBookings, setRoomBookings] = useState<RoomBooking[]>([]);
  
  // Room status update
  const [updateRoomStatus, setUpdateRoomStatus] = useState(false);
  const [roomStatusToSet, setRoomStatusToSet] = useState<RoomStatus>('Check in');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

  // Security deposit
  const [secDepAmount, setSecDepAmount] = useState('');

  const isTransfer = flowType === 'TRANSFER';
  const isCashIn = flowType === 'IN';
  const isCashOut = flowType === 'OUT';
  const isExpense = isCashOut && charges.some(c => c.category === 'Expense');
  
  // Check if any charge is "Room Payment w/ Security Dep" with non-cash payment
  const hasSecDepCategory = charges.some(c => c.category === 'Room Payment w/ Security Dep');
  const isNonCashPayment = paymentMethod !== 'Cash';
  const showSecDepField = isCashIn && hasSecDepCategory && isNonCashPayment;
  
  const requiresGuestName = charges.some(c => CATEGORIES_REQUIRING_GUEST_NAME.includes(c.category));
  const showGuestFields = !isTransfer && !isCashOut;
  const showMultipleCharges = isCashIn;

  const getCategories = () => {
    if (flowType === 'IN') return INFLOW_CATEGORIES;
    if (flowType === 'OUT') return OUTFLOW_CATEGORIES;
    return ['Transfer'] as TransactionCategory[];
  };

  const handleFlowTypeChange = (type: FlowType) => {
    setFlowType(type);
    if (type === 'IN') {
      setCharges([{ id: '1', category: 'Room Payment', amount: '' }]);
      setPaymentMethod('Cash');
    } else if (type === 'OUT') {
      setCharges([{ id: '1', category: 'Expense', amount: '' }]);
      setPaymentMethod('Cash');
    } else if (type === 'TRANSFER') {
      setCharges([{ id: '1', category: 'Transfer', amount: '' }]);
      setPaymentMethod('GCash');
      setTransferTo('Cash');
    }
    setUpdateRoomStatus(false);
    setSelectedRoomIds([]);
    setSecDepAmount('');
  };

  // Quick add category
  const handleQuickAdd = (category: TransactionCategory) => {
    if (!isCashIn) return;
    if (charges.length === 1 && !charges[0].amount) {
      // Replace first empty charge
      setCharges([{ ...charges[0], category }]);
    } else {
      setCharges([...charges, { id: Date.now().toString(), category, amount: '' }]);
    }
  };

  // Charge management
  const addCharge = () => {
    if (!isCashIn) return;
    setCharges([...charges, { id: Date.now().toString(), category: 'Room Payment' as TransactionCategory, amount: '' }]);
  };

  const removeCharge = (id: string) => {
    if (charges.length > 1) {
      setCharges(charges.filter(c => c.id !== id));
    }
  };

  const updateCharge = (id: string, field: keyof ChargeItem, value: string) => {
    setCharges(charges.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const getTotalAmount = () => {
    return charges.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  };

  // Auto-format amount input
  const formatAmountInput = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    return cleaned;
  };

  // Room booking management
  const addRoomBooking = () => {
    setRoomBookings([...roomBookings, { id: Date.now().toString(), roomType: 'Casa Clara', quantity: 1 }]);
  };

  const removeRoomBooking = (id: string) => {
    setRoomBookings(roomBookings.filter(rb => rb.id !== id));
  };

  const updateRoomBooking = (id: string, field: keyof RoomBooking, value: any) => {
    setRoomBookings(roomBookings.map(rb => rb.id === id ? { ...rb, [field]: value } : rb));
  };

  // Room selection
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRoomIds(prev => 
      prev.includes(roomId) 
        ? prev.filter(id => id !== roomId)
        : [...prev, roomId]
    );
  };

  const getSelectedRoomDisplay = () => {
    return selectedRoomIds.map(id => {
      const room = ALL_ROOMS.find(r => r.id === id);
      return room?.displayName || id;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const totalAmount = getTotalAmount();
    const secDep = parseFloat(secDepAmount) || 0;
    
    const transactionData: any = {
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      timestamp: now.getTime(),
      staffId: appStore.currentUser!.id,
      staffName: appStore.currentUser!.name,
      flowType,
      amount: totalAmount,
      paymentMethod,
      notes: isExpense && expenseSubcategory ? `${expenseSubcategory}: ${notes}` : notes,
      isReversal: false,
      charges: charges.map(c => ({
        category: c.category,
        amount: parseFloat(c.amount) || 0
      })),
      category: charges[0]?.category || 'Room Payment'
    };

    if (isTransfer) {
      transactionData.transferTo = transferTo;
    }

    if (requiresGuestName) {
      transactionData.guestName = guestName;
    } else if (guestName) {
      transactionData.guestName = guestName;
    }

    if (roomBookings.length > 0) {
      transactionData.roomBookings = roomBookings.map(rb => ({
        roomType: rb.roomType,
        quantity: rb.quantity
      }));
    }

    // Room status update
    if (isCashIn && updateRoomStatus && selectedRoomIds.length > 0) {
      transactionData.roomStatusUpdate = {
        status: roomStatusToSet,
        roomIds: selectedRoomIds
      };
    }

    // Security deposit auto-split for non-cash payments
    if (showSecDepField && secDep > 0) {
      transactionData.securityDeposit = {
        amount: secDep,
        roomBookings: roomBookings.map(rb => ({ roomType: rb.roomType, quantity: rb.quantity })),
        guestName: guestName || undefined,
        roomStatusUpdate: updateRoomStatus && selectedRoomIds.length > 0 ? {
          status: roomStatusToSet,
          roomIds: selectedRoomIds
        } : undefined
      };
    }

    appStore.addTransaction(transactionData);
    
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setCharges([{ id: '1', category: 'Room Payment', amount: '' }]);
      setGuestName('');
      setRoomBookings([]);
      setSelectedRoomIds([]);
      setNotes('');
      setExpenseSubcategory('');
      setUpdateRoomStatus(false);
      setSecDepAmount('');
    }, 1500);
  };

  const formatCurrency = (value: number) => {
    if (isNaN(value)) return '';
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(value);
  };

  return (
    <div className="bg-gray-100 min-h-full">
      <header className="bg-blue-700 text-white sticky top-0 z-10 shadow-lg">
        <div className="px-4 py-4">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-bold">Add Entry</h1>
              <p className="text-sm text-blue-200">New Transaction</p>
            </div>
          </div>
        </div>
      </header>

      {showSuccess && (
        <div className="fixed top-20 left-4 right-4 z-50">
          <Alert className="bg-green-100 border-green-500">
            <AlertDescription className="text-green-800 font-semibold text-center">
              Transaction saved successfully!
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div className="p-4 space-y-4">
        {/* Flow Type */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">Transaction Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleFlowTypeChange('IN')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-3 transition-all ${
                  flowType === 'IN'
                    ? 'bg-green-500 border-green-600 text-white shadow-lg scale-105'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-green-300'
                }`}
              >
                <span className="text-3xl font-bold mb-1">+</span>
                <span className="font-bold text-lg">Cash In</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleFlowTypeChange('OUT')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-3 transition-all ${
                  flowType === 'OUT'
                    ? 'bg-red-500 border-red-600 text-white shadow-lg scale-105'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-red-300'
                }`}
              >
                <span className="text-3xl font-bold mb-1">−</span>
                <span className="font-bold text-lg">Cash Out</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleFlowTypeChange('TRANSFER')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border-3 transition-all ${
                  flowType === 'TRANSFER'
                    ? 'bg-blue-500 border-blue-600 text-white shadow-lg scale-105'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300'
                }`}
              >
                <ArrowRightLeft className="w-6 h-6 mb-1" />
                <span className="font-bold text-lg">Transfer</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Add Buttons - Cash In only */}
        {isCashIn && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-gray-700">Quick Add</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_ADD_CATEGORIES.map(qa => (
                  <button
                    key={qa.category}
                    type="button"
                    onClick={() => handleQuickAdd(qa.category)}
                    className="p-3 rounded-xl bg-gray-100 hover:bg-blue-100 border border-gray-200 hover:border-blue-300 transition-all text-sm font-bold text-gray-700 hover:text-blue-700"
                  >
                    {qa.label}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Charges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700 flex items-center justify-between">
              <span>Charges</span>
              {showMultipleCharges && (
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCharge}
                  className="h-10 px-4 text-sm font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Charge
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {charges.map((charge) => (
              <div key={charge.id} className="space-y-3">
                {/* Category - Full width */}
                <Select 
                  value={charge.category} 
                  onValueChange={(v) => updateCharge(charge.id, 'category', v)}
                >
                  <SelectTrigger className="h-14 text-base w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {getCategories().map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-base py-3">{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Amount - Full width with auto-format */}
                <div className="relative w-full">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500 font-bold">₱</span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={charge.amount}
                    onChange={(e) => updateCharge(charge.id, 'amount', formatAmountInput(e.target.value))}
                    className="h-14 text-xl font-bold pl-10 w-full"
                  />
                </div>
                
                {showMultipleCharges && charges.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-10 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => removeCharge(charge.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove Charge
                  </Button>
                )}
                
                {charges.length > 1 && charge.id !== charges[charges.length - 1].id && (
                  <hr className="border-gray-200 my-4" />
                )}
              </div>
            ))}
            
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <span className="text-gray-600 font-bold text-lg">Total Amount:</span>
              <span className="text-3xl font-black text-gray-900">{formatCurrency(getTotalAmount())}</span>
            </div>
          </CardContent>
        </Card>

        {/* Security Deposit Amount (non-cash only) */}
        {showSecDepField && (
          <Card className="border-2 border-orange-200 bg-orange-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-orange-800">
                Security Deposit Amount
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-orange-700">
                Since payment is {paymentMethod}, the system will auto-create:
                <br/>1. Room Payment entry
                <br/>2. Security Deposit entry  
                <br/>3. Cash Movement entry (Cash Out)
              </p>
              <div className="relative w-full">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-500 font-bold">₱</span>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Security deposit amount"
                  value={secDepAmount}
                  onChange={(e) => setSecDepAmount(formatAmountInput(e.target.value))}
                  className="h-14 text-xl font-bold pl-10 w-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer Details */}
        {isTransfer && (
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-blue-800">Transfer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-blue-800 text-base font-medium">From</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <SelectTrigger className="h-14 text-base w-full">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['GCash', 'Cash', 'Maya', 'Bank'] as PaymentMethod[]).map(m => (
                      <SelectItem key={m} value={m} className="text-base py-3">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-blue-800 text-base font-medium">To</Label>
                <Select value={transferTo} onValueChange={(v) => setTransferTo(v as PaymentMethod)}>
                  <SelectTrigger className="h-14 text-base w-full">
                    <SelectValue placeholder="Select destination" />
                  </SelectTrigger>
                  <SelectContent>
                    {(['Cash', 'GCash', 'Maya', 'Bank'] as PaymentMethod[]).map(m => (
                      <SelectItem key={m} value={m} className="text-base py-3">{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {paymentMethod === transferTo && (
                <Alert className="bg-amber-50 border-amber-300">
                  <AlertDescription className="text-amber-800 text-base">
                    Source and destination cannot be the same
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Payment Method */}
        {!isTransfer && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-700">Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {(['Cash', 'GCash', 'Maya', 'Bank'] as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`p-4 rounded-xl border-2 font-bold text-base transition-all ${
                      paymentMethod === method
                        ? method === 'Cash' 
                          ? 'bg-green-500 border-green-600 text-white shadow-md'
                          : method === 'GCash'
                          ? 'bg-blue-500 border-blue-600 text-white shadow-md'
                          : method === 'Maya'
                          ? 'bg-purple-500 border-purple-600 text-white shadow-md'
                          : 'bg-indigo-500 border-indigo-600 text-white shadow-md'
                        : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guest Name */}
        {showGuestFields && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-700">
                Guest Information
                {requiresGuestName && <span className="text-red-500 ml-1">*</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label htmlFor="guestName" className="flex items-center gap-2 text-base font-medium">
                  <User className="w-5 h-5" />
                  Guest Name
                  {requiresGuestName && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="guestName"
                  placeholder="Enter guest name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="h-16 text-xl font-bold w-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Room Bookings */}
        {showGuestFields && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-700 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Home className="w-5 h-5" />
                  Room Booking
                </span>
                <Button 
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRoomBooking}
                  className="h-10 px-4 text-sm font-bold"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Room
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {roomBookings.length === 0 && (
                <p className="text-gray-500 text-center py-4 text-base">
                  No rooms assigned (optional)
                </p>
              )}
              
              {roomBookings.map((booking) => (
                <div key={booking.id} className="space-y-3 p-4 bg-gray-50 rounded-xl">
                  <Select 
                    value={booking.roomType} 
                    onValueChange={(v) => updateRoomBooking(booking.id, 'roomType', v as RoomType)}
                  >
                    <SelectTrigger className="h-14 text-base w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_TYPES.map((rt) => (
                        <SelectItem key={rt} value={rt} className="text-base py-3">{rt}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-base font-medium text-gray-600">Quantity:</span>
                    <div className="flex items-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-xl"
                        onClick={() => updateRoomBooking(booking.id, 'quantity', Math.max(1, booking.quantity - 1))}
                      >
                        <Minus className="w-5 h-5" />
                      </Button>
                      <span className="w-12 text-center font-bold text-2xl">{booking.quantity}</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-12 w-12 rounded-xl"
                        onClick={() => updateRoomBooking(booking.id, 'quantity', booking.quantity + 1)}
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-10 text-red-500 border-red-200 hover:bg-red-50"
                    onClick={() => removeRoomBooking(booking.id)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove Room
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Room Status Update - Cash In ONLY */}
        {isCashIn && (
          <Card className="border-2 border-amber-200 bg-amber-50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold text-amber-800">
                  Update Room Status?
                </CardTitle>
                <Switch
                  checked={updateRoomStatus}
                  onCheckedChange={setUpdateRoomStatus}
                />
              </div>
            </CardHeader>
            
            {updateRoomStatus && (
              <CardContent className="space-y-4">
                <p className="text-base text-amber-700">
                  This will update the status for selected room(s)
                </p>
                
                <Select value={roomStatusToSet} onValueChange={(v) => setRoomStatusToSet(v as RoomStatus)}>
                  <SelectTrigger className="h-14 text-base w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {ROOM_STATUSES.map((status) => (
                      <SelectItem key={status} value={status} className="text-base py-3">{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedRoomIds.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {getSelectedRoomDisplay().map((display, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary"
                        className="px-4 py-2 text-base font-bold bg-blue-100 text-blue-800"
                      >
                        {display}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="space-y-4 pt-2">
                  {(['Casa Clara', 'Casa Grande', 'Casa Doble'] as const).map(type => (
                    <div key={type}>
                      <p className="text-sm font-bold text-gray-500 uppercase mb-2">{type}</p>
                      <div className="grid grid-cols-5 gap-2">
                        {ROOMS_BY_TYPE[type].map(room => (
                          <button
                            key={room.id}
                            type="button"
                            onClick={() => toggleRoomSelection(room.id)}
                            className={`
                              p-3 rounded-lg text-base font-bold transition-all
                              ${selectedRoomIds.includes(room.id)
                                ? type === 'Casa Clara' ? 'bg-blue-500 text-white shadow-md'
                                : type === 'Casa Grande' ? 'bg-orange-500 text-white shadow-md'
                                : 'bg-pink-500 text-white shadow-md'
                                : 'bg-white text-gray-700 hover:bg-gray-100 border'
                              }
                            `}
                          >
                            {room.number}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                {selectedRoomIds.length === 0 && (
                  <p className="text-amber-600 text-base text-center font-medium">Select at least one room to update status</p>
                )}
              </CardContent>
            )}
          </Card>
        )}

        {/* Expense Subcategory */}
        {isExpense && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-gray-700">Expense Type</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={expenseSubcategory} onValueChange={setExpenseSubcategory}>
                <SelectTrigger className="h-14 text-base w-full">
                  <SelectValue placeholder="Select expense type" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {EXPENSE_SUBCATEGORIES.map((sub) => (
                    <SelectItem key={sub} value={sub} className="text-base py-3">{sub}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-gray-700">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] text-lg w-full"
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <Button 
          type="submit"
          onClick={handleSubmit}
          className="w-full h-16 text-xl font-bold"
          disabled={
            getTotalAmount() <= 0 || 
            (isTransfer && paymentMethod === transferTo) ||
            (requiresGuestName && !guestName) ||
            (showSecDepField && (!secDepAmount || parseFloat(secDepAmount) <= 0))
          }
        >
          <Save className="w-6 h-6 mr-2" />
          Save Transaction
        </Button>
      </div>
    </div>
  );
}
