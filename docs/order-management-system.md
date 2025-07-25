# Order Management System Documentation

## Overview
The Order Management System provides comprehensive order lifecycle management for the Pterodactyl WhatsApp Bot. This system allows customers to create orders and admins to manage them through the entire lifecycle from creation to completion.

## Architecture

### Core Components

#### 1. Order Models (`src/plugins/store/models/Order.ts`)
- **OrderStatus**: Enum defining order states (pending, confirmed, processing, completed, cancelled, refunded)
- **PackageType**: Enum defining available server packages (bronze, silver, gold, platinum, diamond)
- **Order**: Main order interface with customer info, package details, status, and history
- **PACKAGE_CATALOG**: Configuration for available packages with pricing and specifications
- **ORDER_STATUS_FLOW**: Defines valid status transitions

#### 2. Order Storage (`src/plugins/store/OrderStorage.ts`)
- **Singleton Pattern**: Ensures single instance across the application
- **File-based Persistence**: Orders stored in JSON format in `/data/orders.json`
- **CRUD Operations**: Create, read, update, delete orders with validation
- **Search & Filter**: Advanced filtering by status, package, customer, date range
- **Backup System**: Automatic backup creation with timestamps

#### 3. Order Manager (`src/plugins/store/OrderManager.ts`)
- **Business Logic**: Handles order creation, validation, and status transitions
- **Order Lifecycle**: Manages complete order workflow with status validation
- **Formatting**: Provides display formatting for orders and summaries
- **Statistics**: Calculates order metrics and business insights

#### 4. Notification Service (`src/plugins/store/NotificationService.ts`)
- **Customer Notifications**: Automated notifications for order status changes
- **Admin Notifications**: Alerts for new orders and important status changes
- **Bulk Notifications**: Support for sending messages to multiple customers
- **Message Templates**: Customizable notification templates

### Enhanced Plugins

#### 1. Store Plugin (`src/plugins/store/StorePlugin.ts`)
Enhanced with persistent order management:
- **!katalog**: View product catalog with new order commands
- **!harga [package]**: Check package pricing with order integration
- **!order [package] [duration]**: Create new order with validation and persistence
- **!order-status [order-id]**: Check order status with security validation
- **!my-orders**: View customer's order history

#### 2. Admin Plugin (`src/plugins/admin/AdminPlugin.ts`)
Comprehensive admin order management:
- **!orders [status] [limit]**: View all orders with filtering
- **!order-detail [order-id]**: View detailed order information with history
- **!order-confirm [order-id] [notes]**: Confirm pending orders
- **!order-process [order-id] [notes]**: Set orders to processing status
- **!order-complete [order-id] [server-id] [notes]**: Complete orders
- **!order-cancel [order-id] [reason]**: Cancel orders with reason
- **!order-stats**: View comprehensive order statistics
- **!order-search [query]**: Search orders by phone, package, or status
- **!pending-orders**: Quick view of pending orders

## Order Lifecycle

### 1. Order Creation
```
Customer: !order bronze 1
System: Creates order with PENDING status
System: Generates unique order ID (ORD-XXXXX-XXXXX)
System: Notifies customer and admin
```

### 2. Order Confirmation
```
Admin: !order-confirm ORD-XXXXX-XXXXX Payment received
System: Updates status to CONFIRMED
System: Notifies customer about confirmation
```

### 3. Order Processing
```
Admin: !order-process ORD-XXXXX-XXXXX Setting up server
System: Updates status to PROCESSING
System: Notifies customer about processing
```

### 4. Order Completion
```
Admin: !order-complete ORD-XXXXX-XXXXX SERVER123 Server ready
System: Updates status to COMPLETED
System: Sets server ID
System: Notifies customer with completion details
```

### Status Transitions
- **PENDING** → CONFIRMED, CANCELLED
- **CONFIRMED** → PROCESSING, CANCELLED
- **PROCESSING** → COMPLETED, CANCELLED
- **COMPLETED** → REFUNDED
- **CANCELLED** → (final state)
- **REFUNDED** → (final state)

## Data Storage

### Order Storage Structure
```json
{
  "id": "ORD-XXXXX-XXXXX",
  "customer": {
    "phoneNumber": "628123456789@s.whatsapp.net",
    "displayName": "Customer Name",
    "chatId": "628123456789@s.whatsapp.net"
  },
  "item": {
    "packageType": "bronze",
    "duration": 1,
    "price": 25000,
    "specifications": {
      "ram": "1GB",
      "cpu": "1 CPU",
      "storage": "Unlimited SSD",
      "bandwidth": "Unlimited"
    }
  },
  "status": "pending",
  "totalAmount": 25000,
  "currency": "IDR",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "2025-01-01T00:00:00.000Z",
      "updatedBy": "system",
      "notes": "Order created"
    }
  ],
  "notes": "Customer notes",
  "adminNotes": "Admin notes",
  "serverId": "SERVER123"
}
```

### File Locations
- **Orders**: `/data/orders.json`
- **Backups**: `/data/orders-backup-YYYY-MM-DDTHH-MM-SS.json`

## Security Features

### Admin Authentication
- Phone number validation against `OWNER_NUMBER` and `STORE_ADMIN` environment variables
- All admin commands require authentication
- Audit trail for all admin actions

### Customer Privacy
- Customers can only view their own orders
- Order ID validation prevents unauthorized access
- Phone number masking in admin views

### Data Validation
- Package type validation against available packages
- Duration limits (1-12 months)
- Status transition validation
- Input sanitization for all user inputs

## Statistics & Reporting

### Order Statistics
- Total orders count
- Revenue calculations (completed orders only)
- Average order value
- Orders by status breakdown
- Orders by package type breakdown
- Daily and monthly order counts

### Business Metrics
- Conversion rates by status
- Popular package analysis
- Customer order frequency
- Revenue trends

## Error Handling

### Common Error Scenarios
1. **Invalid Package Type**: Clear error message with available options
2. **Invalid Duration**: Validation with acceptable range
3. **Order Not Found**: Proper error handling with suggestions
4. **Invalid Status Transition**: Business logic validation
5. **Storage Errors**: Graceful degradation with retry mechanisms

### Logging
- All operations logged with appropriate levels
- Error tracking with context information
- Performance monitoring for storage operations

## Performance Considerations

### Optimization Features
- In-memory caching for frequently accessed orders
- Pagination for large order lists
- Efficient search algorithms
- Batch operations for bulk updates

### Scalability
- File-based storage suitable for small to medium scale
- Easy migration path to database systems
- Horizontal scaling considerations

## Backup & Recovery

### Automatic Backups
- Triggered on significant operations
- Timestamped backup files
- Configurable retention policies

### Recovery Procedures
- Manual backup restoration
- Data validation after recovery
- Integrity checks

## Configuration

### Environment Variables
- `STORE_NAME`: Store name for catalog display
- `STORE_CURRENCY`: Currency symbol (default: IDR)
- `STORE_ADMIN`: Admin phone number for notifications
- `OWNER_NUMBER`: Owner phone number for admin access

### Package Configuration
Packages can be modified in `PACKAGE_CATALOG` constant:
```typescript
[PackageType.BRONZE]: {
    type: PackageType.BRONZE,
    name: 'BRONZE',
    ram: '1GB',
    cpu: '1 CPU',
    price: 25000,
    storage: 'Unlimited SSD',
    bandwidth: 'Unlimited',
    emoji: '🟢'
}
```

## Future Enhancements

### Planned Features
1. **Database Integration**: Migration to PostgreSQL/MySQL
2. **Payment Integration**: Automated payment processing
3. **Customer Portal**: Web interface for order management
4. **Advanced Analytics**: Detailed business intelligence
5. **Multi-language Support**: Internationalization
6. **API Integration**: REST API for external systems

### Technical Improvements
1. **Real-time Updates**: WebSocket notifications
2. **Caching Layer**: Redis integration
3. **Queue System**: Background job processing
4. **Monitoring**: Health checks and metrics
5. **Testing**: Comprehensive test suite

## Troubleshooting

### Common Issues
1. **Orders Not Saving**: Check file permissions on `/data` directory
2. **Admin Commands Not Working**: Verify phone number in environment variables
3. **Notifications Not Sent**: Check WhatsApp connection and admin phone number
4. **Performance Issues**: Monitor file size and consider database migration

### Debug Commands
```bash
# Check order storage file
cat data/orders.json | jq .

# Test compilation
bun build src/plugins/store/StorePlugin.ts --outdir dist/test

# Run test script
./test-order-system.sh
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in the console
3. Verify environment configuration
4. Test with the provided test script

This comprehensive order management system provides a solid foundation for managing Pterodactyl server orders through WhatsApp, with room for future enhancements and scaling.