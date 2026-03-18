import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Truck, MapPin, Package, FileText, CreditCard, Check, Clock, Upload } from 'lucide-react';
import { toast } from 'sonner';
import DocumentList from '../components/DocumentList';

const WORKFLOW_STEPS = [
  { key: 'LR_CREATION', label: 'LR Creation', icon: FileText },
  { key: 'DOCUMENT_VERIFICATION', label: 'Document Verification', icon: Upload },
  { key: 'TRIP_ADVANCES', label: 'Trip Advances', icon: CreditCard },
  { key: 'POD_UPLOAD', label: 'POD Upload', icon: Check },
];

export default function TripDetail() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [order, setOrder] = useState(null);
  const [transporter, setTransporter] = useState(null);
  const [truck, setTruck] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchTripDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchTripDetail = async () => {
    try {
      const tripResponse = await api.get(`/trips/${id}`);
      setTrip(tripResponse.data);
      setFormData(tripResponse.data);
      
      if (tripResponse.data.order_id) {
        const orderResponse = await api.get(`/orders/${tripResponse.data.order_id}`);
        setOrder(orderResponse.data);
      }
      
      if (tripResponse.data.transporter_id) {
        const transporterResponse = await api.get(`/transporters/${tripResponse.data.transporter_id}`);
        setTransporter(transporterResponse.data);
      }
      
      if (tripResponse.data.truck_id) {
        const truckResponse = await api.get(`/trucks/${tripResponse.data.truck_id}`);
        setTruck(truckResponse.data);
      }

      if (tripResponse.data.driver_id) {
        try {
          const driverResponse = await api.get(`/drivers/${tripResponse.data.driver_id}`);
          setDriver(driverResponse.data);
        } catch (e) {
          // Driver may not exist
        }
      }
    } catch (error) {
      toast.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/trips/${id}/lr`, formData);
      toast.success('Trip updated successfully');
      setEditMode(false);
      fetchTripDetail();
    } catch (error) {
      toast.error('Failed to update trip');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkflowStepChange = async (step) => {
    try {
      await api.patch(`/trips/${id}/lr`, { lr_workflow_step: step });
      toast.success('Workflow step updated');
      fetchTripDetail();
    } catch (error) {
      toast.error('Failed to update workflow step');
    }
  };

  const getCurrentStepIndex = () => {
    return WORKFLOW_STEPS.findIndex(s => s.key === trip?.lr_workflow_step) || 0;
  };

  if (loading) return <div className="flex items-center justify-center h-64">Loading...</div>;
  if (!trip) return <div>Trip not found</div>;

  const margin = parseFloat(trip.customer_bill_amount) - parseFloat(trip.payable_amount);
  const marginPercent = ((margin / parseFloat(trip.customer_bill_amount)) * 100).toFixed(2);
  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="space-y-6" data-testid="trip-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/trips">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{trip.lr_number || trip.trip_number}</h1>
              <Badge variant={
                trip.status === 'DELIVERED' ? 'default' :
                trip.status === 'IN_TRANSIT' ? 'secondary' :
                trip.status === 'PLANNED' ? 'outline' : 'destructive'
              }>
                {trip.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">Trip: {trip.trip_number}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button variant="outline" onClick={() => { setEditMode(false); setFormData(trip); }}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditMode(true)}>Edit LR Details</Button>
          )}
        </div>
      </div>

      {/* Top Summary Banner */}
      <Card className="bg-slate-50 dark:bg-slate-900">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Source and Destination */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Source and Destination</h3>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-500 mt-1" />
                <div>
                  <p className="font-medium">{order?.origin || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">to</p>
                  <p className="font-medium">{order?.destination || 'N/A'}</p>
                </div>
              </div>
              {order && (
                <div className="mt-2">
                  <Badge variant="secondary">{order.material || 'Material N/A'}</Badge>
                </div>
              )}
            </div>

            {/* Requirement and Loading */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Requirement (MT) and Loading Date</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span>Qty: <strong>{trip.qty_mt} MT</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-gray-500" />
                  <span>Vehicle: <strong>{truck?.truck_number || 'N/A'}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>Loading: <strong>{trip.loading_date ? formatDate(trip.loading_date) : formatDate(trip.trip_date)}</strong></span>
                </div>
              </div>
            </div>

            {/* Freight and Financials */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Freight and Cluster</h3>
              <div className="space-y-1">
                {trip.billing_pan && (
                  <p className="text-sm">PAN: <strong>{trip.billing_pan}</strong></p>
                )}
                <p className="text-sm">Transporter: <strong>{transporter?.name || 'N/A'}</strong></p>
                <p className="text-lg font-semibold text-primary">
                  {formatCurrency(trip.base_freight || trip.payable_amount)}
                  {trip.qty_mt > 0 && (
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      ({formatCurrency((trip.base_freight || trip.payable_amount) / trip.qty_mt)} per MT)
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Progress Steps */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center justify-between relative">
            {/* Progress Line */}
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-200 -translate-y-1/2 z-0" />
            <div 
              className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${(currentStepIndex / (WORKFLOW_STEPS.length - 1)) * 100}%` }}
            />
            
            {WORKFLOW_STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;
              
              return (
                <div 
                  key={step.key} 
                  className="flex flex-col items-center z-10 cursor-pointer"
                  onClick={() => handleWorkflowStepChange(step.key)}
                  data-testid={`workflow-step-${step.key}`}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-colors duration-200
                    ${isCompleted ? 'bg-primary text-primary-foreground' : 
                      isCurrent ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 
                      'bg-white border-2 border-gray-300 text-gray-400'}
                  `}>
                    {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center max-w-[100px] ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="lr-details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lr-details">LR Details</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="advances">Trip Advances</TabsTrigger>
        </TabsList>

        {/* LR Details Tab */}
        <TabsContent value="lr-details" className="space-y-4">
          {/* Vehicle Details */}
          <Card>
            <CardHeader className="bg-slate-800 text-white rounded-t-lg py-3">
              <CardTitle className="text-base">Vehicle Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Vehicle No</Label>
                  <p className="font-medium">{truck?.truck_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Transporter (Broker)</Label>
                  <p className="font-medium">
                    {transporter ? (
                      <Link to={`/transporters/${transporter.id}`} className="text-primary hover:underline">
                        {transporter.name}
                      </Link>
                    ) : 'N/A'}
                  </p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Transporter Phone</Label>
                  <p className="font-medium">{transporter?.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Driver Phone</Label>
                  <p className="font-medium">{driver?.phone || 'N/A'}</p>
                </div>
              </div>
              {editMode && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t">
                  <div>
                    <Label>Vendor PAN No</Label>
                    <Input 
                      value={formData.billing_pan || ''} 
                      onChange={(e) => handleInputChange('billing_pan', e.target.value)}
                      placeholder="Enter PAN number"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Basic Details */}
          <Card>
            <CardHeader className="bg-slate-800 text-white rounded-t-lg py-3">
              <CardTitle className="text-base">Basic Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">From</Label>
                  <p className="font-medium">{order?.origin || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">To</Label>
                  <p className="font-medium">{order?.destination || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Consignor</Label>
                  {editMode ? (
                    <Input 
                      value={formData.consignor_name || ''} 
                      onChange={(e) => handleInputChange('consignor_name', e.target.value)}
                      placeholder="Enter consignor name"
                    />
                  ) : (
                    <p className="font-medium">{trip.consignor_name || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Consignee</Label>
                  {editMode ? (
                    <Input 
                      value={formData.consignee_name || ''} 
                      onChange={(e) => handleInputChange('consignee_name', e.target.value)}
                      placeholder="Enter consignee name"
                    />
                  ) : (
                    <p className="font-medium">{trip.consignee_name || 'N/A'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Loading Date</Label>
                  {editMode ? (
                    <Input 
                      type="datetime-local"
                      value={formData.loading_date ? formData.loading_date.substring(0, 16) : ''} 
                      onChange={(e) => handleInputChange('loading_date', e.target.value)}
                    />
                  ) : (
                    <p className="font-medium">{trip.loading_date ? formatDate(trip.loading_date) : formatDate(trip.trip_date)}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">DC/OA</Label>
                  {editMode ? (
                    <Input 
                      value={formData.dc_oa || ''} 
                      onChange={(e) => handleInputChange('dc_oa', e.target.value)}
                      placeholder="Enter DC/OA"
                    />
                  ) : (
                    <p className="font-medium">{trip.dc_oa || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">GP/DO</Label>
                  {editMode ? (
                    <Input 
                      value={formData.gp_do || ''} 
                      onChange={(e) => handleInputChange('gp_do', e.target.value)}
                      placeholder="Enter GP/DO"
                    />
                  ) : (
                    <p className="font-medium">{trip.gp_do || 'N/A'}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Consignment Details */}
          <Card>
            <CardHeader className="bg-slate-800 text-white rounded-t-lg py-3">
              <CardTitle className="text-base">Consignment Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Description of Goods</Label>
                  {editMode ? (
                    <Input 
                      value={formData.description_of_goods || ''} 
                      onChange={(e) => handleInputChange('description_of_goods', e.target.value)}
                      placeholder="e.g., Steam Coal, Cement"
                    />
                  ) : (
                    <p className="font-medium">{trip.description_of_goods || order?.material || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Gross Weight (MT)</Label>
                  {editMode ? (
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.gross_weight_mt || ''} 
                      onChange={(e) => handleInputChange('gross_weight_mt', parseFloat(e.target.value) || null)}
                      placeholder="Enter gross weight"
                    />
                  ) : (
                    <p className="font-medium">{trip.gross_weight_mt || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Tare Weight (MT)</Label>
                  {editMode ? (
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.tare_weight_mt || ''} 
                      onChange={(e) => handleInputChange('tare_weight_mt', parseFloat(e.target.value) || null)}
                      placeholder="Enter tare weight"
                    />
                  ) : (
                    <p className="font-medium">{trip.tare_weight_mt || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Net Weight (MT)</Label>
                  {editMode ? (
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.net_weight_mt || ''} 
                      onChange={(e) => handleInputChange('net_weight_mt', parseFloat(e.target.value) || null)}
                      placeholder="Enter net weight"
                    />
                  ) : (
                    <p className="font-medium">{trip.net_weight_mt || trip.qty_mt}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Details */}
          <Card>
            <CardHeader className="bg-slate-800 text-white rounded-t-lg py-3">
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">E-way Bill</Label>
                  {editMode ? (
                    <Input 
                      value={formData.eway_bill || ''} 
                      onChange={(e) => handleInputChange('eway_bill', e.target.value)}
                      placeholder="Enter e-way bill number"
                    />
                  ) : (
                    <p className="font-medium">{trip.eway_bill || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Seal Number</Label>
                  {editMode ? (
                    <Input 
                      value={formData.seal_number || ''} 
                      onChange={(e) => handleInputChange('seal_number', e.target.value)}
                      placeholder="Enter seal number"
                    />
                  ) : (
                    <p className="font-medium">{trip.seal_number || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice Number</Label>
                  {editMode ? (
                    <Input 
                      value={formData.invoice_number || ''} 
                      onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                      placeholder="Enter invoice number"
                    />
                  ) : (
                    <p className="font-medium">{trip.invoice_number || 'N/A'}</p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Net Weight (MT)</Label>
                  <p className="font-medium">{trip.net_weight_mt || trip.qty_mt}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <DocumentList
            docType="LR"
            entityType="TRIP"
            entityId={id}
            title="LR Documents"
          />
          <DocumentList
            docType="INVOICE"
            entityType="TRIP"
            entityId={id}
            title="Invoice Documents"
          />
          <DocumentList
            docType="POD"
            entityType="TRIP"
            entityId={id}
            title="Proof of Delivery (POD)"
          />
        </TabsContent>

        {/* Trip Advances Tab */}
        <TabsContent value="advances" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Trip Details Summary */}
            <Card>
              <CardHeader className="bg-blue-600 text-white rounded-t-lg py-3">
                <CardTitle className="text-base">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Code:</span>
                  <span className="font-medium">{trip.trip_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Vehicle:</span>
                  <span className="font-medium">{truck?.truck_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Route:</span>
                  <span className="font-medium">{order?.origin?.substring(0,3).toUpperCase()}-{order?.destination?.substring(0,3).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Transporter:</span>
                  <Badge variant="secondary">{transporter?.name || 'N/A'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Loading Date:</span>
                  <span className="font-medium">{formatDate(trip.loading_date || trip.trip_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge>{trip.status}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Billing Entity */}
            <Card>
              <CardHeader className="bg-blue-600 text-white rounded-t-lg py-3">
                <CardTitle className="text-base">Billing Entity</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">PAN Card:</span>
                  {editMode ? (
                    <Input 
                      className="w-32 h-8"
                      value={formData.billing_pan || ''} 
                      onChange={(e) => handleInputChange('billing_pan', e.target.value)}
                    />
                  ) : (
                    <span className="font-medium">{trip.billing_pan || transporter?.pan_number || 'N/A'}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Name on PAN:</span>
                  {editMode ? (
                    <Input 
                      className="w-32 h-8"
                      value={formData.billing_name || ''} 
                      onChange={(e) => handleInputChange('billing_name', e.target.value)}
                    />
                  ) : (
                    <span className="font-medium">{trip.billing_name || transporter?.name || 'N/A'}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">TDS Category:</span>
                  {editMode ? (
                    <Input 
                      className="w-32 h-8"
                      value={formData.tds_category || ''} 
                      onChange={(e) => handleInputChange('tds_category', e.target.value)}
                    />
                  ) : (
                    <span className="font-medium">{trip.tds_category || 'N/A'}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  <Badge variant={trip.tds_status === 'APPROVED' ? 'default' : 'secondary'}>
                    {trip.tds_status || 'PENDING'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Vendor Bill */}
            <Card>
              <CardHeader className="bg-blue-600 text-white rounded-t-lg py-3">
                <CardTitle className="text-base">Vendor Bill</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Base Freight (+):</span>
                  {editMode ? (
                    <Input 
                      className="w-24 h-8"
                      type="number"
                      value={formData.base_freight || ''} 
                      onChange={(e) => handleInputChange('base_freight', parseFloat(e.target.value) || null)}
                    />
                  ) : (
                    <span className="font-medium">{formatCurrency(trip.base_freight || trip.payable_amount)}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">All Additionals (+):</span>
                  {editMode ? (
                    <Input 
                      className="w-24 h-8"
                      type="number"
                      value={formData.additionals || ''} 
                      onChange={(e) => handleInputChange('additionals', parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="font-medium">{trip.additionals ? formatCurrency(trip.additionals) : '-'}</span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">All Deductibles (-):</span>
                  {editMode ? (
                    <Input 
                      className="w-24 h-8"
                      type="number"
                      value={formData.deductibles || ''} 
                      onChange={(e) => handleInputChange('deductibles', parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <span className="font-medium">{trip.deductibles ? formatCurrency(trip.deductibles) : '-'}</span>
                  )}
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium">Total:</span>
                  <span className="font-bold">{formatCurrency((trip.base_freight || trip.payable_amount) + (trip.additionals || 0) - (trip.deductibles || 0))}</span>
                </div>
                <div className="border-t pt-2">
                  <p className="text-sm font-medium mb-2">Payments:</p>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Advance Paid:</span>
                    {editMode ? (
                      <Input 
                        className="w-24 h-8"
                        type="number"
                        value={formData.advance_paid || ''} 
                        onChange={(e) => handleInputChange('advance_paid', parseFloat(e.target.value) || 0)}
                      />
                    ) : (
                      <span className="font-medium">{formatCurrency(trip.advance_paid || 0)}</span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="text-sm font-medium text-red-600">Outstanding:</span>
                  <span className="font-bold text-red-600">{formatCurrency(trip.outstanding_amount || 0)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
