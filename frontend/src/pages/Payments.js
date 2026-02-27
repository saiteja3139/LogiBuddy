import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    payment_direction: 'RECEIVED',
    party_type: 'CUSTOMER',
    party_id: '',
    amount: 0,
    payment_date: new Date().toISOString().split('T')[0],
    mode: 'NEFT',
    reference: '',
    notes: ''
  });

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchTransporters();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setPayments(response.data);
    } catch (error) {
      toast.error('Failed to load payments');
    }
  };

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data);
    } catch (error) {}
  };

  const fetchTransporters = async () => {
    try {
      const response = await api.get('/transporters');
      setTransporters(response.data);
    } catch (error) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', formData);
      toast.success('Payment recorded successfully');
      setDialogOpen(false);
      setFormData({
        payment_direction: 'RECEIVED', party_type: 'CUSTOMER', party_id: '',
        amount: 0, payment_date: new Date().toISOString().split('T')[0],
        mode: 'NEFT', reference: '', notes: ''
      });
      fetchPayments();
    } catch (error) {
      toast.error('Failed to record payment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await api.delete(`/payments/${id}`);
        toast.success('Payment deleted successfully');
        fetchPayments();
      } catch (error) {
        toast.error('Failed to delete payment');
      }
    }
  };

  const getPartyName = (partyType, partyId) => {
    if (partyType === 'CUSTOMER') {
      const customer = customers.find(c => c.id === partyId);
      return customer ? customer.name : 'Unknown';
    } else {
      const transporter = transporters.find(t => t.id === partyId);
      return transporter ? transporter.name : 'Unknown';
    }
  };

  const parties = formData.party_type === 'CUSTOMER' ? customers : transporters;

  return (
    <div className="space-y-6" data-testid="payments-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading">Payments</h1>
          <p className="text-muted-foreground mt-2">Track receivables and payables</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-payment-btn">
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Payment Direction *</Label>
                  <Select required value={formData.payment_direction} onValueChange={(value) => setFormData({ ...formData, payment_direction: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RECEIVED">Received (from Customer)</SelectItem>
                      <SelectItem value="PAID">Paid (to Transporter)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Party Type *</Label>
                  <Select required value={formData.party_type} onValueChange={(value) => setFormData({ ...formData, party_type: value, party_id: '' })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                      <SelectItem value="TRANSPORTER">Transporter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Party *</Label>
                  <Select required value={formData.party_id} onValueChange={(value) => setFormData({ ...formData, party_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                    <SelectContent>
                      {parties.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount (₹) *</Label>
                  <Input required type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Payment Date *</Label>
                  <Input required type="date" value={formData.payment_date} onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })} />
                </div>
                <div>
                  <Label>Mode *</Label>
                  <Select required value={formData.mode} onValueChange={(value) => setFormData({ ...formData, mode: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="NEFT">NEFT</SelectItem>
                      <SelectItem value="RTGS">RTGS</SelectItem>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CHEQUE">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reference (UTR/Cheque No)</Label>
                  <Input value={formData.reference} onChange={(e) => setFormData({ ...formData, reference: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Notes</Label>
                  <Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">Record Payment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Date</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Direction</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Party</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Amount</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Mode</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Reference</th>
              <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-muted/50 transition-colors" data-testid="payment-row">
                <td className="py-2 px-4 text-sm">{formatDate(payment.payment_date)}</td>
                <td className="py-2 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-sm text-xs font-medium ${
                    payment.payment_direction === 'RECEIVED' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}>
                    {payment.payment_direction}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm">
                  <div>{getPartyName(payment.party_type, payment.party_id)}</div>
                  <div className="text-xs text-muted-foreground">{payment.party_type}</div>
                </td>
                <td className="py-2 px-4 text-sm font-medium">{formatCurrency(payment.amount)}</td>
                <td className="py-2 px-4 text-sm">{payment.mode}</td>
                <td className="py-2 px-4 text-sm">{payment.reference || '-'}</td>
                <td className="py-2 px-4 text-sm text-right space-x-2">
                  <Link to={`/payments/${payment.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(payment.id)}>
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <div className="text-center py-8 text-muted-foreground">No payments found</div>}
      </div>
    </div>
  );
}
