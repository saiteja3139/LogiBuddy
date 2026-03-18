"""
Test Supabase Integration - Indian Logistics Broker App
Tests real Supabase database operations for CRUD, LR tracking, and data persistence.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cargo-connect-267.preview.emergentagent.com')

# Authorization header (mock token bypasses auth in development)
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer mock-token"
}


class TestCustomerCRUD:
    """Test Customers CRUD operations with Supabase persistence"""
    
    def test_get_customers_list(self):
        """Test fetching customers list from Supabase"""
        response = requests.get(f"{BASE_URL}/api/customers", headers=HEADERS)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        customers = response.json()
        assert isinstance(customers, list), "Should return a list"
        assert len(customers) >= 3, f"Expected at least 3 customers, got {len(customers)}"
        
        # Validate customer structure
        customer = customers[0]
        assert 'id' in customer
        assert 'name' in customer
        assert 'phone' in customer
        assert 'email' in customer
        assert 'gstin' in customer
        assert 'payment_terms_days' in customer
        
        print(f"✓ Found {len(customers)} customers")
    
    def test_create_and_delete_customer(self):
        """Test creating and deleting a customer persists to Supabase"""
        new_customer = {
            "name": "TEST_Pytest Customer",
            "phone": "9999999999",
            "email": "test@pytest.com",
            "address": "Test Address",
            "gstin": "27AABCTEST123ZM",
            "payment_terms_days": 15
        }
        
        # CREATE
        response = requests.post(f"{BASE_URL}/api/customers", json=new_customer, headers=HEADERS)
        assert response.status_code == 200, f"Create failed: {response.text}"
        
        created = response.json()
        customer_id = created['id']
        assert created['name'] == "TEST_Pytest Customer"
        assert 'created_at' in created
        
        # GET to verify persistence
        get_response = requests.get(f"{BASE_URL}/api/customers/{customer_id}", headers=HEADERS)
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched['name'] == "TEST_Pytest Customer"
        assert fetched['phone'] == "9999999999"
        
        print(f"✓ Created customer {customer_id} and verified persistence")
        
        # DELETE (soft delete)
        delete_response = requests.delete(f"{BASE_URL}/api/customers/{customer_id}", headers=HEADERS)
        assert delete_response.status_code == 200
        
        print(f"✓ Deleted customer {customer_id}")


class TestTripsWithLRFromSupabase:
    """Test Trips with LR fields from real Supabase data"""
    
    def test_get_trips_list(self):
        """Test fetching trips list shows LR numbers and workflow steps"""
        response = requests.get(f"{BASE_URL}/api/trips", headers=HEADERS)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        trips = response.json()
        assert isinstance(trips, list)
        assert len(trips) >= 4, f"Expected at least 4 trips, got {len(trips)}"
        
        # Check first trip has LR fields
        trip = trips[0]
        assert 'lr_number' in trip, "Trip should have lr_number"
        assert 'lr_workflow_step' in trip, "Trip should have lr_workflow_step"
        assert 'trip_number' in trip
        assert 'outstanding_amount' in trip
        
        # Validate LR number format
        assert trip['lr_number'] is not None and trip['lr_number'].startswith('LR-')
        
        print(f"✓ Found {len(trips)} trips with LR info")
        print(f"  First trip LR: {trip['lr_number']}, Step: {trip['lr_workflow_step']}")
    
    def test_get_trip_detail(self):
        """Test fetching trip detail with all LR sections"""
        # Get a trip ID from the list first
        list_response = requests.get(f"{BASE_URL}/api/trips", headers=HEADERS)
        trips = list_response.json()
        trip_id = trips[0]['id']
        
        response = requests.get(f"{BASE_URL}/api/trips/{trip_id}", headers=HEADERS)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        trip = response.json()
        
        # Check all LR section fields exist
        # Vehicle Details
        assert 'truck_id' in trip
        assert 'transporter_id' in trip
        
        # Basic Details
        assert 'dc_oa' in trip
        assert 'gp_do' in trip
        assert 'consignor_name' in trip
        assert 'consignee_name' in trip
        
        # Consignment Details
        assert 'description_of_goods' in trip
        assert 'gross_weight_mt' in trip
        assert 'tare_weight_mt' in trip
        assert 'net_weight_mt' in trip
        
        # Invoice Details
        assert 'eway_bill' in trip
        assert 'seal_number' in trip
        assert 'invoice_number' in trip
        
        # Billing Entity
        assert 'billing_pan' in trip
        assert 'billing_name' in trip
        assert 'tds_category' in trip
        assert 'tds_status' in trip
        
        # Vendor Bill
        assert 'base_freight' in trip
        assert 'additionals' in trip
        assert 'deductibles' in trip
        assert 'advance_paid' in trip
        assert 'outstanding_amount' in trip
        
        print(f"✓ Trip {trip_id} has all LR section fields")


class TestTripCreationWithAutoLR:
    """Test creating a new trip generates LR number automatically"""
    
    def test_create_trip_generates_lr(self):
        """Test POST /trips creates trip with auto-generated LR number"""
        # Get existing order, transporter, truck IDs from Supabase
        orders_resp = requests.get(f"{BASE_URL}/api/orders", headers=HEADERS)
        transporters_resp = requests.get(f"{BASE_URL}/api/transporters", headers=HEADERS)
        trucks_resp = requests.get(f"{BASE_URL}/api/trucks", headers=HEADERS)
        
        orders = orders_resp.json()
        transporters = transporters_resp.json()
        trucks = trucks_resp.json()
        
        new_trip = {
            "order_id": orders[0]['id'],
            "transporter_id": transporters[0]['id'],
            "truck_id": trucks[0]['id'],
            "trip_date": "2026-03-20",
            "qty_mt": 18.5,
            "payable_amount": 55000,
            "customer_bill_amount": 65000,
            "status": "PLANNED"
        }
        
        response = requests.post(f"{BASE_URL}/api/trips", json=new_trip, headers=HEADERS)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        created = response.json()
        trip_id = created['id']
        
        # Verify auto-generated fields
        assert created['lr_number'] is not None, "LR number should be auto-generated"
        assert created['lr_number'].startswith('LR-'), f"LR format incorrect: {created['lr_number']}"
        assert created['trip_number'].startswith('TRP-')
        assert created['lr_workflow_step'] == 'LR_CREATION', "Default step should be LR_CREATION"
        assert created['outstanding_amount'] == 55000, "Outstanding should equal payable amount initially"
        
        print(f"✓ Created trip with LR: {created['lr_number']}")
        
        # Clean up
        requests.delete(f"{BASE_URL}/api/trips/{trip_id}", headers=HEADERS)


class TestLRWorkflowStepUpdate:
    """Test updating LR workflow step persists to Supabase"""
    
    def test_update_workflow_step(self):
        """Test PATCH /trips/{id}/lr updates workflow step"""
        # Get a trip ID
        list_response = requests.get(f"{BASE_URL}/api/trips", headers=HEADERS)
        trips = list_response.json()
        # Find a DELIVERED trip with TRIP_ADVANCES step
        trip = next((t for t in trips if t['lr_workflow_step'] == 'TRIP_ADVANCES'), trips[0])
        trip_id = trip['id']
        original_step = trip['lr_workflow_step']
        
        # Update to POD_UPLOAD
        response = requests.patch(
            f"{BASE_URL}/api/trips/{trip_id}/lr",
            json={"lr_workflow_step": "POD_UPLOAD"},
            headers=HEADERS
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        updated = response.json()
        assert updated['lr_workflow_step'] == 'POD_UPLOAD'
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/trips/{trip_id}", headers=HEADERS)
        fetched = get_response.json()
        assert fetched['lr_workflow_step'] == 'POD_UPLOAD'
        
        print(f"✓ Updated workflow step to POD_UPLOAD")
        
        # Restore original
        requests.patch(
            f"{BASE_URL}/api/trips/{trip_id}/lr",
            json={"lr_workflow_step": original_step},
            headers=HEADERS
        )
        print(f"✓ Restored workflow step to {original_step}")


class TestLRFieldsUpdate:
    """Test updating LR detail fields persists to Supabase"""
    
    def test_update_consignment_fields(self):
        """Test updating consignment fields via PATCH /trips/{id}/lr"""
        # Get a trip
        list_response = requests.get(f"{BASE_URL}/api/trips", headers=HEADERS)
        trips = list_response.json()
        trip = trips[0]
        trip_id = trip['id']
        
        # Store original values
        original_desc = trip.get('description_of_goods')
        
        # Update
        update_data = {
            "description_of_goods": "TEST_Updated Goods",
            "gross_weight_mt": 30.0
        }
        
        response = requests.patch(f"{BASE_URL}/api/trips/{trip_id}/lr", json=update_data, headers=HEADERS)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        updated = response.json()
        assert updated['description_of_goods'] == "TEST_Updated Goods"
        assert updated['gross_weight_mt'] == 30.0
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/trips/{trip_id}", headers=HEADERS)
        fetched = get_response.json()
        assert fetched['description_of_goods'] == "TEST_Updated Goods"
        
        print(f"✓ Updated and verified consignment fields persistence")
        
        # Restore
        requests.patch(
            f"{BASE_URL}/api/trips/{trip_id}/lr",
            json={"description_of_goods": original_desc, "gross_weight_mt": trip.get('gross_weight_mt')},
            headers=HEADERS
        )


class TestDocumentsFromSupabase:
    """Test Documents tab shows documents from Supabase"""
    
    def test_get_documents_list(self):
        """Test fetching documents from Supabase"""
        response = requests.get(f"{BASE_URL}/api/documents", headers=HEADERS)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        documents = response.json()
        assert isinstance(documents, list)
        assert len(documents) >= 2, f"Expected at least 2 documents, got {len(documents)}"
        
        # Check document structure
        doc = documents[0]
        assert 'id' in doc
        assert 'doc_type' in doc
        assert 'entity_type' in doc
        assert 'entity_id' in doc
        assert 'title' in doc
        assert 'file_name' in doc
        
        print(f"✓ Found {len(documents)} documents")
    
    def test_get_trip_documents(self):
        """Test fetching documents for a specific trip"""
        # Get a trip ID
        trips_response = requests.get(f"{BASE_URL}/api/trips", headers=HEADERS)
        trips = trips_response.json()
        trip_id = trips[0]['id']
        
        response = requests.get(
            f"{BASE_URL}/api/documents",
            params={"entity_type": "TRIP", "entity_id": trip_id},
            headers=HEADERS
        )
        assert response.status_code == 200
        docs = response.json()
        
        print(f"✓ Found {len(docs)} documents for trip {trip_id}")


class TestDashboardStats:
    """Test Dashboard loads with correct stats from Supabase"""
    
    def test_get_dashboard(self):
        """Test GET /dashboard returns aggregated stats"""
        response = requests.get(f"{BASE_URL}/api/dashboard", headers=HEADERS)
        assert response.status_code == 200, f"Failed: {response.text}"
        
        stats = response.json()
        
        # Verify all stats fields
        assert 'total_outstanding_receivables' in stats
        assert 'total_outstanding_payables' in stats
        assert 'pending_orders_count' in stats
        assert 'overdue_customers_count' in stats
        
        # Verify numeric types
        assert isinstance(stats['total_outstanding_receivables'], (int, float))
        assert isinstance(stats['total_outstanding_payables'], (int, float))
        assert isinstance(stats['pending_orders_count'], int)
        assert isinstance(stats['overdue_customers_count'], int)
        
        print(f"✓ Dashboard stats:")
        print(f"  Receivables: {stats['total_outstanding_receivables']}")
        print(f"  Payables: {stats['total_outstanding_payables']}")
        print(f"  Pending Orders: {stats['pending_orders_count']}")
        print(f"  Overdue Customers: {stats['overdue_customers_count']}")


class TestTransportersCRUD:
    """Test Transporters CRUD with Supabase"""
    
    def test_get_transporters(self):
        """Test fetching transporters list"""
        response = requests.get(f"{BASE_URL}/api/transporters", headers=HEADERS)
        assert response.status_code == 200
        
        transporters = response.json()
        assert len(transporters) >= 3, f"Expected at least 3 transporters"
        
        transporter = transporters[0]
        assert 'id' in transporter
        assert 'name' in transporter
        assert 'phone' in transporter
        
        print(f"✓ Found {len(transporters)} transporters")


class TestTrucksCRUD:
    """Test Trucks CRUD with Supabase"""
    
    def test_get_trucks(self):
        """Test fetching trucks list"""
        response = requests.get(f"{BASE_URL}/api/trucks", headers=HEADERS)
        assert response.status_code == 200
        
        trucks = response.json()
        assert len(trucks) >= 4, f"Expected at least 4 trucks"
        
        truck = trucks[0]
        assert 'id' in truck
        assert 'truck_number' in truck
        assert 'transporter_id' in truck
        
        print(f"✓ Found {len(trucks)} trucks")


class TestOrdersCRUD:
    """Test Orders CRUD with Supabase"""
    
    def test_get_orders(self):
        """Test fetching orders list"""
        response = requests.get(f"{BASE_URL}/api/orders", headers=HEADERS)
        assert response.status_code == 200
        
        orders = response.json()
        assert len(orders) >= 3, f"Expected at least 3 orders"
        
        order = orders[0]
        assert 'id' in order
        assert 'order_number' in order
        assert 'customer_id' in order
        assert 'transported_qty_mt' in order
        assert 'pending_qty_mt' in order
        
        print(f"✓ Found {len(orders)} orders")


class TestDriversCRUD:
    """Test Drivers CRUD with Supabase"""
    
    def test_get_drivers(self):
        """Test fetching drivers list"""
        response = requests.get(f"{BASE_URL}/api/drivers", headers=HEADERS)
        assert response.status_code == 200
        
        drivers = response.json()
        assert len(drivers) >= 2, f"Expected at least 2 drivers"
        
        driver = drivers[0]
        assert 'id' in driver
        assert 'name' in driver
        assert 'phone' in driver
        
        print(f"✓ Found {len(drivers)} drivers")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
