import { initializeApp } from 'firebase-admin/app';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

import { getHealth, REGION } from './health.js';

initializeApp();
setGlobalOptions({ region: REGION });

export { onSightingCreated } from './sightings.js';

export const health = onRequest((_request, response) => {
  response.json(getHealth());
});
