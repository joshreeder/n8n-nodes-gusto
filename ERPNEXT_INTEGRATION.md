# Gusto n8n Connector - ERPNext Integration Guide

This document provides comprehensive guidance for integrating the Gusto n8n connector with ERPNext, including specific data mappings, field requirements, and workflow examples.

## Table of Contents
- [Prerequisites](#prerequisites)
- [ERPNext Setup Requirements](#erpnext-setup-requirements)
- [Data Mapping Reference](#data-mapping-reference)
- [Workflow Examples](#workflow-examples)
- [Field Requirements & Validation](#field-requirements--validation)
- [Common Issues & Solutions](#common-issues--solutions)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

### ERPNext Requirements
- **ERPNext Version**: 13+ (recommended: latest version)
- **HR Module**: Must be enabled
- **API Access**: REST API enabled with proper authentication
- **User Permissions**: System Manager or HR Manager role for API operations

### Gusto Requirements
- **Gusto Plan**: Core, Complete, or Concierge plan with API access
- **OAuth2 App**: Registered application in Gusto Developer Portal
- **Permissions**: Read/Write access to employees, payroll, and company data

### n8n Setup
- **n8n Instance**: Self-hosted or cloud with webhook support
- **Community Nodes**: Enabled for installing the Gusto connector
- **Network Access**: Can reach both Gusto API and ERPNext instance

## ERPNext Setup Requirements

### 1. Enable API Access

```python
# In ERPNext, go to System Settings
# Or add to site_config.json
{
  "developer_mode": 1,
  "allow_cors": "*",
  "cors_headers": "Content-Type,Authorization"
}
```

### 2. Create API User

```sql
-- Create dedicated user for n8n integration
INSERT INTO `tabUser` (
  name, email, first_name, user_type, 
  enabled, api_key, api_secret
) VALUES (
  'n8n-integration@company.com',
  'n8n-integration@company.com', 
  'N8N Integration',
  'System User',
  1,
  -- Generate these in ERPNext User form
  'your-api-key',
  'your-api-secret'
);
```

### 3. Required DocTypes & Fields

Ensure these ERPNext DocTypes have the necessary fields:

#### Employee DocType
```python
# Required fields for Gusto sync
employee_fields = [
    'employee',           # Employee ID (from Gusto UUID)
    'first_name',         # First Name
    'last_name',          # Last Name  
    'personal_email',     # Email Address
    'company',            # Company
    'status',             # Active/Inactive/Left
    'date_of_joining',    # Hire Date
    'relieving_date',     # Termination Date
    'department',         # Department
    'designation',        # Job Title
    'salary_currency',    # Currency
    'employee_number'     # Optional: Employee Number
]
```

#### Salary Slip DocType
```python
# Required fields for payroll sync
salary_slip_fields = [
    'employee',           # Employee ID
    'salary_structure',   # Salary Structure
    'company',           # Company
    'posting_date',      # Payroll Date
    'start_date',        # Pay Period Start
    'end_date',          # Pay Period End
    'gross_pay',         # Gross Earnings
    'total_deduction',   # Total Deductions
    'net_pay',           # Net Pay
    'payroll_period'     # Payroll Period
]
```

## Data Mapping Reference

### Employee Data Mapping

| Gusto Field | ERPNext Field | Type | Required | Transformation Notes |
|-------------|---------------|------|----------|---------------------|
| `uuid` | `employee` | String | Yes | Use as primary identifier |
| `first_name` | `first_name` | String | Yes | Direct mapping |
| `last_name` | `last_name` | String | Yes | Direct mapping |
| `email` | `personal_email` | Email | Yes | Primary email address |
| `work_email` | `company_email` | Email | No | Work email if different |
| `start_date` | `date_of_joining` | Date | Yes | Format: YYYY-MM-DD |
| `termination_date` | `relieving_date` | Date | No | Only if terminated |
| `department` | `department` | Link | No | Must exist in ERPNext |
| `job_title` | `designation` | Link | No | Must exist in ERPNext |
| `manager.full_name` | `reports_to` | Link | No | Link to Employee |
| `phone` | `cell_number` | Phone | No | Mobile number |
| `home_address` | `current_address` | Text | No | Full address |
| `date_of_birth` | `date_of_birth` | Date | No | Format: YYYY-MM-DD |
| `ssn` | `passport_number` | String | No | Store in document field |

### Payroll Data Mapping

| Gusto Field | ERPNext Field | Type | Required | Calculation Notes |
|-------------|---------------|------|----------|------------------|
| `employee_uuid` | `employee` | Link | Yes | Link to Employee |
| `gross_pay` | `gross_pay` | Currency | Yes | Total earnings |
| `net_pay` | `net_pay` | Currency | Yes | Take-home pay |
| `employee_taxes` | `total_deduction` | Currency | No | Tax deductions only |
| `employee_deductions` | `total_deduction` | Currency | No | Add to tax deductions |
| `pay_period_start_date` | `start_date` | Date | Yes | Payroll period start |
| `pay_period_end_date` | `end_date` | Date | Yes | Payroll period end |
| `check_date` | `posting_date` | Date | Yes | Payment date |
| `pay_schedule_name` | `payroll_period` | String | No | Pay frequency |

### Status Mapping

| Gusto Status | ERPNext Status | Notes |
|--------------|----------------|-------|
| `active` | `Active` | Current employee |
| `terminated` | `Left` | Former employee |
| `inactive` | `Inactive` | Temporarily inactive |

## Workflow Examples

### 1. Employee Onboarding Workflow

```json
{
  "name": "Gusto to ERPNext Employee Sync",
  "description": "Sync new employees from Gusto to ERPNext",
  "trigger": {
    "type": "gustoTrigger",
    "events": ["employee.created"],
    "options": {
      "verifySignature": true
    }
  },
  "nodes": [
    {
      "name": "Get Employee Details",
      "type": "gusto",
      "operation": "employee.get",
      "parameters": {
        "employeeId": "={{$json.body.employee.uuid}}"
      }
    },
    {
      "name": "Check if Employee Exists",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "{{$parameter.erpnext_url}}/api/resource/Employee/{{$json.uuid}}",
        "ignoreHttpStatusErrors": true
      }
    },
    {
      "name": "Transform Employee Data",
      "type": "set",
      "parameters": {
        "values": {
          "employee": "={{$json.uuid}}",
          "first_name": "={{$json.first_name}}",
          "last_name": "={{$json.last_name}}",
          "personal_email": "={{$json.email}}",
          "company": "{{$parameter.company_name}}",
          "date_of_joining": "={{$json.start_date}}",
          "status": "Active",
          "department": "={{$json.department || 'General'}}",
          "designation": "={{$json.job_title || 'Employee'}}",
          "employee_number": "={{$json.employee_number}}",
          "salary_currency": "USD"
        }
      }
    },
    {
      "name": "Create ERPNext Employee",
      "type": "httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$parameter.erpnext_url}}/api/resource/Employee",
        "body": {
          "data": "={{JSON.stringify($json)}}"
        },
        "headers": {
          "Authorization": "token {{$parameter.erpnext_api_key}}:{{$parameter.erpnext_api_secret}}",
          "Content-Type": "application/json"
        }
      }
    }
  ]
}
```

### 2. Payroll Processing Workflow

```json
{
  "name": "Gusto Payroll to ERPNext Salary Slips",
  "description": "Create salary slips in ERPNext when payroll is processed in Gusto",
  "trigger": {
    "type": "gustoTrigger",
    "events": ["payroll.processed"]
  },
  "nodes": [
    {
      "name": "Get Payroll Details",
      "type": "gusto",
      "operation": "payroll.get",
      "parameters": {
        "payrollId": "={{$json.body.payroll.uuid}}"
      }
    },
    {
      "name": "Split Employee Payrolls",
      "type": "splitInBatches",
      "parameters": {
        "batchSize": 1
      }
    },
    {
      "name": "Get Employee in ERPNext",
      "type": "httpRequest",
      "parameters": {
        "method": "GET",
        "url": "{{$parameter.erpnext_url}}/api/resource/Employee?filters=[[\"employee\",\"=\",\"{{$json.employee_uuid}}\"]]"
      }
    },
    {
      "name": "Transform Salary Slip Data",
      "type": "set",
      "parameters": {
        "values": {
          "employee": "={{$json.employee_uuid}}",
          "salary_structure": "Default Salary Structure",
          "company": "{{$parameter.company_name}}",
          "posting_date": "={{$json.check_date}}",
          "start_date": "={{$json.pay_period_start_date}}",
          "end_date": "={{$json.pay_period_end_date}}",
          "gross_pay": "={{$json.gross_pay}}",
          "total_deduction": "={{$json.employee_taxes + $json.employee_deductions}}",
          "net_pay": "={{$json.net_pay}}",
          "payroll_period": "={{$json.pay_schedule_name}}"
        }
      }
    },
    {
      "name": "Create Salary Slip",
      "type": "httpRequest",
      "parameters": {
        "method": "POST",
        "url": "{{$parameter.erpnext_url}}/api/resource/Salary Slip",
        "body": {
          "data": "={{JSON.stringify($json)}}"
        }
      }
    }
  ]
}
```

### 3. Employee Termination Workflow

```json
{
  "name": "Handle Employee Termination",
  "description": "Update employee status when terminated in Gusto",
  "trigger": {
    "type": "gustoTrigger",
    "events": ["employee.terminated"]
  },
  "nodes": [
    {
      "name": "Update Employee Status",
      "type": "httpRequest",
      "parameters": {
        "method": "PUT",
        "url": "{{$parameter.erpnext_url}}/api/resource/Employee/{{$json.body.employee.uuid}}",
        "body": {
          "status": "Left",
          "relieving_date": "={{$json.body.termination.effective_date}}"
        }
      }
    }
  ]
}
```

## Field Requirements & Validation

### ERPNext Field Setup

#### Employee Master Customizations

Add these custom fields if not present:

```python
# Custom fields for Employee DocType
custom_fields = [
    {
        "fieldname": "gusto_employee_id",
        "label": "Gusto Employee ID",
        "fieldtype": "Data",
        "unique": 1,
        "read_only": 1
    },
    {
        "fieldname": "gusto_sync_date",
        "label": "Last Gusto Sync",
        "fieldtype": "Datetime",
        "read_only": 1
    }
]
```

#### Data Validation Rules

```javascript
// Validation function for employee data
function validateEmployeeData(gustoData) {
  const required = ['uuid', 'first_name', 'last_name', 'email'];
  const missing = required.filter(field => !gustoData[field]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required fields: ${missing.join(', ')}`);
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(gustoData.email)) {
    throw new Error('Invalid email format');
  }
  
  // Date validation
  if (gustoData.start_date && !isValidDate(gustoData.start_date)) {
    throw new Error('Invalid start date format');
  }
  
  return true;
}
```

### Department & Designation Sync

Ensure departments and designations exist in ERPNext:

```python
# Create departments from Gusto
def create_department_if_not_exists(dept_name):
    if not frappe.db.exists("Department", dept_name):
        dept = frappe.new_doc("Department")
        dept.department_name = dept_name
        dept.save()
        return dept.name
    return dept_name

# Create designations from Gusto
def create_designation_if_not_exists(designation):
    if not frappe.db.exists("Designation", designation):
        desig = frappe.new_doc("Designation")
        desig.designation_name = designation
        desig.save()
        return desig.name
    return designation
```

## Common Issues & Solutions

### 1. Authentication Issues

**Problem**: ERPNext API authentication fails
```bash
Error: 403 Forbidden - Invalid API credentials
```

**Solution**:
```javascript
// Ensure proper authentication format
const auth = {
  "Authorization": `token ${api_key}:${api_secret}`,
  "Content-Type": "application/json"
};

// Test authentication
curl -X GET \
  "https://your-erpnext.com/api/resource/Employee" \
  -H "Authorization: token your-key:your-secret"
```

### 2. Duplicate Employee Creation

**Problem**: Employees being created multiple times

**Solution**:
```javascript
// Check if employee exists before creating
const checkEmployee = async (uuid) => {
  const response = await fetch(
    `${erpnextUrl}/api/resource/Employee?filters=[["employee","=","${uuid}"]]`,
    { headers: authHeaders }
  );
  const data = await response.json();
  return data.data.length > 0;
};
```

### 3. Date Format Issues

**Problem**: Date format mismatch between Gusto and ERPNext

**Solution**:
```javascript
// Standardize date format
const formatDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
};
```

### 4. Department/Designation Not Found

**Problem**: ERPNext requires existing Department/Designation

**Solution**:
```javascript
// Create or get department
const ensureDepartment = async (deptName) => {
  if (!deptName) return 'General';
  
  try {
    // Check if exists
    const response = await fetch(
      `${erpnextUrl}/api/resource/Department/${deptName}`,
      { headers: authHeaders }
    );
    
    if (response.ok) return deptName;
    
    // Create if doesn't exist
    await fetch(`${erpnextUrl}/api/resource/Department`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        data: {
          department_name: deptName
        }
      })
    });
    
    return deptName;
  } catch (error) {
    return 'General'; // Fallback
  }
};
```

## Advanced Configuration

### 1. Salary Structure Mapping

```python
# Map Gusto compensation to ERPNext salary structures
def map_salary_structure(gusto_employee):
    # Determine salary structure based on employee data
    if gusto_employee.get('hourly_rate'):
        return 'Hourly Employee Structure'
    elif gusto_employee.get('salary'):
        return 'Salaried Employee Structure'
    else:
        return 'Default Salary Structure'
```

### 2. Custom Field Mapping

```javascript
// Map custom fields from Gusto to ERPNext
const mapCustomFields = (gustoEmployee) => {
  return {
    ...standardMapping(gustoEmployee),
    // Custom mappings
    custom_emergency_contact: gustoEmployee.emergency_contact?.name,
    custom_shirt_size: gustoEmployee.custom_fields?.shirt_size,
    custom_start_time: gustoEmployee.work_schedule?.start_time,
    custom_work_location: gustoEmployee.work_location?.name
  };
};
```

### 3. Error Handling & Retry Logic

```javascript
// Robust error handling for ERPNext API calls
const erpnextApiCall = async (endpoint, method = 'GET', data = null, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(`${erpnextUrl}${endpoint}`, {
        method,
        headers: authHeaders,
        body: data ? JSON.stringify({ data }) : undefined
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
};
```

### 4. Batch Processing

```javascript
// Process large employee lists in batches
const batchSize = 10;
const processBatch = async (employees) => {
  const batches = [];
  for (let i = 0; i < employees.length; i += batchSize) {
    batches.push(employees.slice(i, i + batchSize));
  }
  
  for (const batch of batches) {
    await Promise.all(batch.map(employee => processEmployee(employee)));
    // Wait between batches to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
};
```

## Testing & Validation

### Test Checklist

- [ ] Authentication working with ERPNext API
- [ ] Employee creation from Gusto webhook
- [ ] Employee update synchronization
- [ ] Employee termination handling
- [ ] Salary slip creation from payroll
- [ ] Department/designation auto-creation
- [ ] Error handling and retry logic
- [ ] Data validation and formatting
- [ ] Rate limiting compliance
- [ ] Webhook signature verification

### Sample Test Data

```json
{
  "test_employee": {
    "uuid": "test-employee-001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "start_date": "2024-01-15",
    "department": "Engineering",
    "job_title": "Software Developer",
    "salary": 75000
  },
  "test_payroll": {
    "employee_uuid": "test-employee-001",
    "gross_pay": 6250.00,
    "net_pay": 4687.50,
    "employee_taxes": 1250.00,
    "employee_deductions": 312.50,
    "pay_period_start_date": "2024-01-01",
    "pay_period_end_date": "2024-01-15",
    "check_date": "2024-01-20"
  }
}
```

---

This integration guide should provide everything needed to successfully connect Gusto with ERPNext using the n8n connector. For additional support, refer to the main README or create an issue in the project repository. 