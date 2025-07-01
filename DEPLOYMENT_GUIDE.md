# Gusto n8n Connector - Deployment Guide

This guide covers the complete deployment process for the Gusto n8n connector, from local development to community submission and production deployment.

## Table of Contents
- [Local Development Setup](#local-development-setup)
- [Building and Testing](#building-and-testing)
- [Publishing to npm](#publishing-to-npm)
- [n8n Community Submission](#n8n-community-submission)
- [Installation in n8n](#installation-in-n8n)
- [Production Configuration](#production-configuration)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites
- **Node.js**: Version 18+ (LTS recommended)
- **npm**: Version 8+ 
- **n8n**: Latest version for testing
- **Git**: For version control
- **TypeScript**: For development

### Development Environment
```bash
# Clone the repository
git clone https://github.com/your-org/n8n-nodes-gusto.git
cd n8n-nodes-gusto

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link

# In your n8n installation directory
npm link n8n-nodes-gusto
```

### Environment Variables
Create a `.env` file for development:
```bash
# Development environment
NODE_ENV=development

# Gusto API Configuration
GUSTO_CLIENT_ID=your_development_client_id
GUSTO_CLIENT_SECRET=your_development_client_secret
GUSTO_REDIRECT_URI=http://localhost:5678/oauth2/callback
GUSTO_BASE_URL=https://api.gusto-demo.com

# ERPNext Test Instance (optional)
ERPNEXT_BASE_URL=http://localhost:8000
ERPNEXT_API_KEY=test_api_key
ERPNEXT_API_SECRET=test_api_secret

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret_for_testing
```

### Development Workflow
```bash
# Start development with auto-rebuild
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## Building and Testing

### Build Process
```bash
# Clean previous builds
npm run clean

# Build TypeScript
npm run build

# Verify build output
ls -la dist/

# Test the built package
npm run test:built
```

### Quality Assurance
```bash
# Run full test suite
npm run test:all

# Check for vulnerabilities
npm audit

# Validate package structure
npm pack --dry-run

# Check bundle size
npm run analyze
```

### Pre-publish Checklist
- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] No security vulnerabilities
- [ ] Documentation up to date
- [ ] Version number updated
- [ ] CHANGELOG.md updated
- [ ] README.md accurate
- [ ] Examples work correctly

## Publishing to npm

### Version Management
```bash
# Update version (patch/minor/major)
npm version patch  # 1.0.0 -> 1.0.1
npm version minor  # 1.0.0 -> 1.1.0
npm version major  # 1.0.0 -> 2.0.0

# Or manually update package.json version
```

### Publishing Steps
```bash
# Login to npm (if not already logged in)
npm login

# Verify package contents
npm pack
tar -tzf n8n-nodes-gusto-*.tgz

# Publish to npm
npm publish

# For beta versions
npm publish --tag beta

# For pre-release versions
npm publish --tag next
```

### Package Configuration
Ensure `package.json` is correctly configured:
```json
{
  "name": "n8n-nodes-gusto",
  "version": "1.0.0",
  "description": "n8n community node for Gusto API integration",
  "license": "MIT",
  "homepage": "https://github.com/your-org/n8n-nodes-gusto",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/your-org/n8n-nodes-gusto.git"
  },
  "main": "index.js",
  "files": [
    "dist"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/GustoOAuth2Api.credentials.js"
    ],
    "nodes": [
      "dist/nodes/Gusto/Gusto.node.js",
      "dist/nodes/GustoTrigger/GustoTrigger.node.js"
    ]
  },
  "keywords": [
    "n8n-community-node-package",
    "n8n",
    "gusto",
    "hr",
    "payroll",
    "employees",
    "automation",
    "workflow",
    "integration"
  ]
}
```

## n8n Community Submission

### Submission Requirements
1. **Package published to npm** with proper structure
2. **Community node criteria met**:
   - Uses `n8n-community-node-package` keyword
   - Follows naming convention `n8n-nodes-*`
   - No runtime dependencies
   - Proper documentation

3. **Quality standards**:
   - Code follows n8n conventions
   - Comprehensive error handling
   - User-friendly parameter descriptions
   - Examples and documentation

### Submission Process
1. **Prepare submission form** at [n8n community nodes](https://community.n8n.io)
2. **Required information**:
   - Package name: `n8n-nodes-gusto`
   - npm URL: `https://www.npmjs.com/package/n8n-nodes-gusto`
   - GitHub repository
   - Description and use cases
   - Documentation links

3. **Review process**:
   - n8n team reviews submission
   - May request changes or improvements
   - Once approved, listed in community nodes

### Community Guidelines Compliance
```typescript
// Ensure proper node structure
export class Gusto implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Gusto',
    name: 'gusto',
    icon: 'file:gusto.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Interact with Gusto API for HR and payroll operations',
    defaults: {
      name: 'Gusto',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'gustoOAuth2Api',
        required: true,
      },
    ],
    properties: [
      // Node properties...
    ],
  };
}
```

## Installation in n8n

### Community Node Installation
Users can install the community node in their n8n instance:

```bash
# Self-hosted n8n
npm install n8n-nodes-gusto

# Or using n8n CLI
n8n install n8n-nodes-gusto
```

### n8n Cloud Installation
For n8n Cloud users:
1. Go to **Settings** → **Community Nodes**
2. Click **Install a community node**
3. Enter package name: `n8n-nodes-gusto`
4. Click **Install**

### Docker Installation
For Docker-based n8n installations:
```dockerfile
# Custom n8n Docker image with Gusto node
FROM n8nio/n8n:latest

USER root
RUN npm install -g n8n-nodes-gusto
USER node
```

Or using docker-compose:
```yaml
# docker-compose.yml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
    volumes:
      - n8n_data:/home/node/.n8n
    ports:
      - "5678:5678"
    command: sh -c "npm install -g n8n-nodes-gusto && n8n start"

volumes:
  n8n_data:
```

## Production Configuration

### Gusto API Setup
1. **Create Gusto Application**:
   - Go to [Gusto Developer Portal](https://dev.gusto.com)
   - Create new application
   - Configure OAuth2 settings
   - Note client ID and secret

2. **Configure OAuth2**:
   ```json
   {
     "clientId": "your_production_client_id",
     "clientSecret": "your_production_client_secret",
     "accessTokenUrl": "https://api.gusto.com/oauth/token",
     "authUrl": "https://api.gusto.com/oauth/authorize",
     "scope": "employee:read employee:write payroll:read payroll:write company:read",
     "environment": "production"
   }
   ```

### Security Configuration
```bash
# Environment variables for production
GUSTO_CLIENT_ID=prod_client_id
GUSTO_CLIENT_SECRET=prod_client_secret
GUSTO_ENVIRONMENT=production
WEBHOOK_SECRET=secure_webhook_secret

# n8n Configuration
N8N_ENCRYPTION_KEY=your_encryption_key
N8N_USER_MANAGEMENT_JWT_SECRET=your_jwt_secret
```

### Rate Limiting Configuration
```typescript
// Configure rate limiting for production
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
};
```

### Webhook Configuration
1. **Configure webhook endpoints** in Gusto:
   ```bash
   POST https://api.gusto.com/v1/webhooks
   {
     "url": "https://your-n8n-instance.com/webhook/gusto",
     "events": [
       "employee.created",
       "employee.updated", 
       "employee.terminated",
       "payroll.processed"
     ]
   }
   ```

2. **Set up webhook security**:
   - Verify webhook signatures
   - Use HTTPS endpoints
   - Implement replay protection

## Monitoring and Maintenance

### Logging Configuration
```typescript
// Enhanced logging for production
import { LoggerProxy } from 'n8n-workflow';

export class GustoLogger {
  static log(level: string, message: string, meta?: any) {
    LoggerProxy.log(level, `[Gusto] ${message}`, meta);
  }

  static error(message: string, error?: Error) {
    LoggerProxy.error(`[Gusto] ${message}`, { error: error?.stack });
  }

  static warn(message: string, meta?: any) {
    LoggerProxy.warn(`[Gusto] ${message}`, meta);
  }

  static info(message: string, meta?: any) {
    LoggerProxy.info(`[Gusto] ${message}`, meta);
  }
}
```

### Health Checks
```typescript
// Health check endpoint for monitoring
export async function healthCheck(): Promise<boolean> {
  try {
    // Test Gusto API connectivity
    const response = await fetch('https://api.gusto.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Health check failed', error);
    return false;
  }
}
```

### Performance Monitoring
```typescript
// Performance metrics collection
export class PerformanceMetrics {
  static startTimer(operation: string) {
    return {
      operation,
      startTime: Date.now(),
      end: function() {
        const duration = Date.now() - this.startTime;
        GustoLogger.info(`Operation completed`, {
          operation: this.operation,
          duration_ms: duration
        });
        return duration;
      }
    };
  }
}
```

### Update Strategy
```bash
# Regular maintenance schedule
# 1. Weekly: Check for security updates
npm audit

# 2. Monthly: Update dependencies  
npm update

# 3. Quarterly: Review and update Gusto API integration
# 4. As needed: Bug fixes and feature updates
```

## Troubleshooting

### Common Issues

#### 1. Authentication Problems
```bash
# Check OAuth2 credentials
curl -X POST https://api.gusto.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&code=AUTH_CODE"
```

#### 2. Rate Limiting
```typescript
// Handle rate limits gracefully
export async function handleRateLimit(error: any, retryCount = 0): Promise<any> {
  if (error.status === 429 && retryCount < 3) {
    const retryAfter = error.headers?.['retry-after'] || Math.pow(2, retryCount);
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
    return retryCount + 1;
  }
  throw error;
}
```

#### 3. Webhook Issues
```typescript
// Debug webhook signature verification
export function debugWebhookSignature(payload: string, signature: string, secret: string) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
    
  console.log('Expected:', expectedSignature);
  console.log('Received:', signature);
  console.log('Match:', expectedSignature === signature);
}
```

#### 4. Data Mapping Issues
```typescript
// Validate data transformation
export function validateDataMapping(source: any, target: any, mapping: any) {
  const errors: string[] = [];
  
  for (const [sourceField, targetField] of Object.entries(mapping)) {
    if (source[sourceField] && !target[targetField]) {
      errors.push(`Missing mapping: ${sourceField} -> ${targetField}`);
    }
  }
  
  return errors;
}
```

### Error Recovery
```typescript
// Implement circuit breaker pattern
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly threshold = 5;
  private readonly timeout = 60000; // 1 minute

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private isOpen(): boolean {
    return this.failures >= this.threshold && 
           (Date.now() - this.lastFailureTime) < this.timeout;
  }

  private onSuccess(): void {
    this.failures = 0;
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
```

### Support and Documentation
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and examples
- **Community Support**: n8n community forums
- **Enterprise Support**: Available for enterprise customers

---

This deployment guide provides everything needed to successfully deploy and maintain the Gusto n8n connector in production environments. 