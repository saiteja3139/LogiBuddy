import { useEffect, useState } from 'react';
import api from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Trucks() {
  const [trucks, setTrucks] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState(null);
  const [formData, setFormData] = useState({
    transporter_id: '',
    truck_number: '',
    truck_type: '',
    capacity_mt: 0,
    rc_expiry_date: '',
    insurance_expiry_date: ''
  });

  useEffect(() => {
    fetchTrucks();
    fetchTransporters();
  }, []);

  const fetchTrucks = async () => {
    try {
      const response = await api.get('/trucks');
      setTrucks(response.data);
    } catch (error) {
      toast.error('Failed to load trucks');
    }
  };

  const fetchTransporters = async () => {
    try {
      const response = await api.get('/transporters');
      setTransporters(response.data);
    } catch (error) {
      toast.error('Failed to load transporters');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTruck) {
        await api.put(`/trucks/${editingTruck.id}`, formData);
        toast.success('Truck updated successfully');
      } else {
        await api.post('/trucks', formData);
        toast.success('Truck created successfully');
      }
      setDialogOpen(false);
      setEditingTruck(null);
      setFormData({ transporter_id: '', truck_number: '', truck_type: '', capacity_mt: 0, rc_expiry_date: '', insurance_expiry_date: '' });
      fetchTrucks();
    } catch (error) {
      toast.error(editingTruck ? 'Failed to update truck' : 'Failed to create truck');
    }
  };

  const handleEdit = (truck) => {
    setEditingTruck(truck);
    setFormData(truck);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this truck?')) {
      try {
        await api.delete(`/trucks/${id}`);
        toast.success('Truck deleted successfully');
        fetchTrucks();
      } catch (error) {
        toast.error('Failed to delete truck');
      }
    }
  };

  const getTransporterName = (id) => {
    const transporter = transporters.find(t => t.id === id);
    return transporter ? transporter.name : 'Unknown';
  };

  return (
    <div className="space-y-6" data-testid="trucks-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading">Trucks</h1>
          <p className="text-muted-foreground mt-2">Manage your truck fleet</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingTruck(null);
            setFormData({ transporter_id: '', truck_number: '', truck_type: '', capacity_mt: 0, rc_expiry_date: '', insurance_expiry_date: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button data-testid="add-truck-btn">
              <Plus className="w-4 h-4 mr-2" />
              Add Truck
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingTruck ? 'Edit Truck' : 'Add New Truck'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Transporter *</Label>
                  <Select required value={formData.transporter_id} onValueChange={(value) => setFormData({ ...formData, transporter_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select transporter" />
                    </SelectTrigger>
                    <SelectContent>
                      {transporters.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Truck Number *</Label>
                  <Input required value={formData.truck_number} onChange={(e) => setFormData({ ...formData, truck_number: e.target.value })} placeholder="MH02AB1234" />
                </div>
                <div>
                  <Label>Truck Type</Label>
                  <Input value={formData.truck_type} onChange={(e) => setFormData({ ...formData, truck_type: e.target.value })} placeholder="Open/Closed/Container" />
                </div>
                <div>
                  <Label>Capacity (MT)</Label>
                  <Input type="number" step="0.01" value={formData.capacity_mt} onChange={(e) => setFormData({ ...formData, capacity_mt: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <Label>RC Expiry Date</Label>
                  <Input type="date" value={formData.rc_expiry_date} onChange={(e) => setFormData({ ...formData, rc_expiry_date: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <Label>Insurance Expiry Date</Label>
                  <Input type="date" value={formData.insurance_expiry_date} onChange={(e) => setFormData({ ...formData, insurance_expiry_date: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">{editingTruck ? 'Update Truck' : 'Create Truck'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Truck Number</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Transporter</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Type</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Capacity</th>
              <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {trucks.map((truck) => (
              <tr key={truck.id} className="hover:bg-muted/50 transition-colors" data-testid="truck-row">
                <td className="py-2 px-4 text-sm font-medium">{truck.truck_number}</td>
                <td className="py-2 px-4 text-sm">{getTransporterName(truck.transporter_id)}</td>
                <td className="py-2 px-4 text-sm">{truck.truck_type || '-'}</td>
                <td className="py-2 px-4 text-sm">{truck.capacity_mt ? `${truck.capacity_mt} MT` : '-'}</td>
                <td className="py-2 px-4 text-sm text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(truck)} data-testid="edit-truck-btn">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(truck.id)} data-testid="delete-truck-btn">
                    <Trash2 className="w-4 h-4 text-error" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {trucks.length === 0 && <div className="text-center py-8 text-muted-foreground">No trucks found</div>}
      </div>
    </div>
  );
}
