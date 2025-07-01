# ERPNext Integration Examples

This folder contains ready-to-use n8n workflow examples for integrating Gusto with ERPNext. Each workflow is designed to be imported directly into your n8n instance and configured with your specific ERPNext and Gusto settings.

## 🚀 Quick Start

### Prerequisites
1. **n8n instance** with the Gusto connector installed
2. **ERPNext instance** with API access enabled
3. **Gusto account** with API access and webhook capabilities
4. **Proper credentials** configured in n8n

### Setup Steps
1. Import the workflow JSON file into n8n
2. Configure your credentials (see [Configuration](#configuration) below)
3. Set up workflow parameters
4. Test with sample data
5. Activate the workflow

## 📁 Available Workflows

### 1. Employee Onboarding (`01-employee-onboarding-erpnext.json`)
**Purpose**: Automatically create employees in ERPNext when they are added to Gusto

**Features**:
- ✅ Full employee data mapping (Gusto → ERPNext)
- ✅ Automatic department creation if missing
- ✅ Automatic designation/job title creation if missing
- ✅ Duplicate employee prevention
- ✅ Custom field population for Gusto tracking
- ✅ Comprehensive error handling

**Triggers**: `employee.created` webhook from Gusto

**ERPNext Data Created**:
- Employee record with all relevant fields
- Department (if new)
- Designation (if new)

### 2. Payroll Processing (`02-payroll-processing-erpnext.json`)
**Purpose**: Create salary slips in ERPNext when payroll is processed in Gusto

**Features**:
- ✅ Batch processing for multiple employees
- ✅ Employee verification in ERPNext
- ✅ Duplicate salary slip prevention
- ✅ Complete payroll data mapping
- ✅ Processing summary and reporting
- ✅ Error handling for missing employees

**Triggers**: `payroll.processed` webhook from Gusto

**ERPNext Data Created**:
- Salary Slip records for each employee
- Payroll period tracking
- Custom Gusto reference fields

### 3. Employee Termination (`03-employee-termination-erpnext.json`)
**Purpose**: Update employee status and handle exit process when employees are terminated in Gusto

**Features**:
- ✅ Employee status update to "Left"
- ✅ Termination date setting
- ✅ Draft salary slip cancellation
- ✅ Open leave application cancellation
- ✅ Exit process automation
- ✅ Termination reason tracking

**Triggers**: `employee.terminated` webhook from Gusto

**ERPNext Updates**:
- Employee status and relieving date
- Cancelled draft documents
- Termination tracking fields

## ⚙️ Configuration

### Required Credentials

#### 1. Gusto OAuth2 API (`gusto-credentials`)
```json
{
  "clientId": "your_gusto_client_id",
  "clientSecret": "your_gusto_client_secret", 
  "environment": "production", // or "demo" for testing
  "scope": "employee:read employee:write payroll:read company:read"
}
```

#### 2. ERPNext API Authentication (`erpnext-api`)
```json
{
  "headerAuth": {
    "name": "Authorization",
    "value": "token YOUR_API_KEY:YOUR_API_SECRET"
  }
}
```

### Required Parameters

Each workflow requires these parameters to be set:

#### Global Parameters
- `erpnext_url`: Your ERPNext instance URL (e.g., `https://your-company.erpnext.com`)
- `company_name`: Your company name in ERPNext (must match exactly)

#### Payroll-Specific Parameters
- `default_salary_structure`: Default salary structure name (e.g., `"Default Salary Structure"`)

### Parameter Setup in n8n
1. Open the workflow
2. Go to **Workflow Settings** → **Parameters**
3. Add the required parameters:
   ```json
   {
     "erpnext_url": "https://your-company.erpnext.com",
     "company_name": "Your Company Name",
     "default_salary_structure": "Default Salary Structure"
   }
   ```

## 🔧 ERPNext Setup Requirements

### Required Custom Fields

Add these custom fields to your ERPNext Employee DocType:

```python
# Custom fields for Employee
[
    {
        "fieldname": "custom_gusto_employee_id",
        "label": "Gusto Employee ID", 
        "fieldtype": "Data",
        "unique": 1,
        "read_only": 1
    },
    {
        "fieldname": "custom_gusto_sync_date",
        "label": "Last Gusto Sync",
        "fieldtype": "Datetime", 
        "read_only": 1
    },
    {
        "fieldname": "custom_termination_reason",
        "label": "Termination Reason",
        "fieldtype": "Data"
    },
    {
        "fieldname": "custom_final_work_date", 
        "label": "Final Work Date",
        "fieldtype": "Date"
    },
    {
        "fieldname": "custom_termination_notes",
        "label": "Termination Notes",
        "fieldtype": "Text"
    }
]
```

Add these custom fields to your ERPNext Salary Slip DocType:

```python
# Custom fields for Salary Slip
[
    {
        "fieldname": "custom_gusto_payroll_id",
        "label": "Gusto Payroll ID",
        "fieldtype": "Data",
        "read_only": 1
    },
    {
        "fieldname": "custom_gusto_sync_date", 
        "label": "Gusto Sync Date",
        "fieldtype": "Datetime",
        "read_only": 1
    }
]
```

### API Permissions

Ensure your ERPNext API user has permissions for:
- Employee (Read, Write, Create)
- Salary Slip (Read, Write, Create, Delete)
- Department (Read, Write, Create)
- Designation (Read, Write, Create)
- Leave Application (Read, Write)

## 🧪 Testing

### Test Data Examples

#### Employee Creation Test
```json
{
  "event_type": "employee.created",
  "employee": {
    "uuid": "test-emp-001",
    "first_name": "John",
    "last_name": "Doe", 
    "email": "john.doe@company.com",
    "start_date": "2024-01-15",
    "department": "Engineering",
    "job_title": "Software Developer"
  }
}
```

#### Payroll Processing Test
```json
{
  "event_type": "payroll.processed",
  "payroll": {
    "uuid": "payroll-001",
    "pay_period_start_date": "2024-01-01",
    "pay_period_end_date": "2024-01-15", 
    "check_date": "2024-01-20",
    "employee_compensations": [
      {
        "employee_uuid": "test-emp-001",
        "gross_pay": 5000,
        "net_pay": 3750,
        "employee_taxes": 1000,
        "employee_deductions": 250
      }
    ]
  }
}
```

### Testing Checklist
- [ ] Webhook signatures verified
- [ ] Employee creation successful
- [ ] Department auto-creation working
- [ ] Designation auto-creation working
- [ ] Payroll processing functional
- [ ] Duplicate prevention working
- [ ] Error handling tested
- [ ] Termination process complete

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Errors
```
Error: 403 Forbidden
```
**Solution**: Check ERPNext API credentials and permissions

#### 2. Department/Designation Not Found
```
Error: Link validation failed for Department
```
**Solution**: The workflow automatically creates missing departments/designations

#### 3. Duplicate Employee
```
Error: Employee already exists
```
**Solution**: Workflow skips duplicate creation and logs the event

#### 4. Missing Custom Fields
```
Error: Invalid field 'custom_gusto_employee_id'
```
**Solution**: Add the required custom fields to ERPNext (see setup requirements)

### Debug Mode

Enable debug mode by setting these workflow parameters:
```json
{
  "debug_mode": true,
  "log_all_data": true
}
```

## 📊 Monitoring

### Workflow Execution Logs
Each workflow provides detailed execution logs including:
- Employee processing results
- Error messages and handling
- Data transformation logs
- ERPNext API responses
- Processing summaries

### Key Metrics to Monitor
- Employee sync success rate
- Payroll processing completion rate
- Error frequency and types
- Webhook processing time
- ERPNext API response times

## 🚀 Advanced Usage

### Customization Options

#### Custom Field Mappings
Modify the transformation nodes to add your specific field mappings:

```javascript
// Add custom mappings in the "Transform" nodes
{
  "custom_employee_id": "={{$json.employee_number}}",
  "custom_hire_source": "={{$json.custom_fields.hire_source}}",
  "custom_manager": "={{$json.manager.full_name}}"
}
```

#### Additional Webhooks
Add more webhook events by modifying the trigger configuration:

```json
{
  "events": [
    "employee.created",
    "employee.updated", 
    "employee.terminated",
    "payroll.processed",
    "company.updated"
  ]
}
```

#### Custom Notifications
Add notification nodes to send alerts via email, Slack, or other channels when events are processed.

## 📞 Support

For issues specific to these ERPNext integration examples:
1. Check the [ERPNext Integration Guide](../ERPNEXT_INTEGRATION.md)
2. Review the [Implementation Checklist](../ERPNEXT_IMPLEMENTATION_CHECKLIST.md)
3. Create an issue in the project repository

For general n8n or Gusto API questions, refer to their respective documentation.

---

**Last Updated**: 2024-01-01  
**Compatible with**: ERPNext 13+, n8n 1.0+, Gusto API v1 