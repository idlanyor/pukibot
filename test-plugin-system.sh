#!/bin/bash

# Test script to verify plugin system implementation
echo "🧪 Testing Plugin System Implementation..."

# Check if all plugin files exist
echo "📁 Checking plugin files..."
PLUGIN_FILES=(
    "src/plugins/types.ts"
    "src/plugins/BasePlugin.ts"
    "src/plugins/PluginLoader.ts"
    "src/plugins/general/GeneralPlugin.ts"
    "src/plugins/store/StorePlugin.ts"
    "src/plugins/pterodactyl/PterodactylPlugin.ts"
    "src/plugins/admin/AdminPlugin.ts"
)

for file in "${PLUGIN_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

# Test bot startup
echo ""
echo "🚀 Testing bot startup..."
timeout 5s bun src/index.ts > /tmp/bot_test.log 2>&1 &
BOT_PID=$!

# Wait a moment for initialization
sleep 3

# Check if bot started successfully
if ps -p $BOT_PID > /dev/null 2>&1; then
    echo "✅ Bot started successfully"
    kill $BOT_PID 2>/dev/null
else
    echo "❌ Bot failed to start"
fi

# Check log for plugin loading
echo ""
echo "📋 Plugin loading results:"
grep -E "(Loading all plugins|Loaded plugin|Plugin loading complete)" /tmp/bot_test.log | while read line; do
    echo "  $line"
done

# Check for any errors
echo ""
echo "⚠️ Checking for errors:"
if grep -q "error\|Error\|ERROR" /tmp/bot_test.log; then
    echo "❌ Errors found:"
    grep -i "error" /tmp/bot_test.log
else
    echo "✅ No errors found"
fi

# Clean up
rm -f /tmp/bot_test.log

echo ""
echo "🎯 Plugin system test completed!"