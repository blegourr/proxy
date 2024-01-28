module.exports = {
  apps : [{
      name   : "proxy-production",
      script: './index.js',
      watch: '.',
      env_production: {
          "PORT": 443
      }
  }],

  deploy : {
      production : {
          user : 'blegourr',
          host : '192.168.1.1',
          key  : './gitub_action_key',
          ref  : 'origin/master',
          repo : 'git@github.com:blegourr/proxy.git',
          path : '/',
          'post-setup': 'npm install',
          'post-deploy' : 'pm2 reload ecosystem.production.config.js --env production',
      }
  }
};