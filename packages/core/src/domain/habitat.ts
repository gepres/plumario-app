/** Hábitats del álbum, en el orden del diseño: Litoral, Humedales, Desierto, Sierra, Mar abierto. */
export const HABITATS = ['coast', 'wetlands', 'desert', 'highlands', 'openSea'] as const;

export type Habitat = (typeof HABITATS)[number];
