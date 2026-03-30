import { buildServer } from './server.js';
import { appConfig } from './config.js';

const app = buildServer();

app
  .listen({
    port: appConfig.KITABU_PORT,
    host: appConfig.KITABU_HOST
  })
  .catch(error => {
    app.log.error(error);
    process.exit(1);
  });
