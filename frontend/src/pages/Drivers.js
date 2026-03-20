import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { formatDate } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Search, Eye, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [transporters, setTransporters] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    transporter_id: '', name: '', phone: '', license_number: '',
    license_expiry_date: '', address: '', notes: ''
  });

useEffect(() => {
  const fetchDrivers = async () => {
    try {
      const response = await api.get('/drivers', { params: { search } });
      const data = Array.isArray(response.data) ? response.data : [];
      setDrivers(data);
    } catch (error) {
      toast.error('Failed to load drivers');
    }
  };

  const fetchTransporters = async () => {
    try {
      const response = await api.get('/transporters');
      setTransporters(response.data);
    } catch (error) {}
  };

  fetchDrivers();
  fetchTransporters();
}, [search]);

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    if (editingDriver) {
      await api.put(`/drivers/${editingDriver.id}`, formData);
      toast.success('Driver updated successfully');
    } else {
      await api.post('/drivers', formData);
      toast.success('Driver created successfully');
    }

    setDialogOpen(false);
    setEditingDriver(null);
    resetForm();

    const response = await api.get('/drivers', { params: { search } });
    setDrivers(response.data);
  } catch (error) {
    toast.error(editingDriver ? 'Failed to update driver' : 'Failed to create driver');
  }
};

  const resetForm = () => {
    setFormData({ transporter_id: '', name: '', phone: '', license_number: '', license_expiry_date: '', address: '', notes: '' });
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData(driver);
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await api.delete(`/drivers/${id}`);
        toast.success('Driver deleted successfully');
        setDrivers((prev) => prev.filter((driver) => driver.id !== id));
      } catch (error) {
        toast.error('Failed to delete driver');
      }
    }
  };

  const getTransporterName = (id) => {
    const transporter = transporters.find(t => t.id === id);
    return transporter ? transporter.name : '-';
  };

  const isLicenseExpiring = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.floor((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  };

  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6" data-testid="drivers-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-heading">Drivers</h1>
          <p className="text-muted-foreground mt-2">Manage driver database</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingDriver(null); resetForm(); }}}>
          <DialogTrigger asChild>
            <Button data-testid="add-driver-btn"><Plus className="w-4 h-4 mr-2" />Add Driver</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingDriver ? 'Edit Driver' : 'Add New Driver'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2"><Label>Name *</Label><Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                <div><Label>Phone *</Label><Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></div>
                <div><Label>License Number</Label><Input value={formData.license_number} onChange={(e) => setFormData({ ...formData, license_number: e.target.value })} /></div>
                <div><Label>License Expiry</Label><Input type="date" value={formData.license_expiry_date} onChange={(e) => setFormData({ ...formData, license_expiry_date: e.target.value })} /></div>
                <div><Label>Transporter</Label>
                  <Select value={formData.transporter_id} onValueChange={(value) => setFormData({ ...formData, transporter_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Select transporter" /></SelectTrigger>
                    <SelectContent>{transporters.map(t => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2"><Label>Address</Label><Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></div>
                <div className="col-span-2"><Label>Notes</Label><Input value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} /></div>
              </div>
              <Button type="submit" className="w-full">{editingDriver ? 'Update Driver' : 'Create Driver'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search drivers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="bg-white border shadow-sm rounded-sm overflow-hidden">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/50">
            <tr>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Name</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Phone</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">License</th>
              <th className="py-2 px-4 text-left text-xs uppercase font-semibold text-muted-foreground">Transporter</th>
              <th className="py-2 px-4 text-right text-xs uppercase font-semibold text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {drivers.map((driver) => (
              <tr key={driver.id} className="hover:bg-muted/50 transition-colors" data-testid="driver-row">
                <td className="py-2 px-4 text-sm font-medium">{driver.name}</td>
                <td className="py-2 px-4 text-sm">{driver.phone}</td>
                <td className="py-2 px-4 text-sm">
                  <div>{driver.license_number || '-'}</div>
                  {driver.license_expiry_date && (
                    <div className="flex items-center space-x-1 mt-1">
                      <span className="text-xs text-muted-foreground">{formatDate(driver.license_expiry_date)}</span>
                      {isLicenseExpired(driver.license_expiry_date) && <AlertCircle className="w-3 h-3 text-error" />}
                      {isLicenseExpiring(driver.license_expiry_date) && !isLicenseExpired(driver.license_expiry_date) && <AlertCircle className="w-3 h-3 text-warning" />}
                    </div>
                  )}
                </td>
                <td className="py-2 px-4 text-sm">{getTransporterName(driver.transporter_id)}</td>
                <td className="py-2 px-4 text-sm text-right space-x-2">
                  <Link to={`/drivers/${driver.id}`}><Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button></Link>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(driver)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(driver.id)}><Trash2 className="w-4 h-4 text-error" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {drivers.length === 0 && <div className="text-center py-8 text-muted-foreground">No drivers found</div>}
      </div>
    </div>
  );
}
