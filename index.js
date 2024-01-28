/*--------------------------------------------------------------------
 *                         INITIALISATION
 *--------------------------------------------------------------------
**/
const Koa = require('koa');
const https = require('https');
const { default: enforceHttps } = require('koa-sslify');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();
const { createProxyMiddleware } = require('http-proxy-middleware');


/*--------------------------------------------------------------------
 *                       CREATION SERVEUR
 *--------------------------------------------------------------------
**/
// init
const app = new Koa();


let options = {
  key: fs.readFileSync(path.join(__dirname, './ssl/private.pem')),
  cert: fs.readFileSync(path.join(__dirname, './ssl/public.pem'))
}

// Middleware for parsing request body
app.use(async (ctx, next) => {
  // Récupérer le sous-domaine de la requête
  const subdomain = ctx.hostname.split('.')[0];

  // Rediriger les requêtes en fonction du sous-domaine
  if (subdomain === 'organim') {
    // Rediriger les requêtes vers le serveur x sur le port spécifié
    return createProxyMiddleware({
      target: `${process.env.REDIRECTION_ORGANIMPROD}`,
      changeOrigin: false,
    })(ctx, next);
  } else if (subdomain === 'organimDev') {
    // Rediriger les requêtes vers le serveur y sur le port spécifié
    return createProxyMiddleware({
      target: `${process.env.REDIRECTION_ORGANIMDEV}`,
      changeOrigin: false,
    })(ctx, next);
  } else {
    // Rediriger les requêtes vers le serveur y sur le port spécifié
    return createProxyMiddleware({
      target: `${process.env.REDIRECTION_ORGANIMPROD}`,
      changeOrigin: false,
    })(ctx, next);
  }
  // Ajoutez plus de conditions pour d'autres sous-domaines si nécessaire

  // Si aucun sous-domaine correspondant n'est trouvé, passez au middleware suivant
  await next();
});

/*----------------------------------------------------
 *               Configuration Serveur
 *----------------------------------------------------
**/
// Démarrez le serveur sur le port process.env.PORT || 443;
const PORT = process.env.PORT || 49152;

app.use(enforceHttps({
  port: PORT
}));

const serveur = https.createServer(options, app.callback());
serveur.listen(PORT, () => {
  console.log(`Serveur Koa démarré sur le port ${PORT}`);
});