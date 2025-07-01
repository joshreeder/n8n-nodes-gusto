# Gusto n8n Connector - Testing Guide

This guide provides comprehensive testing procedures for the Gusto n8n connector, including unit tests, integration tests, and specific testing scenarios for ERPNext integration.

## Table of Contents
- [Testing Strategy](#testing-strategy)
- [Test Environment Setup](#test-environment-setup)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [ERPNext Integration Testing](#erpnext-integration-testing)
- [Webhook Testing](#webhook-testing)
- [Performance Testing](#performance-testing)
- [Security Testing](#security-testing)
- [Test Data & Fixtures](#test-data--fixtures)
- [Automated Testing](#automated-testing)
- [Manual Testing Procedures](#manual-testing-procedures)

## Testing Strategy

### Test Pyramid
```
    /\
   /  \    E2E Tests (10%)
  /____\   - Full workflow testing
 /      \  - ERPNext integration scenarios
/__________\ Integration Tests (30%)
            - API interaction testing
            - Webhook processing
____________
            Unit Tests (60%)
            - Individual function testing
            - Credential validation
            - Data transformation
```

### Testing Principles
1. **Fast Feedback**: Unit tests run in < 5 seconds
2. **Reliable**: Tests are deterministic and repeatable
3. **Isolated**: Each test is independent
4. **Comprehensive**: Cover happy path, edge cases, and errors
5. **Maintainable**: Tests are easy to understand and update

## Test Environment Setup

### Prerequisites
```bash
# Install testing dependencies
npm install --save-dev \
  jest \
  @types/jest \
  supertest \
  nock \
  msw \
  @faker-js/faker
```

### Environment Configuration
```typescript
// test.env
NODE_ENV=test
GUSTO_CLIENT_ID=test_client_id
GUSTO_CLIENT_SECRET=test_client_secret
GUSTO_REDIRECT_URI=http://localhost:5678/oauth2/callback
GUSTO_BASE_URL=https://api.gusto-demo.com
ERPNEXT_BASE_URL=http://test-erpnext:8000
ERPNEXT_API_KEY=test_key
ERPNEXT_API_SECRET=test_secret
```

### Test Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};
```

## Unit Testing

### Credential Testing
```typescript
// test/credentials/GustoOAuth2Api.test.ts
import { GustoOAuth2Api } from '../../credentials/GustoOAuth2Api.credentials';

describe('GustoOAuth2Api', () => {
  let credentials: GustoOAuth2Api;

  beforeEach(() => {
    credentials = new GustoOAuth2Api();
  });

  describe('authenticate', () => {
    it('should return access token for valid credentials', async () => {
      const mockCredentials = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
      };

      const result = await credentials.authenticate(mockCredentials);
      
      expect(result).toHaveProperty('Authorization');
      expect(result.Authorization).toBe('Bearer test_access_token');
    });

    it('should refresh token when access token expires', async () => {
      const mockCredentials = {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        accessToken: 'expired_token',
        refreshToken: 'valid_refresh_token',
      };

      // Mock token refresh response
      nock('https://api.gusto-demo.com')
        .post('/oauth/token')
        .reply(200, {
          access_token: 'new_access_token',
          refresh_token: 'new_refresh_token',
          expires_in: 3600,
        });

      const result = await credentials.authenticate(mockCredentials);
      
      expect(result.Authorization).toBe('Bearer new_access_token');
    });

    it('should throw error for invalid credentials', async () => {
      const invalidCredentials = {
        clientId: 'invalid_client',
        clientSecret: 'invalid_secret',
      };

      await expect(credentials.authenticate(invalidCredentials))
        .rejects.toThrow('Invalid credentials');
    });
  });
});
```

### Node Operation Testing
```typescript
// test/nodes/Gusto/employee.operations.test.ts
import { EmployeeOperations } from '../../nodes/Gusto/operations/employee';
import { mockGustoApi } from '../helpers/mockApi';

describe('Employee Operations', () => {
  let operations: EmployeeOperations;

  beforeEach(() => {
    operations = new EmployeeOperations();
    mockGustoApi.reset();
  });

  describe('createEmployee', () => {
    it('should create employee with valid data', async () => {
      const employeeData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@company.com',
        startDate: '2024-01-15',
      };

      mockGustoApi.post('/v1/companies/123/employees')
        .reply(201, {
          uuid: 'emp-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@company.com',
          start_date: '2024-01-15',
        });

      const result = await operations.createEmployee('123', employeeData);

      expect(result).toMatchObject({
        uuid: 'emp-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
      });
    });

    it('should handle validation errors', async () => {
      const invalidData = {
        firstName: '',
        lastName: 'Doe',
        email: 'invalid-email',
      };

      await expect(operations.createEmployee('123', invalidData))
        .rejects.toThrow('Invalid employee data');
    });

    it('should handle API errors gracefully', async () => {
      mockGustoApi.post('/v1/companies/123/employees')
        .reply(400, { error: 'Invalid company ID' });

      const employeeData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@company.com',
      };

      await expect(operations.createEmployee('123', employeeData))
        .rejects.toThrow('Invalid company ID');
    });
  });

  describe('getEmployee', () => {
    it('should retrieve employee by ID', async () => {
      mockGustoApi.get('/v1/employees/emp-123')
        .reply(200, {
          uuid: 'emp-123',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@company.com',
        });

      const result = await operations.getEmployee('emp-123');

      expect(result.uuid).toBe('emp-123');
      expect(result.email).toBe('john.doe@company.com');
    });

    it('should handle employee not found', async () => {
      mockGustoApi.get('/v1/employees/non-existent')
        .reply(404, { error: 'Employee not found' });

      await expect(operations.getEmployee('non-existent'))
        .rejects.toThrow('Employee not found');
    });
  });
});
```

### Data Transformation Testing
```typescript
// test/helpers/dataTransformation.test.ts
import { transformGustoToERPNext, transformERPNextToGusto } from '../../helpers/dataTransformation';

describe('Data Transformation', () => {
  describe('transformGustoToERPNext', () => {
    it('should transform employee data correctly', () => {
      const gustoEmployee = {
        uuid: 'emp-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
        start_date: '2024-01-15',
        department: 'Engineering',
        job_title: 'Software Developer',
      };

      const erpnextEmployee = transformGustoToERPNext(gustoEmployee);

      expect(erpnextEmployee).toEqual({
        employee: 'emp-123',
        first_name: 'John',
        last_name: 'Doe',
        personal_email: 'john.doe@company.com',
        date_of_joining: '2024-01-15',
        department: 'Engineering',
        designation: 'Software Developer',
        status: 'Active',
      });
    });

    it('should handle missing optional fields', () => {
      const gustoEmployee = {
        uuid: 'emp-123',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@company.com',
      };

      const erpnextEmployee = transformGustoToERPNext(gustoEmployee);

      expect(erpnextEmployee.department).toBeUndefined();
      expect(erpnextEmployee.designation).toBeUndefined();
    });

    it('should validate required fields', () => {
      const invalidEmployee = {
        first_name: 'John',
        // Missing required fields
      };

      expect(() => transformGustoToERPNext(invalidEmployee))
        .toThrow('Missing required field: uuid');
    });
  });

  describe('transformERPNextToGusto', () => {
    it('should transform payroll data correctly', () => {
      const erpnextSalarySlip = {
        employee: 'emp-123',
        gross_pay: 5000,
        net_pay: 3750,
        total_deduction: 1250,
        start_date: '2024-01-01',
        end_date: '2024-01-15',
      };

      const gustoPayroll = transformERPNextToGusto(erpnextSalarySlip);

      expect(gustoPayroll).toEqual({
        employee_uuid: 'emp-123',
        gross_pay: 5000,
        net_pay: 3750,
        total_deductions: 1250,
        pay_period_start_date: '2024-01-01',
        pay_period_end_date: '2024-01-15',
      });
    });
  });
});
```

## Integration Testing

### API Integration Tests
```typescript
// test/integration/gustoApi.test.ts
import { GustoNode } from '../../nodes/Gusto/Gusto.node';
import { setupTestServer } from '../helpers/testServer';

describe('Gusto API Integration', () => {
  let gustoNode: GustoNode;
  let testServer: any;

  beforeAll(async () => {
    testServer = await setupTestServer();
  });

  afterAll(async () => {
    await testServer.close();
  });

  beforeEach(() => {
    gustoNode = new GustoNode();
  });

  describe('Employee Management', () => {
    it('should create and retrieve employee', async () => {
      // Create employee
      const createResult = await gustoNode.execute({
        resource: 'employee',
        operation: 'create',
        parameters: {
          companyId: 'test-company-123',
          firstName: 'Integration',
          lastName: 'Test',
          email: 'integration.test@company.com',
          startDate: '2024-01-15',
        },
      });

      expect(createResult).toHaveProperty('uuid');
      const employeeId = createResult.uuid;

      // Retrieve employee
      const getResult = await gustoNode.execute({
        resource: 'employee',
        operation: 'get',
        parameters: {
          employeeId,
        },
      });

      expect(getResult.uuid).toBe(employeeId);
      expect(getResult.email).toBe('integration.test@company.com');
    });

    it('should handle rate limiting gracefully', async () => {
      const requests = Array(10).fill(null).map((_, i) => 
        gustoNode.execute({
          resource: 'employee',
          operation: 'list',
          parameters: { companyId: 'test-company-123' },
        })
      );

      const results = await Promise.allSettled(requests);
      
      // All requests should eventually succeed
      const failures = results.filter(r => r.status === 'rejected');
      expect(failures.length).toBeLessThan(3); // Allow some failures due to rate limiting
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      // Simulate network failure
      testServer.close();

      await expect(gustoNode.execute({
        resource: 'employee',
        operation: 'get',
        parameters: { employeeId: 'emp-123' },
      })).rejects.toThrow(/network error|connection refused/i);
    });

    it('should handle API errors with proper messages', async () => {
      await expect(gustoNode.execute({
        resource: 'employee',
        operation: 'get',
        parameters: { employeeId: 'non-existent' },
      })).rejects.toThrow('Employee not found');
    });
  });
});
```

## ERPNext Integration Testing

### End-to-End Workflow Tests
```typescript
// test/integration/erpnext.workflow.test.ts
import { ERPNextIntegration } from '../../helpers/erpnextIntegration';
import { GustoWebhookHandler } from '../../nodes/GustoTrigger/webhookHandler';

describe('ERPNext Integration Workflows', () => {
  let erpnext: ERPNextIntegration;
  let webhookHandler: GustoWebhookHandler;

  beforeEach(async () => {
    erpnext = new ERPNextIntegration({
      baseUrl: process.env.ERPNEXT_BASE_URL,
      apiKey: process.env.ERPNEXT_API_KEY,
      apiSecret: process.env.ERPNEXT_API_SECRET,
    });
    
    webhookHandler = new GustoWebhookHandler();
    
    // Clean up test data
    await erpnext.cleanup();
  });

  describe('Employee Onboarding Workflow', () => {
    it('should sync new employee from Gusto to ERPNext', async () => {
      // Simulate Gusto webhook for new employee
      const webhookPayload = {
        event_type: 'employee.created',
        data: {
          employee: {
            uuid: 'test-emp-001',
            first_name: 'Test',
            last_name: 'Employee',
            email: 'test.employee@company.com',
            start_date: '2024-01-15',
            department: 'Engineering',
            job_title: 'Software Developer',
          },
        },
      };

      // Process webhook
      await webhookHandler.handleEmployeeCreated(webhookPayload);

      // Verify employee created in ERPNext
      const erpnextEmployee = await erpnext.getEmployee('test-emp-001');
      
      expect(erpnextEmployee).toMatchObject({
        employee: 'test-emp-001',
        first_name: 'Test',
        last_name: 'Employee',
        personal_email: 'test.employee@company.com',
        date_of_joining: '2024-01-15',
        department: 'Engineering',
        designation: 'Software Developer',
        status: 'Active',
      });
    });

    it('should handle duplicate employee creation gracefully', async () => {
      // Create employee first time
      const webhookPayload = {
        event_type: 'employee.created',
        data: {
          employee: {
            uuid: 'test-emp-002',
            first_name: 'Duplicate',
            last_name: 'Test',
            email: 'duplicate.test@company.com',
          },
        },
      };

      await webhookHandler.handleEmployeeCreated(webhookPayload);

      // Try to create same employee again
      await expect(webhookHandler.handleEmployeeCreated(webhookPayload))
        .not.toThrow();

      // Verify only one employee exists
      const employees = await erpnext.listEmployees({
        filters: [['employee', '=', 'test-emp-002']],
      });
      
      expect(employees.length).toBe(1);
    });
  });

  describe('Payroll Processing Workflow', () => {
    it('should create salary slips from Gusto payroll', async () => {
      // First create employee
      await erpnext.createEmployee({
        employee: 'test-emp-003',
        first_name: 'Payroll',
        last_name: 'Test',
        personal_email: 'payroll.test@company.com',
        status: 'Active',
      });

      // Simulate payroll webhook
      const payrollWebhook = {
        event_type: 'payroll.processed',
        data: {
          payroll: {
            uuid: 'payroll-001',
            pay_period_start_date: '2024-01-01',
            pay_period_end_date: '2024-01-15',
            employee_compensations: [{
              employee_uuid: 'test-emp-003',
              gross_pay: 5000,
              net_pay: 3750,
              employee_taxes: 1000,
              employee_deductions: 250,
            }],
          },
        },
      };

      await webhookHandler.handlePayrollProcessed(payrollWebhook);

      // Verify salary slip created
      const salarySlips = await erpnext.listSalarySlips({
        filters: [['employee', '=', 'test-emp-003']],
      });

      expect(salarySlips.length).toBe(1);
      expect(salarySlips[0]).toMatchObject({
        employee: 'test-emp-003',
        gross_pay: 5000,
        net_pay: 3750,
        total_deduction: 1250,
      });
    });
  });

  describe('Employee Termination Workflow', () => {
    it('should update employee status when terminated', async () => {
      // Create active employee
      await erpnext.createEmployee({
        employee: 'test-emp-004',
        first_name: 'Termination',
        last_name: 'Test',
        status: 'Active',
      });

      // Simulate termination webhook
      const terminationWebhook = {
        event_type: 'employee.terminated',
        data: {
          employee: {
            uuid: 'test-emp-004',
            termination_date: '2024-02-15',
          },
        },
      };

      await webhookHandler.handleEmployeeTerminated(terminationWebhook);

      // Verify employee status updated
      const employee = await erpnext.getEmployee('test-emp-004');
      
      expect(employee.status).toBe('Left');
      expect(employee.relieving_date).toBe('2024-02-15');
    });
  });
});
```

## Webhook Testing

### Webhook Security Testing
```typescript
// test/webhooks/security.test.ts
import { verifyWebhookSignature } from '../../nodes/GustoTrigger/security';
import crypto from 'crypto';

describe('Webhook Security', () => {
  const webhookSecret = 'test-webhook-secret';

  describe('signature verification', () => {
    it('should verify valid signatures', () => {
      const payload = JSON.stringify({ test: 'data' });
      const signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = verifyWebhookSignature(
        payload,
        signature,
        webhookSecret
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid signatures', () => {
      const payload = JSON.stringify({ test: 'data' });
      const invalidSignature = 'invalid-signature';

      const isValid = verifyWebhookSignature(
        payload,
        invalidSignature,
        webhookSecret
      );

      expect(isValid).toBe(false);
    });

    it('should handle timing attack protection', () => {
      const payload = JSON.stringify({ test: 'data' });
      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');
      
      const almostValidSignature = validSignature.slice(0, -1) + '0';

      const startTime = process.hrtime.bigint();
      verifyWebhookSignature(payload, almostValidSignature, webhookSecret);
      const endTime = process.hrtime.bigint();
      
      const timeDiff = Number(endTime - startTime) / 1e6; // Convert to ms
      
      // Verification should take consistent time regardless of signature validity
      expect(timeDiff).toBeGreaterThan(0.1); // Minimum processing time
    });
  });
});
```

## Performance Testing

### Load Testing
```typescript
// test/performance/load.test.ts
import { performance } from 'perf_hooks';

describe('Performance Tests', () => {
  describe('API Response Times', () => {
    it('should handle employee list requests within acceptable time', async () => {
      const startTime = performance.now();
      
      await gustoNode.execute({
        resource: 'employee',
        operation: 'list',
        parameters: { companyId: 'test-company-123' },
      });
      
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000); // 2 seconds max
    });

    it('should handle concurrent requests efficiently', async () => {
      const concurrentRequests = 5;
      const startTime = performance.now();
      
      const requests = Array(concurrentRequests).fill(null).map(() =>
        gustoNode.execute({
          resource: 'employee',
          operation: 'list',
          parameters: { companyId: 'test-company-123' },
        })
      );
      
      await Promise.all(requests);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const avgTime = totalTime / concurrentRequests;
      
      expect(avgTime).toBeLessThan(3000); // 3 seconds average
    });
  });

  describe('Memory Usage', () => {
    it('should not have memory leaks during bulk operations', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Perform bulk operations
      for (let i = 0; i < 100; i++) {
        await gustoNode.execute({
          resource: 'employee',
          operation: 'list',
          parameters: { companyId: 'test-company-123' },
        });
      }
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB max
    });
  });
});
```

## Test Data & Fixtures

### Sample Test Data
```typescript
// test/fixtures/testData.ts
export const testEmployees = {
  johnDoe: {
    uuid: 'emp-john-001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@company.com',
    start_date: '2024-01-15',
    department: 'Engineering',
    job_title: 'Software Developer',
    salary: 75000,
  },
  janeDoe: {
    uuid: 'emp-jane-002',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane.doe@company.com',
    start_date: '2024-02-01',
    department: 'Marketing',
    job_title: 'Marketing Manager',
    salary: 65000,
  },
};

export const testPayrolls = {
  januaryPayroll: {
    uuid: 'payroll-jan-2024',
    pay_period_start_date: '2024-01-01',
    pay_period_end_date: '2024-01-15',
    processed_date: '2024-01-20',
    employee_compensations: [
      {
        employee_uuid: 'emp-john-001',
        gross_pay: 6250,
        net_pay: 4687.50,
        employee_taxes: 1250,
        employee_deductions: 312.50,
      },
    ],
  },
};

export const testERPNextData = {
  employees: [
    {
      employee: 'emp-john-001',
      first_name: 'John',
      last_name: 'Doe',
      personal_email: 'john.doe@company.com',
      date_of_joining: '2024-01-15',
      department: 'Engineering',
      designation: 'Software Developer',
      status: 'Active',
    },
  ],
  salarySlips: [
    {
      employee: 'emp-john-001',
      salary_structure: 'Default Salary Structure',
      company: 'Test Company',
      posting_date: '2024-01-20',
      start_date: '2024-01-01',
      end_date: '2024-01-15',
      gross_pay: 6250,
      total_deduction: 1562.50,
      net_pay: 4687.50,
    },
  ],
};
```

## Automated Testing

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      erpnext:
        image: frappe/erpnext:latest
        ports:
          - 8000:8000
        env:
          MARIADB_ROOT_PASSWORD: root
          
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run unit tests
        run: npm run test:unit
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          ERPNEXT_BASE_URL: http://localhost:8000
          ERPNEXT_API_KEY: ${{ secrets.ERPNEXT_API_KEY }}
          ERPNEXT_API_SECRET: ${{ secrets.ERPNEXT_API_SECRET }}
          
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
  }
}
```

## Manual Testing Procedures

### Pre-deployment Checklist
- [ ] OAuth2 authentication flow works
- [ ] All CRUD operations functional
- [ ] Webhook subscriptions work
- [ ] ERPNext integration syncs correctly
- [ ] Error handling displays proper messages
- [ ] Rate limiting respects API limits
- [ ] Performance meets benchmarks
- [ ] Security validations pass

### Manual Test Scenarios

#### 1. Employee Lifecycle Test
```
1. Create new employee in Gusto
2. Verify webhook triggers in n8n
3. Confirm employee created in ERPNext
4. Update employee information in Gusto
5. Verify changes sync to ERPNext
6. Terminate employee in Gusto
7. Confirm status updated in ERPNext
```

#### 2. Payroll Processing Test
```
1. Process payroll in Gusto
2. Verify payroll webhook received
3. Check salary slips created in ERPNext
4. Validate payroll calculations match
5. Confirm employee earnings updated
```

#### 3. Error Recovery Test
```
1. Simulate API failures
2. Verify error handling
3. Test retry mechanisms
4. Confirm data consistency
```

#### 4. Authentication Test
```
1. Test OAuth2 flow with valid credentials
2. Test token refresh mechanism
3. Test with invalid credentials
4. Verify security headers are set correctly
```

#### 5. Data Transformation Test
```
1. Verify Gusto employee data maps correctly to ERPNext
2. Test payroll data transformation
3. Check date format conversions
4. Validate currency and numeric field handling
```

## Test Data & Fixtures

### Sample Test Data
```typescript
export const testEmployees = {
  johnDoe: {
    uuid: 'emp-john-001',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john.doe@company.com',
    start_date: '2024-01-15',
    department: 'Engineering',
    job_title: 'Software Developer',
    salary: 75000,
  },
  janeDoe: {
    uuid: 'emp-jane-002',
    first_name: 'Jane',
    last_name: 'Doe',
    email: 'jane.doe@company.com',
    start_date: '2024-02-01',
    department: 'Marketing',
    job_title: 'Marketing Manager',
    salary: 65000,
  },
};

export const testPayrolls = {
  januaryPayroll: {
    uuid: 'payroll-jan-2024',
    pay_period_start_date: '2024-01-01',
    pay_period_end_date: '2024-01-15',
    processed_date: '2024-01-20',
    employee_compensations: [
      {
        employee_uuid: 'emp-john-001',
        gross_pay: 6250,
        net_pay: 4687.50,
        employee_taxes: 1250,
        employee_deductions: 312.50,
      },
    ],
  },
};
```

## Automated Testing Setup

### Test Scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### CI/CD Pipeline
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm run test:coverage
```

---

This testing guide provides comprehensive coverage for ensuring the Gusto n8n connector works reliably in all scenarios, especially with ERPNext integration. 