import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.chikobrowser.app",
  appName: "Chiko Browser",
  webDir: "android-dist",
  server: {
    androidScheme: "https",
    cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a1628",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "Dark",
      backgroundColor: "#0a1628",
    },
  },
  android: {
    buildOptions: {
      keystorePath: "chiko-release.keystore",
      keystoreAlias: "chiko",
    },
  },
};

export default config;
