module.exports = {
  apps: [{
    name: 'frontend-dev',
    script: 'npm',
    args: 'run dev',
    env: {
      NODE_ENV: 'development',
      PORT: 3000
    }
  }]
}
