import './setup.js';

import { onRequest } from 'firebase-functions/v2/https';

import { getHealth } from './health.js';

export { checkPhoto, suggestSpecies } from './ai.js';
export { onSightingCreated } from './sightings.js';
export { onTradeAcceptanceCreated } from './trades.js';
export { onRegionCreated } from './regions.js';
export { onUserDeleted } from './accounts.js';

export const health = onRequest((_request, response) => {
  response.json(getHealth());
});
