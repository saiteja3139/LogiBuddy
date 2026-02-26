import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { Toaster } from './components/ui/sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Transporters from './pages/Transporters';
import TransporterDetail from './pages/TransporterDetail';
import Trucks from './pages/Trucks';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Trips from './pages/Trips';
import Payments from './pages/Payments';
import PaymentDetail from './pages/PaymentDetail';
import Reports from './pages/Reports';
import Layout from './components/Layout';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
          <Route
            path="/*"
            element={
              session ? (
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/customers/:id" element={<CustomerDetail />} />
                    <Route path="/transporters" element={<Transporters />} />
                    <Route path="/transporters/:id" element={<TransporterDetail />} />
                    <Route path="/trucks" element={<Trucks />} />
                    <Route path="/orders" element={<Orders />} />
                    <Route path="/orders/:id" element={<OrderDetail />} />
                    <Route path="/trips" element={<Trips />} />
                    <Route path="/payments" element={<Payments />} />
                    <Route path="/payments/:id" element={<PaymentDetail />} />
                    <Route path="/reports" element={<Reports />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
