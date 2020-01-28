module.exports = {
  apps: [{
    name: 'grph-server',
    script: 'test.js',
    node_args: '-r dotenv/config',
    error_file: process.env.NODE_ENV === 'production' ? 'grph.log' : null,
    autorestart: process.env.NODE_ENV === 'production',
  }]
};
