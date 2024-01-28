/*--------------------------------------------------------------------
 *                         INITIALISATION
 *--------------------------------------------------------------------
**/
const Koa = require('koa');
const Router = require('koa-router');
const https = require('https');
const { default: enforceHttps } = require('koa-sslify');
const path = require('path');
const fs = require('fs');
const httpProxy = require('http-proxy');
const dotenv = require('dotenv');
dotenv.config();

/*--------------------------------------------------------------------
 *                       CREATION SERVEUR
 *--------------------------------------------------------------------
**/
// init
const app = new Koa();
const routes = new Router();

// Create a proxy instance
const proxy = httpProxy.createProxyServer();

let options = {
  key: fs.readFileSync(path.join(__dirname, './ssl/private.pem')),
  cert: fs.readFileSync(path.join(__dirname, './ssl/public.pem'))
}

console.log(path.join(__dirname, './ssl/private.pem'));

/*--------------------------------------------------------------------
 *                         ROUTE OPTIONS
 *--------------------------------------------------------------------
**/
// gère les pré-vérifications OPTIONS
routes.options('(.*)', async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Origin');
  ctx.status = 200;
  return next();
});

routes.all('(.*)', async (ctx, next) => {
  console.log("oki")
  // Extract the subdomain from the request
  const subdomain = ctx.request.hostname.split('.')[0];

  // Define the target server based on the subdomain
  let target;
  if (subdomain === 'organimprod') {
    target = process.env.REDIRECTION_ORGANIMPROD;
  } else {
    target = process.env.REDIRECTION_DEV;
  }

  // Proxy the request to the target server
  await new Promise((resolve, reject) => {
    proxy.web(ctx.req, ctx.res, { target }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });

  await next();
});

// Error handling for the proxy
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.writeHead(500, {
    'Content-Type': 'text/plain',
  });
  res.end('Proxy error');
});

/*----------------------------------------------------
 *               Configuration Serveur
 *----------------------------------------------------
**/
// Utilisation du routeur Koa
app.use(routes.routes());
app.use(routes.allowedMethods());

// Démarrez le serveur sur le port process.env.PORT || 443;
const PORT = process.env.PORT || 443;

app.use(enforceHttps({
  port: PORT
}));

const serveur = https.createServer(options, app.callback());
serveur.listen(PORT, () => {
  console.log(`Serveur Koa démarré sur le port ${PORT}`);
});