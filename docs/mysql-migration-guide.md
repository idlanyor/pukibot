# Database Migration Guide: SQLite to MySQL with Prisma ORM

## Overview

This guide explains how to migrate from SQLite (better-sqlite3) to MySQL using Prisma ORM for better compatibility with Bun runtime.

## Why Migrate to MySQL?

1. **Bun Compatibility**: SQLite support in Bun is still limited
2. **Better Performance**: MySQL offers better performance for concurrent operations
3. **Scalability**: Easier to scale with MySQL
4. **Production Ready**: MySQL is more suitable for production environments
5. **Modern ORM**: Prisma provides type-safe database access

## Prerequisites

- Bun runtime installed
- MySQL server (local or Docker)
- Existing SQLite database with data

## Migration Steps

### 1. Install Dependencies

```bash
bun add prisma @prisma/client mysql2
bun add -d prisma
```

### 2. Setup MySQL Database

#### Option A: Using Docker Compose (Recommended)

```bash
# Start MySQL container
docker-compose up -d database

# Verify MySQL is running
docker-compose ps
```

#### Option B: Local MySQL Installation

```bash
# Install MySQL (Ubuntu/Debian)
sudo apt update
sudo apt install mysql-server

# Create database
mysql -u root -p
CREATE DATABASE pterodactyl_bot;
CREATE USER 'bot_user'@'localhost' IDENTIFIED BY 'secure_password';
GRANT ALL PRIVILEGES ON pterodactyl_bot.* TO 'bot_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Configure Environment Variables

Create or update your `.env` file:

```env
# Database Configuration
DATABASE_URL="mysql://bot_user:secure_password@localhost:3306/pterodactyl_bot"

# Other configurations...
```

### 4. Generate Prisma Client

```bash
bun run db:generate
```

### 5. Create Initial Migration

```bash
bun run db:migrate
```

This will:
- Create the database schema in MySQL
- Generate migration files
- Apply the schema to your database

### 6. Test MySQL Connection

```bash
bun test-mysql-connection.ts
```

### 7. Migrate Data from SQLite

```bash
bun run migrate:mysql
```

This script will:
- Read data from your existing SQLite database
- Migrate all records to MySQL
- Verify the migration was successful

### 8. Update Application Code

The migration includes new service classes:

- `PrismaDatabaseManager` - Replaces `DatabaseManager`
- `PrismaPackageService` - Replaces `PackageService`
- `PrismaOrderService` - Replaces `OrderService`
- `PrismaDatabaseInitializer` - Replaces `DatabaseInitializer`

## Database Schema

The Prisma schema includes all tables from the SQLite version:

- `packages` - Package configurations
- `orders` - Customer orders
- `order_status_history` - Order status tracking
- `subscriptions` - Active subscriptions
- `server_monitoring` - Server monitoring data

## Available Scripts

```bash
# Generate Prisma client
bun run db:generate

# Create and apply migrations
bun run db:migrate

# Deploy migrations (production)
bun run db:deploy

# Open Prisma Studio (database GUI)
bun run db:studio

# Run data migration from SQLite
bun run migrate:mysql

# Test MySQL connection
bun test-mysql-connection.ts
```

## Verification

After migration, verify:

1. **Data Integrity**: All records migrated correctly
2. **Application Functions**: All features work with MySQL
3. **Performance**: Check query performance
4. **Backups**: Setup MySQL backup strategy

## Troubleshooting

### Connection Issues

```bash
# Check MySQL service
sudo systemctl status mysql

# Check Docker container
docker-compose logs database

# Test connection manually
mysql -u bot_user -p pterodactyl_bot
```

### Migration Issues

```bash
# Reset database (CAUTION: This will delete all data)
bun prisma migrate reset

# View migration status
bun prisma migrate status

# Apply pending migrations
bun prisma migrate deploy
```

### Performance Issues

```bash
# Analyze slow queries
bun prisma studio

# Check database stats
bun test-mysql-connection.ts
```

## Production Deployment

### 1. Environment Setup

```env
# Production database URL
DATABASE_URL="mysql://username:password@host:port/database"
NODE_ENV="production"
```

### 2. Deploy Migrations

```bash
# Deploy migrations without prompts
bun run db:deploy
```

### 3. Backup Strategy

```bash
# Create database backup
mysqldump -u username -p pterodactyl_bot > backup.sql

# Restore from backup
mysql -u username -p pterodactyl_bot < backup.sql
```

## Benefits After Migration

1. **Type Safety**: Prisma provides full TypeScript support
2. **Auto-completion**: IDE support for database queries
3. **Migration Management**: Version-controlled schema changes
4. **Query Optimization**: Prisma optimizes queries automatically
5. **Database Introspection**: Easy schema visualization
6. **Multi-database Support**: Easy to switch between databases

## Rollback Plan

If you need to rollback to SQLite:

1. Keep your original SQLite database file
2. Restore the old service classes
3. Update environment variables
4. Restart the application

## Support

For issues or questions:

1. Check Prisma documentation: https://prisma.io/docs
2. Review MySQL documentation
3. Check application logs
4. Verify environment configuration

---

**Note**: Always backup your data before running migrations in production!