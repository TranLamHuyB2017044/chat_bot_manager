module.exports = {
  apps: [
    {
      name: "chatbot-manager",
      script: "server.cjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 2009,
      },
    },
  ],
};
