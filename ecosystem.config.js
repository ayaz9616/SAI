module.exports = {
  apps: [
    {
      name: 'pink-diary',
      script: 'npm',
      args: 'run start',
      env: { PORT: 3500 },
      instances: 1,
      exec_mode: 'fork'
    }
  ]
};
