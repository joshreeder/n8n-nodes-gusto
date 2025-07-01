# n8n-nodes-gusto

![n8n](https://img.shields.io/badge/n8n-community--node-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Version](https://img.shields.io/npm/v/n8n-nodes-gusto)

A comprehensive n8n community node for integrating with Gusto HR and Payroll API. Automate employee management, payroll processing, and HR workflows with any system or service.

## Features

- 🏢 **Complete HR Management**: Employee lifecycle, company management, and payroll operations
- 🔄 **Real-time Webhooks**: Event-driven automation with Gusto webhooks
- 🔐 **Secure OAuth2**: Full OAuth2 authentication with production and demo environments
- 🔗 **Universal Integration**: Works with any HR system, ERP, CRM, or custom workflow
- ⚡ **Rate Limiting**: Built-in intelligent rate limiting and error handling
- 🎯 **Community Verified**: Built following n8n community standards

## Installation

### Via n8n Community Nodes (Recommended)

1. Go to **Settings** > **Community Nodes**
2. Search for `n8n-nodes-gusto`
3. Install the node

### Manual Installation

```bash
# In your n8n root directory
npm install n8n-nodes-gusto
```

### Docker Installation

```dockerfile
# Add to your Dockerfile
FROM n8nio/n8n:latest
USER root
RUN npm install -g n8n-nodes-gusto
USER node
```

## Quick Start

### 1. Setup Gusto OAuth2 Credentials

1. Create a Gusto Developer account at [developers.gusto.com](https://developers.gusto.com)
2. Create a new application and get your Client ID and Client Secret
3. In n8n, go to **Credentials** > **Add Credential** > **Gusto OAuth2 API**
4. Fill in your credentials:
   - **Client ID**: Your Gusto app client ID
   - **Client Secret**: Your Gusto app client secret
   - **Environment**: Choose Demo or Production

### 2. Basic Employee Data Workflow

Here's a simple workflow to get employee data from Gusto:

```json
{
  "nodes": [
    {
      "name": "Gusto - Get Employees",
      "type": "n8n-nodes-gusto.gusto",
      "parameters": {
        "resource": "employee",
        "operation": "getMany",
        "companyId": "your-company-id"
      }
    },
         {
       "name": "Process Employee Data",
       "type": "n8n-nodes-base.set",
       "parameters": {
         "values": {
           "employee_id": "={{$json.uuid}}",
           "full_name": "={{$json.first_name}} {{$json.last_name}}",
           "email": "={{$json.email}}",
           "hire_date": "={{$json.start_date}}",
           "department": "={{$json.department}}",
           "status": "={{$json.terminated ? 'Inactive' : 'Active'}}"
         }
       }
     },
     {
       "name": "Send to Your System",
       "type": "n8n-nodes-base.httpRequest",
       "parameters": {
         "url": "https://your-api-endpoint.com/employees",
         "method": "POST"
       }
     }
  ]
}
```

## Available Resources

### 🏢 Company
- **Get Company**: Retrieve company information
- **Get Many Companies**: List all accessible companies

### 👥 Employee  
- **Create Employee**: Add new employee to Gusto
- **Get Employee**: Retrieve employee details
- **Get Many Employees**: List company employees
- **Update Employee**: Modify employee information
- **Terminate Employee**: Process employee termination

### 💰 Payroll
- **Get Payroll**: Retrieve payroll details
- **Get Many Payrolls**: List company payrolls
- **Process Payroll**: Submit payroll for processing

### ⏰ Time & Attendance
- **Get Time Off Request**: Retrieve time off details
- **Get Many Time Off Requests**: List time off requests
- **Approve/Deny**: Process time off requests

### 🔗 Webhooks
- **Create Webhook**: Set up event subscriptions
- **Get/Delete Webhooks**: Manage webhook subscriptions

## Integration Examples

This connector works with any system that can receive HTTP requests or process data. Here are some popular integration scenarios:

### 🏢 HR Systems Integration

**Popular HR Platforms:**
- ERPNext, BambooHR, Workday, ADP, Namely
- Custom HRIS systems, Slack notifications
- Database updates (MySQL, PostgreSQL, MongoDB)

### 📊 Common Use Cases

#### 1. **Employee Onboarding Automation**
```javascript
// New hire workflow
Gusto Employee Created → 
  Transform Data → 
  Create Accounts (Google Workspace, Slack) →
  Send Welcome Email →
  Update HRIS Database
```

#### 2. **Payroll Notifications**
```javascript
// Payroll completion alerts
Gusto Payroll Processed →
  Calculate Totals →
  Send Summary Email →
  Update Accounting System →
  Notify Finance Team
```

#### 3. **Employee Directory Sync**
```javascript
// Keep directories updated
Schedule Weekly →
  Get All Employees →
  Transform Data →
  Update Directory (Active Directory, Google, etc.)
```

### 🔧 Data Transformation Examples

#### Employee Data Standardization
```javascript
// Transform Gusto data for any system
{
  "employee_id": "={{$json.uuid}}",
  "full_name": "={{$json.first_name}} {{$json.last_name}}",
  "email": "={{$json.email}}",
  "hire_date": "={{$json.start_date}}",
  "department": "={{$json.department}}",
  "manager": "={{$json.manager?.full_name}}",
  "salary": "={{$json.compensation?.rate}}",
  "status": "={{$json.terminated ? 'Inactive' : 'Active'}}"
}
```

#### Payroll Data Processing
```javascript
// Process payroll for reporting/accounting
{
  "pay_period": "={{$json.pay_period_start_date}} to {{$json.pay_period_end_date}}",
  "employee_id": "={{$json.employee_uuid}}",
  "gross_earnings": "={{$json.gross_pay}}",
  "net_pay": "={{$json.net_pay}}",
  "tax_deductions": "={{$json.employee_taxes}}",
  "benefit_deductions": "={{$json.employee_deductions}}",
  "employer_taxes": "={{$json.employer_taxes}}"
}
```

### 🚀 Advanced Automation Workflows

#### Multi-System Employee Sync
```javascript
// Sync new employees across multiple systems
Gusto Webhook (Employee Created) →
  Get Employee Details →
  Branch Workflow:
    ├── Create Google Workspace Account
    ├── Add to Slack Workspace  
    ├── Update CRM Database
    ├── Send IT Equipment Request
    └── Notify Manager via Email
```

#### Compliance Reporting
```javascript
// Generate compliance reports
Schedule Monthly →
  Get All Employees →
  Get Payroll Data →
  Calculate Metrics →
  Generate Report →
  Email to Compliance Team
```

## Webhook Events

The Gusto Trigger node supports these webhook events:

| Event | Description | Use Case |
|-------|-------------|----------|
| `employee.created` | New employee added | Auto-create in ERPNext |
| `employee.updated` | Employee data changed | Sync updates |
| `employee.terminated` | Employee terminated | Update status |
| `payroll.created` | New payroll period | Prepare salary slips |
| `payroll.processed` | Payroll completed | Generate final slips |
| `company.updated` | Company info changed | Update company master |

## Advanced Configuration

### Rate Limiting

The connector includes built-in rate limiting that respects Gusto's API limits:
- 100 requests per minute
- Automatic retry with exponential backoff
- Queue management for bulk operations

### Error Handling

```javascript
// Custom error handling in workflows
if ($json.error) {
  // Log error and continue
  console.log('Gusto API Error:', $json.error);
  return { error: $json.error, skipItem: true };
}
```

### Data Validation

```javascript
// Validate employee data before ERPNext sync
const requiredFields = ['first_name', 'last_name', 'email'];
const isValid = requiredFields.every(field => $json[field]);

if (!isValid) {
  throw new Error('Missing required employee fields');
}
```

## Troubleshooting

### Common Issues

1. **OAuth2 Authentication Failed**
   - Verify Client ID and Client Secret
   - Check redirect URLs match Gusto app settings
   - Ensure correct environment (Demo vs Production)

2. **Webhook Not Receiving Events**
   - Verify webhook URL is publicly accessible
   - Check Gusto webhook subscription status
   - Review n8n webhook logs

3. **Integration Sync Errors**
   - Validate data mappings and transformations
   - Check target system API permissions
   - Review field requirements and data formats

### Debug Mode

Enable debug logging in n8n:
```bash
export N8N_LOG_LEVEL=debug
```

### API Rate Limits

If you hit rate limits:
- Reduce batch sizes
- Add delays between requests
- Use webhook triggers instead of polling

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build: `npm run build`
4. Test: `npm run test`

### Submitting Issues

Please use our [Issue Template](.github/ISSUE_TEMPLATE.md) when reporting bugs or requesting features.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a complete list of changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://github.com/joshreeder/n8n-nodes-gusto/wiki)
- 💬 [Community Forum](https://community.n8n.io)
- 🐛 [Bug Reports](https://github.com/joshreeder/n8n-nodes-gusto/issues)
- 💡 [Feature Requests](https://github.com/joshreeder/n8n-nodes-gusto/issues)

## Acknowledgments

- n8n community for the excellent automation platform
- Gusto for providing comprehensive HR and Payroll APIs
- The open-source community for continuous inspiration

---

Built with ❤️ for the n8n automation community 