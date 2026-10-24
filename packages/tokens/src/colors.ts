// GENERADO por scripts/generate.mjs desde design/palettes/palettes.json — no editar a mano.
// Paleta F · Ribera: garza blanca, totora y junco.
// Para cambiar un color, cámbialo en el diseño y corre `pnpm tokens` desde la raíz.

export const palette = {"option":"F","name":"Ribera","motto":"garza blanca, totora y junco"} as const;

/** Clave del diseño (palettes.json, artboards) → clave en el código. */
export const designKeyMap = {
  "bg": "background",
  "sup": "surface",
  "sup2": "surfaceAlt",
  "ink": "text",
  "txt2": "textSecondary",
  "linea": "line",
  "borde": "border",
  "pri": "primary",
  "priInk": "onPrimary",
  "acento": "accent",
  "acentoInk": "onAccent",
  "sol": "sun",
  "solInk": "onSun",
  "hero": "hero",
  "heroInk": "onHero",
  "heroTxt2": "onHeroSecondary",
  "heroPista": "heroTrack",
  "heroChip": "heroChip",
  "exito": "success",
  "aviso": "warning",
  "error": "error",
  "revelar": "reveal",
  "revelarTxt2": "onRevealSecondary",
  "campo": "field",
  "barra": "tabBar",
  "navInactivo": "tabInactive",
  "navTrazo": "tabActiveStroke",
  "navRelleno": "tabActiveFill",
  "fab": "fab",
  "fabTinta": "onFab",
  "oscuro": "isDark",
  "hab": "habitats",
  "pista": "track",
  "sombra": "cardShadow",
  "logoTarjeta": "logoCard",
  "logoDoblez": "logoFold",
  "logoTrazo": "logoStroke",
  "logoSello": "logoSeal",
  "logoEstrella": "logoStar",
  "logoIcono": "logoTile"
} as const;

export const colors = {
  "light": {
    "background": "#FFFFFF",
    "surface": "#F5F8F0",
    "surfaceAlt": "#E7EEDC",
    "text": "#1E2A1B",
    "textSecondary": "#566249",
    "line": "#E0E7D4",
    "border": "#7D8A6B",
    "primary": "#3E6A2B",
    "onPrimary": "#FFFFFF",
    "accent": "#2E6B5C",
    "onAccent": "#FFFFFF",
    "sun": "#E3C45E",
    "onSun": "#2D2E16",
    "hero": {
      "type": "linear",
      "angle": 135,
      "stops": [
        {
          "color": "#44682E",
          "position": 0
        },
        {
          "color": "#2B5A4B",
          "position": 1
        }
      ],
      "css": "linear-gradient(135deg, #44682E 0%, #2B5A4B 100%)"
    },
    "onHero": "#FFFFFF",
    "onHeroSecondary": "#E0EED0",
    "heroTrack": "rgba(255,255,255,0.24)",
    "heroChip": "rgba(255,255,255,0.16)",
    "success": "#2F6E41",
    "warning": "#7E5C12",
    "error": "#B03A30",
    "reveal": {
      "type": "radial",
      "center": {
        "x": 0.5,
        "y": 0.34
      },
      "stops": [
        {
          "color": "#375A3B",
          "position": 0
        },
        {
          "color": "#13271D",
          "position": 0.64
        }
      ],
      "css": "radial-gradient(circle at 50% 34%, #375A3B 0%, #13271D 64%)"
    },
    "onRevealSecondary": "#DCEBD3",
    "field": "#FFFFFF",
    "tabBar": "#FFFFFF",
    "tabInactive": "#68745B",
    "tabActiveStroke": "#345A24",
    "tabActiveFill": "#E3C45E",
    "fab": {
      "type": "linear",
      "angle": 150,
      "stops": [
        {
          "color": "#4F7A31",
          "position": 0
        },
        {
          "color": "#3E6A2B",
          "position": 0.55
        },
        {
          "color": "#2B5A4B",
          "position": 1
        }
      ],
      "css": "linear-gradient(150deg, #4F7A31 0%, #3E6A2B 55%, #2B5A4B 100%)"
    },
    "onFab": "#FFFFFF",
    "isDark": false,
    "habitats": {
      "coast": "#3D858D",
      "wetlands": "#678C3D",
      "desert": "#B89042",
      "highlands": "#857599",
      "openSea": "#3F6880"
    },
    "track": "#E0E7D4",
    "cardShadow": "0 1px 2px rgba(30,42,27,0.06)",
    "logoCard": "#FBFBF2",
    "logoFold": "#D3D1AC",
    "logoStroke": "#2F5124",
    "logoSeal": "#E3C45E",
    "logoStar": "#2D2E16",
    "logoTile": "#3E6A2B"
  },
  "dark": {
    "background": "#101311",
    "surface": "#191D1A",
    "surfaceAlt": "#242A25",
    "text": "#F1F5EB",
    "textSecondary": "#AAB4A5",
    "line": "#2D342E",
    "border": "#7A8775",
    "primary": "#A3D27A",
    "onPrimary": "#11200F",
    "accent": "#7FC9BA",
    "onAccent": "#0E221D",
    "sun": "#E9CD6F",
    "onSun": "#26240F",
    "hero": {
      "type": "linear",
      "angle": 135,
      "stops": [
        {
          "color": "#25452F",
          "position": 0
        },
        {
          "color": "#173538",
          "position": 1
        }
      ],
      "css": "linear-gradient(135deg, #25452F 0%, #173538 100%)"
    },
    "onHero": "#F6FBEF",
    "onHeroSecondary": "#CDE2C4",
    "heroTrack": "rgba(255,255,255,0.18)",
    "heroChip": "rgba(255,255,255,0.12)",
    "success": "#8FD19E",
    "warning": "#E9C46B",
    "error": "#F4A091",
    "reveal": {
      "type": "radial",
      "center": {
        "x": 0.5,
        "y": 0.34
      },
      "stops": [
        {
          "color": "#25402E",
          "position": 0
        },
        {
          "color": "#070C09",
          "position": 0.64
        }
      ],
      "css": "radial-gradient(circle at 50% 34%, #25402E 0%, #070C09 64%)"
    },
    "onRevealSecondary": "#D2E6CB",
    "field": "#141815",
    "tabBar": "#191D1A",
    "tabInactive": "#A0AB9A",
    "tabActiveStroke": "#C4E3A3",
    "tabActiveFill": "rgba(163,210,122,0.28)",
    "fab": {
      "type": "linear",
      "angle": 150,
      "stops": [
        {
          "color": "#C1E39A",
          "position": 0
        },
        {
          "color": "#A3D27A",
          "position": 0.55
        },
        {
          "color": "#82BB68",
          "position": 1
        }
      ],
      "css": "linear-gradient(150deg, #C1E39A 0%, #A3D27A 55%, #82BB68 100%)"
    },
    "onFab": "#11200F",
    "isDark": true,
    "habitats": {
      "coast": "#7DBFC3",
      "wetlands": "#A6D17C",
      "desert": "#DCBB70",
      "highlands": "#B6A5CE",
      "openSea": "#83AEC7"
    },
    "track": "#2D342E",
    "cardShadow": "none",
    "logoCard": "#F2F5E3",
    "logoFold": "#B9C29B",
    "logoStroke": "#23402A",
    "logoSeal": "#E9CD6F",
    "logoStar": "#26240F",
    "logoTile": "#173538"
  }
} as const;
