import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';

import { REGION } from './health.js';

// Va primero en index.ts. Las funciones toman la región de las opciones globales al definirse, y los
// módulos que las definen se evalúan antes que el cuerpo de index.ts: si setGlobalOptions estuviera
// ahí, las invocables quedarían en us-central1.
initializeApp();
setGlobalOptions({ region: REGION });
