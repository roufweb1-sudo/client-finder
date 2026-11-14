// PM2 process config for the VPS: keeps Client Finder running and restarts it after crashes/reboots
module.exports = {
  apps: [
    {
      name: "client-finder",
      cwd: __dirname,
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3100 -H 127.0.0.1",
      env: { NODE_ENV: "production" },
      max_memory_restart: "800M",
      time: true,
    },
  ],
};
