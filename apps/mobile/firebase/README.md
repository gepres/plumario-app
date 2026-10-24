# Configuración de Firebase de la app

Aquí van los dos archivos que da la consola de Firebase al registrar las apps del proyecto:

- `google-services.json` (app Android `com.gepres.plumario`)
- `GoogleService-Info.plist` (app iOS `com.gepres.plumario`)

No se versionan. Mientras no estén, la app compila sin los plugins nativos de Firebase
(`app.config.ts` los activa solo cuando encuentra alguno). Los pasos completos están en
`docs/environment.md`.
