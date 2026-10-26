// Config plugin: el ícono y el color de las notificaciones de Android.
//
// El plugin de @react-native-firebase/messaging escribe en el manifiesto que el ícono es
// @drawable/notification_icon y el color @color/notification_icon_color, pero no crea esos recursos
// (lo haría expo-notifications, que no usamos): sin ellos, la compilación falla. Este plugin copia
// el ícono (blanco sobre transparente, de pnpm icons) a drawable-xxxhdpi y define el color.
const fs = require('node:fs');
const path = require('node:path');

const { AndroidConfig, withAndroidColors, withDangerousMod } = require('expo/config-plugins');

module.exports = function withNotificationIcon(config, { icon, color }) {
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const drawable = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'drawable-xxxhdpi');
      fs.mkdirSync(drawable, { recursive: true });
      fs.copyFileSync(path.resolve(config.modRequest.projectRoot, icon), path.join(drawable, 'notification_icon.png'));
      return config;
    },
  ]);
  return withAndroidColors(config, (config) => {
    config.modResults = AndroidConfig.Colors.assignColorValue(config.modResults, { name: 'notification_icon_color', value: color });
    return config;
  });
};
