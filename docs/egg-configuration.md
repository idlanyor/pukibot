# Pterodactyl Egg Configuration Guide

## 📋 Available Eggs on Server

Based on the actual server configuration at `https://panel.roidev.my.id`, the following eggs are available:

### 🗂️ Nest: Bot WhatsApp Egg (ID: 5)
- **NodeJS VIP** (ID: 15)
  - Description: Generic Node.js egg for WhatsApp bots
  - Docker Image: `ghcr.io/shirokamiryzen/yolks:nodejs_22`
  - Startup Command: Supports Git auto-update and npm install
  - Environment Variables: MAIN_FILE, AUTO_UPDATE, GIT_ADDRESS, USERNAME, ACCESS_TOKEN

### 🗂️ Nest: VPS Egg (ID: 6)
- **VPS - Egg** (ID: 16)
  - Description: Full VPS environment with SSH access
  - Docker Image: `quay.io/ydrag0n/pterodactyl-vps-egg`
  - Startup Command: `bash /run.sh`
  - Environment Variables: VPS_USER, VPS_PASSWORD, VPS_SSH_PORT

### 🗂️ Nest: Python (ID: 7)
- **python generic** (ID: 17)
  - Description: Generic Python egg with package management
  - Docker Image: `ghcr.io/parkervcp/yolks:python_3.12`
  - Startup Command: Supports Git auto-update and pip install
  - Environment Variables: PY_FILE, AUTO_UPDATE, PY_PACKAGES, REQUIREMENTS_FILE

## 🎯 Package-Specific Egg Assignments

The system has been configured to use the following egg assignments:

### 📦 Package Types and Their Eggs

| Package  | Egg Used        | Egg ID | Purpose                    |
|----------|----------------|--------|----------------------------|
| Bronze   | NodeJS VIP     | 15     | Small Node.js projects     |
| Silver   | VPS Egg        | 16     | VPS hosting               |
| Gold     | Python Generic | 17     | Python applications       |
| Platinum | NodeJS VIP     | 15     | Premium Node.js projects  |
| Diamond  | VPS Egg        | 16     | Premium VPS hosting       |

## ⚙️ Environment Configuration

Add these variables to your `.env` file:

```bash
# Pterodactyl Panel Configuration
PTERODACTYL_URL=https://panel.roidev.my.id
PTERODACTYL_ADMIN_API_KEY=ptla_suW1wqLztnQUv7IRUnr9B395MQ7YFTcTmeHI4ThqiXv

# Egg Configuration
BRONZE_EGG_ID=15        # NodeJS VIP
SILVER_EGG_ID=16        # VPS Egg
GOLD_EGG_ID=17          # Python Generic
PLATINUM_EGG_ID=15      # NodeJS VIP
DIAMOND_EGG_ID=16       # VPS Egg

# Docker Images (automatically set by eggs)
BRONZE_DOCKER_IMAGE=ghcr.io/shirokamiryzen/yolks:nodejs_22
SILVER_DOCKER_IMAGE=quay.io/ydrag0n/pterodactyl-vps-egg
GOLD_DOCKER_IMAGE=ghcr.io/parkervcp/yolks:python_3.12
PLATINUM_DOCKER_IMAGE=ghcr.io/shirokamiryzen/yolks:nodejs_22
DIAMOND_DOCKER_IMAGE=quay.io/ydrag0n/pterodactyl-vps-egg
```

## 🚀 Usage Examples

### Node.js Applications (Bronze/Platinum)
- **Environment Variables:**
  - `MAIN_FILE`: Entry point file (default: `index.js`)
  - `AUTO_UPDATE`: Enable Git auto-update (default: `0`)
  - `GIT_ADDRESS`: Git repository URL
  - `USERNAME`: Git username
  - `ACCESS_TOKEN`: Git access token

### VPS Hosting (Silver/Diamond)
- **Environment Variables:**
  - `VPS_USER`: SSH username (default: `root`)
  - `VPS_PASSWORD`: SSH password (default: `changeme123`)
  - `VPS_SSH_PORT`: SSH port (default: `22`)

### Python Applications (Gold)
- **Environment Variables:**
  - `PY_FILE`: Python entry point (default: `main.py`)
  - `AUTO_UPDATE`: Enable Git auto-update (default: `0`)
  - `PY_PACKAGES`: Additional pip packages
  - `REQUIREMENTS_FILE`: Requirements file (default: `requirements.txt`)

## 🔧 Testing Configuration

Use the following command to test your egg configuration:

```bash
bun run test-egg-configuration.ts
```

This will verify:
- ✅ All eggs are properly assigned
- ✅ Docker images are correct
- ✅ Environment variables are set
- ✅ Resource limits are configured
- ✅ Auto-provisioning service is healthy

## 📝 Notes

1. **Egg IDs are fixed** - These correspond to the actual eggs configured on your Pterodactyl panel
2. **Docker images are automatically set** by the eggs but can be overridden via environment variables
3. **Environment variables** are specific to each egg type and determine how the server behaves
4. **Resource limits** (memory, disk, CPU) are defined per package type in the AutoProvisioningService
5. **All configurations are validated** during auto-provisioning to ensure compatibility

## 🎯 Customization

To customize the configuration:

1. **Change egg assignments**: Modify the `*_EGG_ID` environment variables
2. **Override Docker images**: Set `*_DOCKER_IMAGE` environment variables
3. **Adjust startup commands**: Set `*_STARTUP` environment variables
4. **Modify resources**: Update the AutoProvisioningService resource mappings

The system is designed to be flexible while maintaining compatibility with your specific Pterodactyl setup.