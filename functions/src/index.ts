import { setGlobalOptions } from 'firebase-functions/v2';
import { onRequest } from 'firebase-functions/v2/https';

import { getHealth, REGION } from './health.js';

setGlobalOptions({ region: REGION });

export const health = onRequest((_request, response) => {
  response.json(getHealth());
});
