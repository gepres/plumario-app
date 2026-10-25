import { expect, it } from 'vitest';

import { getHealth } from '../src/health.js';

it('identifica el servicio y la región sin depender de Firebase', () => {
  expect(getHealth()).toEqual({
    ok: true,
    service: 'plumario',
    region: 'southamerica-west1',
  });
});
