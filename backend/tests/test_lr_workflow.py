"""
Test LR Workflow Feature - Indian Logistics Broker App
Tests LR tracking, workflow steps, trip creation with auto LR number generation,
and outstanding amount calculation.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://cargo-connect-267.preview.emergentagent.com')

# Authorization header (mock token)
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": "Bearer mock-token"
}


class TestTripsListWithLR:
    """Test trips list page showing LR number and LR workflow step"""
    
    def test_get_trips_list(self):
        """Test that trips list returns trips with LR numbers and workflow steps"""
        response = requests.get(f"{BASE_URL}/api/trips", headers=HEADERS)
        assert response.status_code == 200, f"Failed to get trips: {response.text}"
        
        trips = response.json()
        assert isinstance(trips, list), "Trips should be a list"
        assert len(trips) >= 1, "Should have at least one seeded trip"
        
        # Check first trip has LR fields
        trip = trips[0]
        assert 'lr_number' in trip, "Trip should have lr_number field"
        assert 'lr_workflow_step' in trip, "Trip should have lr_workflow_step field"
        assert 'trip_number' in trip, "Trip should have trip_number field"
        
        print(f"✓ Found {len(trips)} trips with LR info")
    
    def test_seeded_trip_has_correct_lr_number(self):
        """Test seeded trip has expected LR number format"""
        response = requests.get(f"{BASE_URL}/api/trips", headers=HEADERS)
        assert response.status_code == 200
        
        trips = response.json()
        seeded_trip = next((t for t in trips if t['id'] == '1'), None)
        assert seeded_trip is not None, "Seeded trip with id=1 should exist"
        
        assert seeded_trip['lr_number'] == 'LR-2025-000001', f"Expected LR-2025-000001, got {seeded_trip['lr_number']}"
        assert seeded_trip['lr_workflow_step'] == 'TRIP_ADVANCES', f"Expected TRIP_ADVANCES step"
        
        print(f"✓ Seeded trip LR: {seeded_trip['lr_number']}, Step: {seeded_trip['lr_workflow_step']}")


class TestTripDetailWithLRSections:
    """Test trip detail page showing all LR sections"""
    
    def test_get_trip_detail(self):
        """Test trip detail returns all LR section fields"""
        response = requests.get(f"{BASE_URL}/api/trips/1", headers=HEADERS)
        assert response.status_code == 200, f"Failed to get trip detail: {response.text}"
        
        trip = response.json()
        
        # Vehicle Details
        assert 'truck_id' in trip, "Should have truck_id for Vehicle Details"
        assert 'transporter_id' in trip, "Should have transporter_id for Vehicle Details"
        assert 'driver_id' in trip, "Should have driver_id for Vehicle Details"
        
        # Basic Details
        assert 'dc_oa' in trip, "Should have dc_oa field"
        assert 'gp_do' in trip, "Should have gp_do field"
        assert 'consignor_name' in trip, "Should have consignor_name field"
        assert 'consignee_name' in trip, "Should have consignee_name field"
        
        # Consignment Details
        assert 'description_of_goods' in trip, "Should have description_of_goods"
        assert 'gross_weight_mt' in trip, "Should have gross_weight_mt"
        assert 'tare_weight_mt' in trip, "Should have tare_weight_mt"
        assert 'net_weight_mt' in trip, "Should have net_weight_mt"
        
        # Invoice Details
        assert 'eway_bill' in trip, "Should have eway_bill field"
        assert 'seal_number' in trip, "Should have seal_number field"
        assert 'invoice_number' in trip, "Should have invoice_number field"
        
        print("✓ Trip detail has all LR section fields")
    
    def test_trip_detail_values(self):
        """Test seeded trip detail has correct values"""
        response = requests.get(f"{BASE_URL}/api/trips/1", headers=HEADERS)
        assert response.status_code == 200
        
        trip = response.json()
        
        # Verify seeded data
        assert trip['consignor_name'] == 'ABC Steel Works'
        assert trip['consignee_name'] == 'XYZ Manufacturing'
        assert trip['description_of_goods'] == 'Steel Coils'
        assert trip['gross_weight_mt'] == 21.5
        assert trip['net_weight_mt'] == 20
        assert trip['eway_bill'] == '192345678901234'
        assert trip['invoice_number'] == 'INV-2025-001'
        
        print("✓ Trip detail values match seeded data")


class TestTripAdvancesTab:
    """Test Trip Advances tab with Billing Entity and Vendor Bill"""
    
    def test_billing_entity_fields(self):
        """Test trip has billing entity fields"""
        response = requests.get(f"{BASE_URL}/api/trips/1", headers=HEADERS)
        assert response.status_code == 200
        
        trip = response.json()
        
        # Billing Entity fields
        assert 'billing_pan' in trip, "Should have billing_pan"
        assert 'billing_name' in trip, "Should have billing_name"
        assert 'tds_category' in trip, "Should have tds_category"
        assert 'tds_status' in trip, "Should have tds_status"
        
        # Verify seeded values
        assert trip['billing_pan'] == 'AAAFS1234F'
        assert trip['billing_name'] == 'Sharma Transports'
        assert trip['tds_category'] == '194C'
        assert trip['tds_status'] == 'APPROVED'
        
        print("✓ Billing Entity fields present and correct")
    
    def test_vendor_bill_fields(self):
        """Test trip has vendor bill fields"""
        response = requests.get(f"{BASE_URL}/api/trips/1", headers=HEADERS)
        assert response.status_code == 200
        
        trip = response.json()
        
        # Vendor Bill fields
        assert 'base_freight' in trip, "Should have base_freight"
        assert 'additionals' in trip, "Should have additionals"
        assert 'deductibles' in trip, "Should have deductibles"
        assert 'advance_paid' in trip, "Should have advance_paid"
        assert 'outstanding_amount' in trip, "Should have outstanding_amount"
        
        # Verify seeded values
        assert trip['base_freight'] == 85000
        assert trip['additionals'] == 2000
        assert trip['deductibles'] == 500
        assert trip['advance_paid'] == 50000
        
        print("✓ Vendor Bill fields present and correct")


class TestOutstandingCalculation:
    """Test outstanding amount calculation: base + additionals - deductibles - advance_paid"""
    
    def test_outstanding_formula(self):
        """Test outstanding = base_freight + additionals - deductibles - advance_paid"""
        response = requests.get(f"{BASE_URL}/api/trips/1", headers=HEADERS)
        assert response.status_code == 200
        
        trip = response.json()
        
        base = trip['base_freight']  # 85000
        additionals = trip['additionals']  # 2000
        deductibles = trip['deductibles']  # 500
        advance_paid = trip['advance_paid']  # 50000
        
        expected_outstanding = base + additionals - deductibles - advance_paid
        # 85000 + 2000 - 500 - 50000 = 36500
        
        assert trip['outstanding_amount'] == expected_outstanding, \
            f"Expected outstanding {expected_outstanding}, got {trip['outstanding_amount']}"
        
        print(f"✓ Outstanding calculation correct: {base} + {additionals} - {deductibles} - {advance_paid} = {expected_outstanding}")
    
    def test_update_outstanding_recalculation(self):
        """Test outstanding is recalculated when vendor bill fields are updated"""
        # Update advance_paid to test recalculation
        update_data = {
            "advance_paid": 60000
        }
        
        response = requests.patch(f"{BASE_URL}/api/trips/1/lr", json=update_data, headers=HEADERS)
        assert response.status_code == 200, f"Failed to update trip: {response.text}"
        
        trip = response.json()
        
        # New outstanding: 85000 + 2000 - 500 - 60000 = 26500
        expected = 85000 + 2000 - 500 - 60000
        assert trip['outstanding_amount'] == expected, \
            f"Expected outstanding {expected} after update, got {trip['outstanding_amount']}"
        
        # Restore original value
        requests.patch(f"{BASE_URL}/api/trips/1/lr", json={"advance_paid": 50000}, headers=HEADERS)
        
        print(f"✓ Outstanding recalculated correctly after update: {expected}")


class TestLRWorkflowStepUpdate:
    """Test LR workflow step changes"""
    
    def test_update_workflow_step(self):
        """Test workflow step can be changed via PATCH endpoint"""
        # Current step is TRIP_ADVANCES, change to DOCUMENT_VERIFICATION
        update_data = {"lr_workflow_step": "DOCUMENT_VERIFICATION"}
        
        response = requests.patch(f"{BASE_URL}/api/trips/1/lr", json=update_data, headers=HEADERS)
        assert response.status_code == 200, f"Failed to update workflow step: {response.text}"
        
        trip = response.json()
        assert trip['lr_workflow_step'] == 'DOCUMENT_VERIFICATION', \
            f"Expected DOCUMENT_VERIFICATION, got {trip['lr_workflow_step']}"
        
        print("✓ Workflow step updated to DOCUMENT_VERIFICATION")
        
        # Change to POD_UPLOAD
        update_data = {"lr_workflow_step": "POD_UPLOAD"}
        response = requests.patch(f"{BASE_URL}/api/trips/1/lr", json=update_data, headers=HEADERS)
        assert response.status_code == 200
        
        trip = response.json()
        assert trip['lr_workflow_step'] == 'POD_UPLOAD'
        
        print("✓ Workflow step updated to POD_UPLOAD")
        
        # Restore to original
        requests.patch(f"{BASE_URL}/api/trips/1/lr", json={"lr_workflow_step": "TRIP_ADVANCES"}, headers=HEADERS)
        print("✓ Workflow step restored to TRIP_ADVANCES")
    
    def test_all_workflow_steps(self):
        """Test all valid workflow step values"""
        valid_steps = ["LR_CREATION", "DOCUMENT_VERIFICATION", "TRIP_ADVANCES", "POD_UPLOAD", "COMPLETED"]
        
        for step in valid_steps:
            response = requests.patch(
                f"{BASE_URL}/api/trips/1/lr", 
                json={"lr_workflow_step": step}, 
                headers=HEADERS
            )
            assert response.status_code == 200, f"Failed for step {step}: {response.text}"
            trip = response.json()
            assert trip['lr_workflow_step'] == step, f"Expected {step}, got {trip['lr_workflow_step']}"
        
        # Restore to TRIP_ADVANCES
        requests.patch(f"{BASE_URL}/api/trips/1/lr", json={"lr_workflow_step": "TRIP_ADVANCES"}, headers=HEADERS)
        
        print(f"✓ All {len(valid_steps)} workflow steps validated")


class TestCreateTripWithAutoLR:
    """Test creating new trip generates LR number automatically"""
    
    def test_create_trip_generates_lr_number(self):
        """Test POST /trips generates LR number automatically"""
        new_trip = {
            "order_id": "1",
            "transporter_id": "1",
            "truck_id": "1",
            "trip_date": "2025-01-20",
            "qty_mt": 15.0,
            "payable_amount": 60000,
            "customer_bill_amount": 75000,
            "status": "PLANNED"
        }
        
        response = requests.post(f"{BASE_URL}/api/trips", json=new_trip, headers=HEADERS)
        assert response.status_code == 200, f"Failed to create trip: {response.text}"
        
        created_trip = response.json()
        
        # Verify auto-generated fields
        assert 'lr_number' in created_trip, "Created trip should have lr_number"
        assert created_trip['lr_number'] is not None, "LR number should not be null"
        assert created_trip['lr_number'].startswith('LR-'), f"LR number should start with 'LR-', got {created_trip['lr_number']}"
        
        assert 'trip_number' in created_trip, "Created trip should have trip_number"
        assert created_trip['trip_number'].startswith('TRP-'), f"Trip number should start with 'TRP-'"
        
        # Verify default workflow step
        assert created_trip['lr_workflow_step'] == 'LR_CREATION', \
            f"Default workflow step should be LR_CREATION, got {created_trip['lr_workflow_step']}"
        
        # Verify base_freight defaults to payable_amount
        assert created_trip['base_freight'] == 60000, \
            f"base_freight should default to payable_amount (60000), got {created_trip['base_freight']}"
        
        # Verify outstanding calculation (no additionals/deductibles/advance by default)
        expected_outstanding = 60000 + 0 - 0 - 0  # base + additionals - deductibles - advance
        assert created_trip['outstanding_amount'] == expected_outstanding, \
            f"Outstanding should be {expected_outstanding}, got {created_trip['outstanding_amount']}"
        
        print(f"✓ Created trip with auto-generated LR: {created_trip['lr_number']}")
        print(f"  Trip number: {created_trip['trip_number']}")
        print(f"  Default workflow step: {created_trip['lr_workflow_step']}")
        print(f"  Outstanding: {created_trip['outstanding_amount']}")
        
        # Clean up - delete the test trip
        trip_id = created_trip['id']
        requests.delete(f"{BASE_URL}/api/trips/{trip_id}", headers=HEADERS)


class TestEditLRFields:
    """Test editing LR details (consignment and invoice fields)"""
    
    def test_edit_consignment_fields(self):
        """Test updating consignment fields via PATCH /trips/{id}/lr"""
        update_data = {
            "description_of_goods": "TEST_Updated Steel Coils",
            "gross_weight_mt": 25.0,
            "tare_weight_mt": 2.0,
            "net_weight_mt": 23.0
        }
        
        response = requests.patch(f"{BASE_URL}/api/trips/1/lr", json=update_data, headers=HEADERS)
        assert response.status_code == 200, f"Failed to update consignment fields: {response.text}"
        
        trip = response.json()
        assert trip['description_of_goods'] == "TEST_Updated Steel Coils"
        assert trip['gross_weight_mt'] == 25.0
        assert trip['tare_weight_mt'] == 2.0
        assert trip['net_weight_mt'] == 23.0
        
        print("✓ Consignment fields updated successfully")
        
        # Verify persistence - GET the trip
        get_response = requests.get(f"{BASE_URL}/api/trips/1", headers=HEADERS)
        assert get_response.status_code == 200
        fetched_trip = get_response.json()
        assert fetched_trip['description_of_goods'] == "TEST_Updated Steel Coils"
        assert fetched_trip['gross_weight_mt'] == 25.0
        
        print("✓ Consignment field changes persisted")
        
        # Restore original values
        restore_data = {
            "description_of_goods": "Steel Coils",
            "gross_weight_mt": 21.5,
            "tare_weight_mt": 1.5,
            "net_weight_mt": 20.0
        }
        requests.patch(f"{BASE_URL}/api/trips/1/lr", json=restore_data, headers=HEADERS)
    
    def test_edit_invoice_fields(self):
        """Test updating invoice fields via PATCH /trips/{id}/lr"""
        update_data = {
            "eway_bill": "TEST_999999999999999",
            "seal_number": "TEST_SEAL-999",
            "invoice_number": "TEST_INV-999"
        }
        
        response = requests.patch(f"{BASE_URL}/api/trips/1/lr", json=update_data, headers=HEADERS)
        assert response.status_code == 200, f"Failed to update invoice fields: {response.text}"
        
        trip = response.json()
        assert trip['eway_bill'] == "TEST_999999999999999"
        assert trip['seal_number'] == "TEST_SEAL-999"
        assert trip['invoice_number'] == "TEST_INV-999"
        
        print("✓ Invoice fields updated successfully")
        
        # Restore original values
        restore_data = {
            "eway_bill": "192345678901234",
            "seal_number": "SEAL-001",
            "invoice_number": "INV-2025-001"
        }
        requests.patch(f"{BASE_URL}/api/trips/1/lr", json=restore_data, headers=HEADERS)
    
    def test_edit_basic_details(self):
        """Test updating basic details via PATCH /trips/{id}/lr"""
        update_data = {
            "consignor_name": "TEST_New Consignor",
            "consignee_name": "TEST_New Consignee",
            "dc_oa": "TEST_DC-999",
            "gp_do": "TEST_GP-999"
        }
        
        response = requests.patch(f"{BASE_URL}/api/trips/1/lr", json=update_data, headers=HEADERS)
        assert response.status_code == 200, f"Failed to update basic details: {response.text}"
        
        trip = response.json()
        assert trip['consignor_name'] == "TEST_New Consignor"
        assert trip['consignee_name'] == "TEST_New Consignee"
        assert trip['dc_oa'] == "TEST_DC-999"
        
        print("✓ Basic details updated successfully")
        
        # Restore original values
        restore_data = {
            "consignor_name": "ABC Steel Works",
            "consignee_name": "XYZ Manufacturing",
            "dc_oa": "DC-001",
            "gp_do": "GP-001"
        }
        requests.patch(f"{BASE_URL}/api/trips/1/lr", json=restore_data, headers=HEADERS)


class TestDocumentsForTrip:
    """Test documents tab showing LR, Invoice, and POD documents"""
    
    def test_get_trip_documents(self):
        """Test fetching documents for a trip"""
        # Get LR documents
        response = requests.get(
            f"{BASE_URL}/api/documents",
            params={"entity_type": "TRIP", "entity_id": "1", "doc_type": "LR"},
            headers=HEADERS
        )
        assert response.status_code == 200, f"Failed to get LR documents: {response.text}"
        lr_docs = response.json()
        assert isinstance(lr_docs, list), "Documents should be a list"
        
        # Get Invoice documents
        response = requests.get(
            f"{BASE_URL}/api/documents",
            params={"entity_type": "TRIP", "entity_id": "1", "doc_type": "INVOICE"},
            headers=HEADERS
        )
        assert response.status_code == 200
        invoice_docs = response.json()
        
        # Get POD documents
        response = requests.get(
            f"{BASE_URL}/api/documents",
            params={"entity_type": "TRIP", "entity_id": "1", "doc_type": "POD"},
            headers=HEADERS
        )
        assert response.status_code == 200
        pod_docs = response.json()
        
        print(f"✓ Trip documents: {len(lr_docs)} LR, {len(invoice_docs)} Invoice, {len(pod_docs)} POD")
    
    def test_get_all_trip_documents(self):
        """Test fetching all documents for a trip"""
        response = requests.get(
            f"{BASE_URL}/api/documents",
            params={"entity_type": "TRIP", "entity_id": "1"},
            headers=HEADERS
        )
        assert response.status_code == 200
        docs = response.json()
        
        # Check document types from seeded data
        doc_types = set(doc['doc_type'] for doc in docs)
        assert 'LR' in doc_types or len(docs) == 0, "Should have LR document type in seeded data"
        
        print(f"✓ Found {len(docs)} total documents for trip 1")


class TestSupportingEndpoints:
    """Test supporting endpoints for trip detail page"""
    
    def test_get_transporter(self):
        """Test fetching transporter details"""
        response = requests.get(f"{BASE_URL}/api/transporters/1", headers=HEADERS)
        assert response.status_code == 200
        transporter = response.json()
        assert transporter['name'] == 'Sharma Transports'
        print(f"✓ Transporter: {transporter['name']}")
    
    def test_get_truck(self):
        """Test fetching truck details"""
        response = requests.get(f"{BASE_URL}/api/trucks/1", headers=HEADERS)
        assert response.status_code == 200
        truck = response.json()
        assert truck['truck_number'] == 'MH02AB1234'
        print(f"✓ Truck: {truck['truck_number']}")
    
    def test_get_driver(self):
        """Test fetching driver details"""
        response = requests.get(f"{BASE_URL}/api/drivers/1", headers=HEADERS)
        assert response.status_code == 200
        driver = response.json()
        assert driver['name'] == 'Rajesh Kumar'
        print(f"✓ Driver: {driver['name']}")
    
    def test_get_order(self):
        """Test fetching order details"""
        response = requests.get(f"{BASE_URL}/api/orders/1", headers=HEADERS)
        assert response.status_code == 200
        order = response.json()
        assert order['origin'] == 'Mumbai'
        assert order['destination'] == 'Pune'
        print(f"✓ Order route: {order['origin']} → {order['destination']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
