# Pterodactyl WhatsApp Bot - MySQL Migration

## Database Migration Update

This project has been migrated from SQLite to MySQL using Prisma ORM for better compatibility with Bun runtime.

### Key Changes

1. **Database**: SQLite → MySQL
2. **ORM**: better-sqlite3 → Prisma
3. **Type Safety**: Enhanced with Prisma's TypeScript support
4. **Performance**: Improved with MySQL's concurrent capabilities

### Quick Start

1. **Setup MySQL Database**:
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d database
   
   # Or install MySQL locally
   sudo apt install mysql-server
   ```

2. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your MySQL credentials
   ```

3. **Generate Prisma Client**:
   ```bash
   bun run db:generate
   ```

4. **Run Database Migrations**:
   ```bash
   bun run db:migrate
   ```

5. **Test MySQL Connection**:
   ```bash
   bun run test:mysql
   ```

6. **Migrate Data from SQLite** (if you have existing data):
   ```bash
   bun run migrate:mysql
   ```

7. **Start the Application**:
   ```bash
   bun run dev
   ```

### Database Schema

The MySQL database includes the following tables:

- `packages` - Package configurations with pricing and specs
- `orders` - Customer orders with status tracking
- `order_status_history` - Order status change history
- `subscriptions` - Active customer subscriptions
- `server_monitoring` - Server monitoring and health data

### Available Scripts

```bash
# Database Management
bun run db:generate     # Generate Prisma client
bun run db:migrate      # Create and apply migrations
bun run db:deploy       # Deploy migrations (production)
bun run db:studio       # Open Prisma Studio (database GUI)

# Migration and Testing
bun run migrate:mysql   # Migrate data from SQLite to MySQL
bun run test:mysql      # Test MySQL connection

# Application
bun run dev             # Start development server
bun run start           # Start production server
bun run web             # Start web interface
```

### Environment Variables

Required environment variables for MySQL:

```env
# Database Configuration
DATABASE_URL="mysql://bot_user:secure_password@localhost:3306/pterodactyl_bot"

# Bot Configuration
BOT_NAME="Pterodactyl Store Bot"
OWNER_NUMBER="your_owner_number"
STORE_ADMIN="your_admin_number"

# Pterodactyl Panel
PTERODACTYL_URL="https://panel.roidev.my.id"
PTERODACTYL_API_KEY="your_api_key"
PTERODACTYL_ADMIN_API_KEY="your_admin_api_key"
```

### Migration Benefits

1. **Better Bun Support**: MySQL works more reliably with Bun runtime
2. **Type Safety**: Prisma provides full TypeScript support
3. **Performance**: Better concurrent access and query optimization
4. **Scalability**: Easier to scale with MySQL
5. **Development Experience**: Prisma Studio for database management
6. **Production Ready**: MySQL is more suitable for production environments

### Troubleshooting

**Connection Issues**:
```bash
# Check MySQL service
sudo systemctl status mysql

# Check Docker container
docker-compose logs database

# Test connection manually
mysql -u bot_user -p pterodactyl_bot
```

**Migration Issues**:
```bash
# Reset database (CAUTION: This will delete all data)
bun prisma migrate reset

# View migration status
bun prisma migrate status
```

For detailed migration instructions, see: [MySQL Migration Guide](docs/mysql-migration-guide.md)

### Support

- **Prisma Documentation**: https://prisma.io/docs
- **MySQL Documentation**: https://dev.mysql.com/doc/
- **Bun Documentation**: https://bun.sh/docs

---

**Note**: Always backup your data before running migrations in production!