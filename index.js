const Koa = require('koa');
const https = require('https');
const httpProxy = require('http-proxy');
const { default: enforceHttps } = require('koa-sslify');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const app = new Koa();

let options = {
  key: fs.readFileSync(path.join(__dirname, './ssl/private.pem')),
  cert: fs.readFileSync(path.join(__dirname, './ssl/public.pem'))
};

// Create a proxy instance
const proxy = httpProxy.createProxyServer();

// Middleware for proxying requests
app.use(async (ctx, next) => {
  // Récupérer le sous-domaine de la requête
  const subdomain = ctx.hostname.split('.')[0];

  // Rediriger les requêtes en fonction du sous-domaine
  if (subdomain === 'organim') {
    console.log(process.env.REDIRECTION_ORGANIMPROD);
    // Rediriger les requêtes vers le serveur x sur le port spécifié
    await new Promise((resolve, reject) => {
      proxy.web(ctx.req, ctx.res, {
        target: process.env.REDIRECTION_ORGANIMPROD
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } else if (subdomain === 'organimDev') {
    // Rediriger les requêtes vers le serveur y sur le port spécifié
    await new Promise((resolve, reject) => {
      proxy.web(ctx.req, ctx.res, {
        target: process.env.REDIRECTION_ORGANIMDEV
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } else if (subdomain === 'masterofcandy') {
    // Rediriger les requêtes vers le serveur y sur le port spécifié
    await new Promise((resolve, reject) => {
      proxy.web(ctx.req, ctx.res, {
        target: process.env.REDIRECTION_MASTEROFCANDYDEV
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } else {
    // Rediriger les requêtes vers le serveur y sur le port spécifié
    await new Promise((resolve, reject) => {
      proxy.web(ctx.req, ctx.res, {
        target: process.env.REDIRECTION_ORGANIMPROD
      }, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
  // Ajoutez plus de conditions pour d'autres sous-domaines si nécessaire

  // Si aucun sous-domaine correspondant n'est trouvé, passez au middleware suivant
  await next();
});

// Create HTTPS server
const PORT = process.env.PORT || 49155;

app.use(enforceHttps({
  port: PORT
}));

const serveur = https.createServer(options, app.callback());
serveur.listen(PORT, () => {
  console.log(`Serveur Koa démarré sur le port ${PORT}`);
});
