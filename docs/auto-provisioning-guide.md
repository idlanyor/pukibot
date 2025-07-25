# Pterodactyl Auto-Provisioning Configuration Guide

This guide explains how to configure the auto-provisioning system for automatic server creation when orders are confirmed.

## Required Environment Variables

### Basic Pterodactyl Configuration
```env
# Pterodactyl Panel URL
PTERODACTYL_URL=https://panel.example.com

# Pterodactyl Admin API Key (required for auto-provisioning)
PTERODACTYL_ADMIN_API_KEY=ptla_your_admin_api_key_here

# Default Node ID for server creation
DEFAULT_NODE_ID=1

# Base port for new allocations
BASE_PORT=25565

# Email domain for generated user accounts
PTERODACTYL_EMAIL_DOMAIN=example.com
```

### Package-Specific Configuration

#### Bronze Package
```env
BRONZE_EGG_ID=1
BRONZE_DOCKER_IMAGE=ghcr.io/pterodactyl/yolks:java_17
BRONZE_STARTUP=java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}
```

#### Silver Package
```env
SILVER_EGG_ID=1
SILVER_DOCKER_IMAGE=ghcr.io/pterodactyl/yolks:java_17
SILVER_STARTUP=java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}
```

#### Gold Package
```env
GOLD_EGG_ID=1
GOLD_DOCKER_IMAGE=ghcr.io/pterodactyl/yolks:java_17
GOLD_STARTUP=java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}
```

#### Platinum Package
```env
PLATINUM_EGG_ID=1
PLATINUM_DOCKER_IMAGE=ghcr.io/pterodactyl/yolks:java_17
PLATINUM_STARTUP=java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}
```

#### Diamond Package
```env
DIAMOND_EGG_ID=1
DIAMOND_DOCKER_IMAGE=ghcr.io/pterodactyl/yolks:java_17
DIAMOND_STARTUP=java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}
```

## How Auto-Provisioning Works

### 1. Order Confirmation Trigger
When an admin confirms an order using `!order-confirm [order-id]`, the system:
- Updates order status to CONFIRMED
- Checks if auto-provisioning is enabled
- Automatically starts the provisioning process

### 2. Provisioning Process
1. **Health Check**: Verifies Pterodactyl Admin API connection
2. **User Creation**: Creates a new user account with generated credentials
3. **Resource Mapping**: Determines server specifications based on package type
4. **Allocation Finding**: Finds or creates available port allocations
5. **Server Creation**: Creates the server with appropriate resources
6. **Credential Generation**: Generates secure login credentials
7. **Notification**: Sends comprehensive credentials to customer via WhatsApp

### 3. Rollback Mechanism
If provisioning fails at any step:
- Automatically rolls back any created resources
- Updates order status back to CONFIRMED
- Notifies admin of the failure
- Provides retry options

## Admin Commands

### Basic Commands
- `!provision-status` - Check auto-provisioning system status
- `!provision-test` - Test connection to Pterodactyl Admin API
- `!provision-retry [order-id]` - Retry failed provisioning

### Order Management
- `!order-confirm [order-id]` - Confirm order and trigger auto-provisioning
- `!order-detail [order-id]` - View order details including provisioning status

## Customer Notifications

### Server Ready Notification
When provisioning succeeds, customers receive:
- Panel login URL and credentials
- Server information (ID, specifications)
- Step-by-step usage instructions
- Important security reminders

### Provisioning Failed Notification
When provisioning fails, customers receive:
- Notification that manual setup is in progress
- Expected timeline for completion
- Admin contact information

## Troubleshooting

### Common Issues

1. **"Auto-provisioning not configured"**
   - Check PTERODACTYL_ADMIN_API_KEY is set
   - Verify PTERODACTYL_URL is correct
   - Ensure API key has admin permissions

2. **"No available allocations"**
   - Check DEFAULT_NODE_ID exists
   - Verify node has available ports
   - System will attempt to create new allocations

3. **"Failed to create server"**
   - Check egg ID exists for package type
   - Verify docker image is available
   - Ensure node has sufficient resources

### Health Check
Use `!provision-test` to verify:
- Admin API connection
- Pterodactyl panel accessibility
- Configuration completeness

## Security Considerations

### Generated Credentials
- Passwords are 16 characters with mixed case, numbers, and symbols
- Usernames include phone number hash and timestamp
- Emails use configurable domain

### API Security
- Admin API key should have minimal required permissions
- Regular key rotation recommended
- Monitor API usage logs

## Resource Mappings

### Default Specifications
| Package  | RAM    | CPU   | Disk  | Databases | Allocations | Backups |
|----------|--------|-------|-------|-----------|-------------|---------|
| Bronze   | 1GB    | 100%  | 5GB   | 1         | 1           | 1       |
| Silver   | 2GB    | 200%  | 10GB  | 2         | 2           | 2       |
| Gold     | 4GB    | 400%  | 20GB  | 3         | 3           | 3       |
| Platinum | 8GB    | 800%  | 40GB  | 5         | 5           | 5       |
| Diamond  | 16GB   | 1600% | 80GB  | 10        | 10          | 10      |

### Customization
Resource mappings can be customized via environment variables or modified in the AutoProvisioningService configuration.

## Monitoring and Logs

### Log Messages
- `🔧 Starting auto-provisioning for order [ID]`
- `✅ Auto-provisioning completed successfully`
- `❌ Auto-provisioning failed: [error]`
- `🔄 Attempting rollback for order [ID]`

### Status Tracking
- Order status automatically updated during provisioning
- Admin notes include provisioning details
- Comprehensive error reporting

## Best Practices

1. **Test Configuration**: Always use `!provision-test` after setup
2. **Monitor Resources**: Regularly check node capacity
3. **Backup Strategy**: Implement regular order data backups
4. **Customer Support**: Provide clear instructions for server usage
5. **Security**: Regularly rotate API keys and monitor access

This auto-provisioning system provides a seamless experience for both customers and administrators, reducing manual work while maintaining full control and transparency.