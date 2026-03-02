import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function Trips() {
  const [trips, setTrips] = useState([]);
  const [orders, setOrders] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [formData, setFormData] = useState({
    order_id: '',
    transporter_id: '',
    truck_id: '',
    trip_date: new Date().toISOString().split('T')[0],
    delivered_date: '',
    qty_mt: 0,
    payable_amount: 0,
    customer_bill_amount: 0,
    status: 'PLANNED'
  });

  useEffect(() => {
    fetchTrips();
    fetchOrders();
    fetchTransporters();
    fetchTrucks();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await api.get('/trips');
      setTrips(response.data);
    } catch (error) {
      toast.error('Failed to load trips');
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await api.get('/orders');
      setOrders(response.data);
    } catch (error) {}
  };

  const fetchTransporters = async () => {
    try {
      const response = await api.get('/transporters');
      setTransporters(response.data);
    } catch (error) {}
  };

  const fetchTrucks = async () => {
    try {
      const response = await api.get('/trucks');
      setTrucks(response.data);
    } catch (error) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTrip) {
        await api.put(`/trips/${editingTrip.id}`, formData);
        toast.success('Trip updated successfully');
      } else {
        await api.post('/trips', formData);
        toast.success('Trip created successfully');
      }
      setDialogOpen(false);
      setEditingTrip(null);
      resetForm();
      fetchTrips();
    } catch (error) {
      toast.error(editingTrip ? 'Failed to update trip' : 'Failed to create trip');
    }
  };

  const resetForm = () => {
    setFormData({
      order_id: '', transporter_id: '', truck_id: '',
      trip_date: new Date().toISOString().split('T')[0],
      delivered_date: '', qty_mt: 0, payable_amount: 0,
      customer_bill_amount: 0, status: 'PLANNED'
    });
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setFormData(trip);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this trip?')) {
      try {
        await api.delete(`/trips/${id}`);
        toast.success('Trip deleted successfully');
        fetchTrips();
      } catch (error) {
        toast.error('Failed to delete trip');
      }
    }
  };

  const getOrderNumber = (id) => {
    const order = orders.find(o => o.id === id);
    return order ? order.order_number : 'Unknown';
  };

  const getTransporterName = (id) => {
    const transporter = transporters.find(t => t.id === id);
    return transporter ? transporter.name : 'Unknown';
  };

  const getTruckNumber = (id) => {
    const truck = trucks.find(t => t.id === id);
    return truck ? truck.truck_number : 'Unknown';
  };

  return (
    <div className="space-y-6" data-testid="trips-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading">Trips</h1>
          <p className="text-muted-foreground mt-2">Track trip execution and deliveries</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) { setEditingTrip(null); resetForm(); }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-trip-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Trip
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTrip ? 'Edit Trip' : 'Add New Trip'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Order *</Label>
                  <Select required value={formData.order_id} onValueChange={(value) => setFormData({ ...formData, order_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select order" /></SelectTrigger>
                    <SelectContent>
                      {orders.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.order_number} - {o.origin} → {o.destination}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Transporter *</Label>
                  <Select required value={formData.transporter_id} onValueChange={(value) => setFormData({ ...formData, transporter_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select transporter" /></SelectTrigger>
                    <SelectContent>
                      {transporters.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Truck *</Label>
                  <Select required value={formData.truck_id} onValueChange={(value) => setFormData({ ...formData, truck_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select truck" /></SelectTrigger>
                    <SelectContent>
                      {trucks.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.truck_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Trip Date *</Label>
                  <Input required type="date" value={formData.trip_date} onChange={(e) => setFormData({ ...formData, trip_date: e.target.value })} />
                </div>
                <div>
                  <Label>Delivered Date</Label>
                  <Input type="date" value={formData.delivered_date} onChange={(e) => setFormData({ ...formData, delivered_date: e.target.value })} />
                </div>
                <div>
                  <Label>Quantity (MT) *</Label>
                  <Input required type="number" step="0.01" value={formData.qty_mt} onChange={(e) => setFormData({ ...formData, qty_mt: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Payable Amount (₹) *</Label>
                  <Input required type="number" step="0.01" value={formData.payable_amount} onChange={(e) => setFormData({ ...formData, payable_amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Customer Bill Amount (₹) *</Label>
                  <Input required type="number" step="0.01" value={formData.customer_bill_amount} onChange={(e) => setFormData({ ...formData, customer_bill_amount: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">{editingTrip ? 'Update Trip' : 'Create Trip'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Trip #</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Order</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Truck</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Qty (MT)</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Status</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Date</th>
              <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trips.map((trip) => (
              <tr key={trip.id} className="hover:bg-muted/50 transition-colors" data-testid="trip-row">
                <td className="py-2 px-4 text-sm font-medium">{trip.trip_number}</td>
                <td className="py-2 px-4 text-sm">{getOrderNumber(trip.order_id)}</td>
                <td className="py-2 px-4 text-sm">{getTruckNumber(trip.truck_id)}</td>
                <td className="py-2 px-4 text-sm">{trip.qty_mt}</td>
                <td className="py-2 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-sm text-xs font-medium ${
                    trip.status === 'DELIVERED' ? 'bg-success/10 text-success' :
                    trip.status === 'IN_TRANSIT' ? 'bg-info/10 text-info' :
                    trip.status === 'PLANNED' ? 'bg-warning/10 text-warning' :
                    'bg-error/10 text-error'
                  }`}>
                    {trip.status}
                  </span>
                </td>
                <td className="py-2 px-4 text-sm">{formatDate(trip.trip_date)}</td>
                <td className="py-2 px-4 text-sm text-right space-x-2">
                  <Link to={`/trips/${trip.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(trip)}>
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(trip.id)}>
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trips.length === 0 && <div className="text-center py-8 text-muted-foreground">No trips found</div>}
      </div>
    </div>
  );
}
