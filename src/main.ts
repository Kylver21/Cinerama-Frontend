// Polyfill para compatibilidad con librerías que esperan 'global' (Node.js)
// Necesario para SockJS y otras librerías de WebSocket
(window as any).global = window;

import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

