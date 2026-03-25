import requests
import sys
import json
from datetime import datetime

class StellarPortfolioTester:
    def __init__(self, base_url="https://stellar-portfolio-49.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def run_test(self, name, method, endpoint, expected_status, data=None, response_type='json'):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Parse response based on type
                if response_type == 'json' and response.content:
                    try:
                        response_data = response.json()
                        print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")
                        self.test_results.append({
                            'test': name,
                            'status': 'PASS',
                            'response_data': response_data
                        })
                        return True, response_data
                    except json.JSONDecodeError:
                        print(f"   Warning: Could not parse JSON response")
                        return True, {}
                elif response_type == 'csv':
                    print(f"   CSV Response length: {len(response.content)} bytes")
                    self.test_results.append({
                        'test': name,
                        'status': 'PASS',
                        'response_data': f"CSV file ({len(response.content)} bytes)"
                    })
                    return True, response.content
                else:
                    self.test_results.append({
                        'test': name,
                        'status': 'PASS',
                        'response_data': 'Empty or non-JSON response'
                    })
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json() if response.content else {}
                    print(f"   Error response: {error_data}")
                except:
                    print(f"   Error response: {response.text[:200]}")
                
                self.test_results.append({
                    'test': name,
                    'status': 'FAIL',
                    'expected_status': expected_status,
                    'actual_status': response.status_code,
                    'error': response.text[:200]
                })
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (30s)")
            self.test_results.append({
                'test': name,
                'status': 'FAIL',
                'error': 'Request timeout'
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                'test': name,
                'status': 'FAIL',
                'error': str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_portfolio_endpoint(self):
        """Test portfolio endpoint - main functionality"""
        success, data = self.run_test("Portfolio Data", "GET", "portfolio", 200)
        
        if success and data:
            # Validate portfolio structure
            required_fields = ['total_value_eur', 'spot_value_eur', 'lp_value_eur', 'holdings', 'lp_positions', 'stellar_address', 'last_updated']
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                print(f"   ⚠️  Missing required fields: {missing_fields}")
                return False
            
            print(f"   Portfolio Value: €{data.get('total_value_eur', 0)}")
            print(f"   Holdings Count: {len(data.get('holdings', []))}")
            print(f"   LP Positions Count: {len(data.get('lp_positions', []))}")
            print(f"   Stellar Address: {data.get('stellar_address', 'N/A')[:16]}...")
            
            return True
        return success

    def test_history_endpoint(self):
        """Test history endpoint"""
        success, data = self.run_test("Portfolio History", "GET", "history?days=30", 200)
        
        if success and data:
            snapshots = data.get('snapshots', [])
            print(f"   History snapshots: {len(snapshots)}")
            if snapshots:
                latest = snapshots[-1]
                print(f"   Latest snapshot: €{latest.get('total_value_eur', 0)} at {latest.get('timestamp', 'N/A')}")
        
        return success

    def test_settings_endpoint(self):
        """Test settings endpoint"""
        success, data = self.run_test("Settings", "GET", "settings", 200)
        
        if success and data:
            print(f"   Stellar Address: {data.get('stellar_address', 'N/A')[:16]}...")
            print(f"   Refresh Interval: {data.get('refresh_interval_hours', 'N/A')} hours")
            print(f"   Dark Mode: {data.get('dark_mode', 'N/A')}")
        
        return success

    def test_refresh_endpoint(self):
        """Test manual refresh endpoint"""
        success, data = self.run_test("Manual Refresh", "POST", "refresh", 200)
        
        if success and data:
            portfolio = data.get('portfolio', {})
            print(f"   Refreshed Portfolio Value: €{portfolio.get('total_value_eur', 0)}")
        
        return success

    def test_export_endpoint(self):
        """Test CSV export endpoint"""
        return self.run_test("CSV Export", "GET", "export", 200, response_type='csv')

    def test_xlm_price_endpoint(self):
        """Test XLM price endpoint"""
        success, data = self.run_test("XLM Price", "GET", "prices/xlm", 200)
        
        if success and data:
            print(f"   XLM Price: €{data.get('price_eur', 0)}")
            print(f"   Currency: {data.get('currency', 'N/A')}")
        
        return success

    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("🚀 STELLAR PORTFOLIO TRACKER - BACKEND API TESTS")
        print("=" * 60)
        
        # Test all endpoints
        tests = [
            self.test_root_endpoint,
            self.test_portfolio_endpoint,
            self.test_history_endpoint,
            self.test_settings_endpoint,
            self.test_refresh_endpoint,
            self.test_export_endpoint,
            self.test_xlm_price_endpoint
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
                self.test_results.append({
                    'test': test.__name__,
                    'status': 'FAIL',
                    'error': str(e)
                })
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 BACKEND TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%")
        
        # Show failed tests
        failed_tests = [r for r in self.test_results if r['status'] == 'FAIL']
        if failed_tests:
            print(f"\n❌ FAILED TESTS:")
            for test in failed_tests:
                print(f"   - {test['test']}: {test.get('error', 'Unknown error')}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = StellarPortfolioTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())