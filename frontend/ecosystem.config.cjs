module.exports = {
  apps: [{
    name: 'frontend-dev',
    script: 'npx',
    args: 'vite --port 8080 --host 0.0.0.0',
    env: {
      NODE_ENV: 'development',
      PORT: 8080
    }
  }]
}
