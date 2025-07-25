module.exports = {
  apps: [{
    name: 'pterodactyl-whatsapp-bot',
    script: 'bun',
    args: 'run src/index.ts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 4000,
    env: {
      NODE_ENV: 'production',
      LOG_LEVEL: 'info'
    },
    env_development: {
      NODE_ENV: 'development',
      LOG_LEVEL: 'debug'
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};