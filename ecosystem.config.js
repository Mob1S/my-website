// PM2 Ecosystem — 进程管理 & 自动重启
// Usage: pm2 start ecosystem.config.js
//        pm2 save && pm2 startup

module.exports = {
  apps: [{
    name: 'mob1s-server',
    script: 'server.js',
    instances: 1,            // 单实例（SSE 长连接不适合 cluster）
    exec_mode: 'fork',
    autorestart: true,       // 崩溃自动重启
    watch: false,            // 生产环境不 watch
    max_memory_restart: '256M',
    restart_delay: 3000,     // 重启间隔 3s，防止疯狂重启
    max_restarts: 10,        // 10 分钟内最多重启 10 次
    min_uptime: '10s',       // 运行超过 10s 才算启动成功

    env: {
      NODE_ENV: 'production',
      PORT: 3001,
    },

    // 日志
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    merge_logs: true,
  }],
};
