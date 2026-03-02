import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Transporters from './pages/Transporters';
import TransporterDetail from './pages/TransporterDetail';
import Trucks from './pages/Trucks';
import TruckDetail from './pages/TruckDetail';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Trips from './pages/Trips';
import Payments from './pages/Payments';
import PaymentDetail from './pages/PaymentDetail';
import Reports from './pages/Reports';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import Layout from './components/Layout';
import './App.css';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/transporters" element={<Transporters />} />
            <Route path="/transporters/:id" element={<TransporterDetail />} />
            <Route path="/trucks" element={<Trucks />} />
            <Route path="/trucks/:id" element={<TruckDetail />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/payments/:id" element={<PaymentDetail />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/drivers/:id" element={<DriverDetail />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
