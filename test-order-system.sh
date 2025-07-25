#!/bin/bash

# Test script for Order Management System
echo "🧪 Testing Order Management System Implementation..."

# Check if required directories exist
if [ ! -d "src/plugins/store" ]; then
    echo "❌ Store plugin directory not found"
    exit 1
fi

if [ ! -d "src/plugins/admin" ]; then
    echo "❌ Admin plugin directory not found"
    exit 1
fi

# Check if key files exist
files_to_check=(
    "src/plugins/store/models/Order.ts"
    "src/plugins/store/OrderStorage.ts"
    "src/plugins/store/OrderManager.ts"
    "src/plugins/store/NotificationService.ts"
    "src/plugins/store/StorePlugin.ts"
    "src/plugins/admin/AdminPlugin.ts"
)

for file in "${files_to_check[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        exit 1
    else
        echo "✅ Found: $file"
    fi
done

# Test compilation
echo "🔧 Testing compilation..."

# Test StorePlugin compilation
echo "📦 Testing StorePlugin compilation..."
if bun build src/plugins/store/StorePlugin.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    echo "✅ StorePlugin compiles successfully"
else
    echo "❌ StorePlugin compilation failed"
    exit 1
fi

# Test AdminPlugin compilation
echo "👨‍💼 Testing AdminPlugin compilation..."
if bun build src/plugins/admin/AdminPlugin.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    echo "✅ AdminPlugin compiles successfully"
else
    echo "❌ AdminPlugin compilation failed"
    exit 1
fi

# Test OrderManager compilation
echo "🛒 Testing OrderManager compilation..."
if bun build src/plugins/store/OrderManager.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    echo "✅ OrderManager compiles successfully"
else
    echo "❌ OrderManager compilation failed"
    exit 1
fi

# Test OrderStorage compilation
echo "💾 Testing OrderStorage compilation..."
if bun build src/plugins/store/OrderStorage.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    echo "✅ OrderStorage compiles successfully"
else
    echo "❌ OrderStorage compilation failed"
    exit 1
fi

# Test NotificationService compilation
echo "📢 Testing NotificationService compilation..."
if bun build src/plugins/store/NotificationService.ts --outdir dist/test --target bun > /dev/null 2>&1; then
    echo "✅ NotificationService compiles successfully"
else
    echo "❌ NotificationService compilation failed"
    exit 1
fi

# Create data directory for order storage
echo "📁 Creating data directory..."
mkdir -p data
echo "✅ Data directory created"

# Clean up test build files
echo "🧹 Cleaning up test files..."
rm -rf dist/test
echo "✅ Test files cleaned up"

echo ""
echo "🎉 All tests passed! Order Management System is ready to use."
echo ""
echo "📋 Available Customer Commands:"
echo "  .katalog - View product catalog"
echo "  .harga [package] - Check package pricing"
echo "  .order [package] [duration] - Create new order"
echo "  .order-status [order-id] - Check order status"
echo "  .my-orders - View my orders"
echo ""
echo "👨‍💼 Available Admin Commands:"
echo "  .orders [status] [limit] - View all orders"
echo "  .order-detail [order-id] - View order details"
echo "  .order-confirm [order-id] [notes] - Confirm order"
echo "  .order-process [order-id] [notes] - Set order to processing"
echo "  .order-complete [order-id] [server-id] [notes] - Complete order"
echo "  .order-cancel [order-id] [reason] - Cancel order"
echo "  .order-stats - View order statistics"
echo "  .order-search [query] - Search orders"
echo "  .pending-orders - View pending orders"
echo ""
echo "🚀 To start the bot: bun start"