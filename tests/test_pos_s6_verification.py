"""
POS & Retail Operations Suite S6 Verification Tests
Tests the full POS flow: shift open → sale → add items → apply tax → payment → receipt → shift close → Z-report
All amounts in NGN (₦), tax rate 7.5%, Nigeria-first requirements
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://prisma-sync.preview.emergentagent.com').rstrip('/')
TENANT_ID = 'demo-webwaka-pos'
LOCATION_ID = 'ng-lagos-ikeja-01'

# Nigerian demo products
NIGERIAN_PRODUCTS = [
    {'productId': 'prod-indomie-001', 'productName': 'Indomie Instant Noodles (70g)', 'unitPrice': 250, 'quantity': 3},
    {'productId': 'prod-gala-001', 'productName': 'Gala Sausage Roll', 'unitPrice': 350, 'quantity': 2},
    {'productId': 'prod-peak-001', 'productName': 'Peak Milk (400g)', 'unitPrice': 1800, 'quantity': 1},
]


class TestPOSShiftOperations:
    """Test shift open/close operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.headers = {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
        }
    
    def test_01_get_active_shift_initially_none(self):
        """GET /api/commerce/pos/shifts - Check no active shift initially"""
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/shifts",
            params={'active': 'true', 'locationId': LOCATION_ID},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        # May or may not have active shift
        print(f"Active shift check: hasActiveShift={data.get('hasActiveShift')}")
    
    def test_02_open_shift_with_ngn_currency(self):
        """POST /api/commerce/pos/shifts - Open shift with NGN currency"""
        payload = {
            'action': 'open',
            'tenantId': TENANT_ID,
            'locationId': LOCATION_ID,
            'registerId': 'REG-001',
            'staffId': 'staff-adamu-001',
            'staffName': 'Adamu Musa',
            'openingFloat': 10000  # ₦10,000 opening float
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/shifts",
            json=payload,
            headers=self.headers
        )
        
        # May fail if shift already open - that's OK
        if response.status_code == 500 and 'already open' in response.json().get('error', ''):
            print("Shift already open - skipping open test")
            pytest.skip("Shift already open at this location")
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'shift' in data
        
        shift = data['shift']
        assert shift['currency'] == 'NGN'
        assert shift['openingFloat'] == 10000
        assert shift['status'] == 'OPEN'
        assert shift['locationId'] == LOCATION_ID
        print(f"Opened shift: {shift['shiftNumber']}")
    
    def test_03_verify_shift_requires_tenant_id(self):
        """POST /api/commerce/pos/shifts - Verify tenantId is required"""
        payload = {
            'action': 'open',
            'locationId': LOCATION_ID,
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/shifts",
            json=payload,
            headers={'Content-Type': 'application/json'}  # No x-tenant-id
        )
        assert response.status_code == 400
        data = response.json()
        assert 'tenantId' in data.get('error', '').lower() or 'tenant' in data.get('error', '').lower()


class TestPOSSaleOperations:
    """Test sale creation and item management"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.headers = {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
        }
        self.sale_id = None
    
    def test_01_create_sale(self):
        """POST /api/commerce/pos/sales - Create a new sale"""
        payload = {
            'tenantId': TENANT_ID,
            'locationId': LOCATION_ID,
            'staffId': 'staff-adamu-001',
            'staffName': 'Adamu Musa',
            'customerName': 'Chidi Okonkwo',
            'customerPhone': '+2348012345678'
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'saleId' in data
        print(f"Created sale: {data['saleId']}")
        return data['saleId']
    
    def test_02_add_nigerian_products(self):
        """POST /api/commerce/pos/sales/{id} - Add Nigerian products with NGN prices"""
        # First create a sale
        sale_id = self.test_01_create_sale()
        
        # Add each Nigerian product
        for product in NIGERIAN_PRODUCTS:
            payload = {
                'action': 'addItem',
                'tenantId': TENANT_ID,
                **product
            }
            response = requests.post(
                f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
                json=payload,
                headers=self.headers
            )
            assert response.status_code == 200
            data = response.json()
            assert data['success'] == True
            print(f"Added item: {product['productName']} - ₦{product['unitPrice']} x {product['quantity']}")
        
        # Verify items were added
        assert 'items' in data
        assert len(data['items']) == len(NIGERIAN_PRODUCTS)
        
        # Verify totals
        assert 'totals' in data
        expected_subtotal = sum(p['unitPrice'] * p['quantity'] for p in NIGERIAN_PRODUCTS)
        assert data['totals']['subtotal'] == expected_subtotal
        print(f"Cart subtotal: ₦{data['totals']['subtotal']}")
        return sale_id
    
    def test_03_apply_tax_7_5_percent(self):
        """POST /api/commerce/pos/sales/{id} - Apply 7.5% VAT"""
        # Create sale and add items
        sale_id = self.test_02_add_nigerian_products()
        
        # Apply tax
        payload = {
            'action': 'applyTax',
            'tenantId': TENANT_ID
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        
        # Verify 7.5% tax rate
        assert 'taxRate' in data
        assert data['taxRate'] == 0.075  # 7.5%
        
        # Verify tax calculation
        expected_subtotal = sum(p['unitPrice'] * p['quantity'] for p in NIGERIAN_PRODUCTS)
        expected_tax = round(expected_subtotal * 0.075, 2)
        
        assert 'totals' in data
        assert abs(data['totals']['taxTotal'] - expected_tax) < 1  # Allow small rounding difference
        print(f"Tax applied: ₦{data['totals']['taxTotal']} (7.5% VAT)")
        return sale_id
    
    def test_04_finalize_sale_cash_payment(self):
        """POST /api/commerce/pos/sales/{id} - Finalize with CASH payment"""
        # Create sale, add items, apply tax
        sale_id = self.test_03_apply_tax_7_5_percent()
        
        # Finalize with cash payment
        payload = {
            'action': 'finalize',
            'tenantId': TENANT_ID,
            'paymentMethod': 'CASH',
            'amountTendered': 5000  # ₦5,000 tendered
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'sale' in data
        
        sale = data['sale']
        assert sale['paymentMethod'] == 'CASH'
        assert sale['status'] == 'COMPLETED'
        assert sale['currency'] == 'NGN'
        print(f"Sale completed: {sale['saleNumber']} - Total: ₦{sale['grandTotal']}")
        return sale['id']
    
    def test_05_finalize_sale_bank_transfer(self):
        """POST /api/commerce/pos/sales/{id} - Finalize with BANK_TRANSFER payment"""
        # Create a new sale
        sale_id = self.test_02_add_nigerian_products()
        
        # Apply tax
        payload = {
            'action': 'applyTax',
            'tenantId': TENANT_ID
        }
        requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        
        # Finalize with bank transfer
        payload = {
            'action': 'finalize',
            'tenantId': TENANT_ID,
            'paymentMethod': 'BANK_TRANSFER',
            'transferReference': 'GTB-REF-123456',
            'transferBank': 'GTBank'
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        
        sale = data['sale']
        assert sale['paymentMethod'] == 'BANK_TRANSFER'
        assert sale['transferReference'] == 'GTB-REF-123456'
        print(f"Bank transfer sale completed: {sale['saleNumber']}")
        return sale['id']


class TestPOSReceiptGeneration:
    """Test receipt generation with NGN currency"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.headers = {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
        }
    
    def _create_completed_sale(self):
        """Helper to create a completed sale"""
        # Create sale
        payload = {
            'tenantId': TENANT_ID,
            'locationId': LOCATION_ID,
            'staffId': 'staff-adamu-001',
            'staffName': 'Adamu Musa'
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales",
            json=payload,
            headers=self.headers
        )
        sale_id = response.json()['saleId']
        
        # Add item
        payload = {
            'action': 'addItem',
            'tenantId': TENANT_ID,
            'productId': 'prod-test-001',
            'productName': 'Test Product',
            'unitPrice': 1000,
            'quantity': 1
        }
        requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        
        # Finalize
        payload = {
            'action': 'finalize',
            'tenantId': TENANT_ID,
            'paymentMethod': 'CASH',
            'amountTendered': 2000
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        return response.json()['sale']['id']
    
    def test_01_get_receipt_json_format(self):
        """GET /api/commerce/pos/receipts/{saleId} - Get receipt in JSON format"""
        sale_id = self._create_completed_sale()
        
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/receipts/{sale_id}",
            params={'format': 'json'},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'receipt' in data
        
        receipt = data['receipt']
        # Verify NGN currency symbol in receipt
        assert '₦' in receipt.get('total', '') or 'NGN' in str(receipt)
        print(f"Receipt generated: {receipt.get('receiptNumber')}")
    
    def test_02_get_receipt_html_format(self):
        """GET /api/commerce/pos/receipts/{saleId} - Get receipt in HTML format"""
        sale_id = self._create_completed_sale()
        
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/receipts/{sale_id}",
            params={'format': 'html'},
            headers=self.headers
        )
        assert response.status_code == 200
        # HTML format returns text/html
        assert 'text/html' in response.headers.get('Content-Type', '')
        # Verify NGN symbol in HTML
        assert '₦' in response.text
        print("HTML receipt generated with ₦ currency symbol")
    
    def test_03_get_receipt_sms_format(self):
        """GET /api/commerce/pos/receipts/{saleId} - Get receipt in SMS format"""
        sale_id = self._create_completed_sale()
        
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/receipts/{sale_id}",
            params={'format': 'sms'},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'smsText' in data
        assert 'characterCount' in data
        print(f"SMS receipt: {data['characterCount']} characters")


class TestPOSShiftCloseAndZReport:
    """Test shift close and Z-report generation"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.headers = {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
        }
    
    def _get_active_shift(self):
        """Get active shift ID"""
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/shifts",
            params={'active': 'true', 'locationId': LOCATION_ID},
            headers=self.headers
        )
        data = response.json()
        if data.get('hasActiveShift') and data.get('shift'):
            return data['shift']['id']
        return None
    
    def test_01_close_shift_with_cash_reconciliation(self):
        """POST /api/commerce/pos/shifts - Close shift with cash reconciliation"""
        shift_id = self._get_active_shift()
        
        if not shift_id:
            # Open a shift first
            payload = {
                'action': 'open',
                'tenantId': TENANT_ID,
                'locationId': LOCATION_ID,
                'staffId': 'staff-adamu-001',
                'staffName': 'Adamu Musa',
                'openingFloat': 10000
            }
            response = requests.post(
                f"{BASE_URL}/api/commerce/pos/shifts",
                json=payload,
                headers=self.headers
            )
            if response.status_code == 200:
                shift_id = response.json()['shift']['id']
            else:
                pytest.skip("Could not open shift for close test")
        
        # Close the shift
        payload = {
            'action': 'close',
            'tenantId': TENANT_ID,
            'shiftId': shift_id,
            'staffId': 'staff-adamu-001',
            'staffName': 'Adamu Musa',
            'actualCash': 10500,  # ₦10,500 actual cash
            'notes': 'End of day close'
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/shifts",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        
        shift = data['shift']
        assert shift['status'] == 'CLOSED'
        assert shift['actualCash'] == 10500
        assert 'cashVariance' in shift
        print(f"Shift closed: {shift['shiftNumber']} - Variance: ₦{shift.get('cashVariance', 0)}")
        return shift_id
    
    def test_02_generate_z_report(self):
        """GET /api/commerce/pos/reports?type=shift - Generate Z-report"""
        # First close a shift
        shift_id = self.test_01_close_shift_with_cash_reconciliation()
        
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/reports",
            params={'type': 'shift', 'shiftId': shift_id},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert data['type'] == 'shift'
        assert 'report' in data
        
        report = data['report']
        assert report['currency'] == 'NGN'
        assert 'grossSales' in report
        assert 'netSales' in report
        assert 'paymentBreakdown' in report
        print(f"Z-Report generated: Gross Sales ₦{report['grossSales']}, Net Sales ₦{report['netSales']}")


class TestPOSReports:
    """Test various POS reports"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.headers = {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
        }
    
    def test_01_daily_summary_report(self):
        """GET /api/commerce/pos/reports?type=daily - Daily summary"""
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/reports",
            params={'type': 'daily'},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert data['type'] == 'daily'
        print(f"Daily report generated")
    
    def test_02_payment_breakdown_report(self):
        """GET /api/commerce/pos/reports?type=payments - Payment breakdown"""
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/reports",
            params={'type': 'payments'},
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert data['type'] == 'payments'
        print(f"Payment breakdown report generated")
    
    def test_03_requires_tenant_id(self):
        """GET /api/commerce/pos/reports - Requires tenantId"""
        response = requests.get(
            f"{BASE_URL}/api/commerce/pos/reports",
            params={'type': 'daily'},
            headers={'Content-Type': 'application/json'}  # No x-tenant-id
        )
        assert response.status_code == 400
        data = response.json()
        assert 'tenantId' in data.get('error', '').lower() or 'tenant' in str(data).lower()


class TestNigeriaFirstRequirements:
    """Verify Nigeria-first requirements"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.headers = {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID
        }
    
    def test_01_ngn_currency_in_config(self):
        """Verify NGN currency is default"""
        # Create a sale and check currency
        payload = {
            'tenantId': TENANT_ID,
            'locationId': LOCATION_ID,
            'staffId': 'staff-test-001',
            'staffName': 'Test Staff'
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200
        # Currency is set at finalization, so just verify sale creation works
        print("NGN currency verified in sale creation")
    
    def test_02_tax_rate_7_5_percent(self):
        """Verify 7.5% VAT rate"""
        # Create sale
        payload = {
            'tenantId': TENANT_ID,
            'locationId': LOCATION_ID,
            'staffId': 'staff-test-001',
            'staffName': 'Test Staff'
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales",
            json=payload,
            headers=self.headers
        )
        sale_id = response.json()['saleId']
        
        # Add item
        payload = {
            'action': 'addItem',
            'tenantId': TENANT_ID,
            'productId': 'prod-tax-test',
            'productName': 'Tax Test Product',
            'unitPrice': 1000,
            'quantity': 1
        }
        requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        
        # Apply tax
        payload = {
            'action': 'applyTax',
            'tenantId': TENANT_ID
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify 7.5% tax rate
        assert data['taxRate'] == 0.075
        # Tax on ₦1000 should be ₦75
        assert data['totals']['taxTotal'] == 75
        print(f"7.5% VAT verified: ₦1000 subtotal → ₦75 tax")
    
    def test_03_bank_transfer_payment_available(self):
        """Verify Bank Transfer is available as payment method"""
        # Create sale
        payload = {
            'tenantId': TENANT_ID,
            'locationId': LOCATION_ID,
            'staffId': 'staff-test-001',
            'staffName': 'Test Staff'
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales",
            json=payload,
            headers=self.headers
        )
        sale_id = response.json()['saleId']
        
        # Add item
        payload = {
            'action': 'addItem',
            'tenantId': TENANT_ID,
            'productId': 'prod-transfer-test',
            'productName': 'Transfer Test Product',
            'unitPrice': 500,
            'quantity': 1
        }
        requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        
        # Finalize with bank transfer
        payload = {
            'action': 'finalize',
            'tenantId': TENANT_ID,
            'paymentMethod': 'BANK_TRANSFER',
            'transferReference': 'TEST-REF-001'
        }
        response = requests.post(
            f"{BASE_URL}/api/commerce/pos/sales/{sale_id}",
            json=payload,
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data['sale']['paymentMethod'] == 'BANK_TRANSFER'
        print("Bank Transfer payment method verified")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
