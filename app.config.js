// app.config.js — Dynamic config to support EAS file secrets for Firebase
// The GOOGLE_SERVICES_JSON env variable is set by EAS when you upload the file as a secret:
//   eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: "bizilink",
  slug: "bizilink",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/BizlinkLogo.png",
  scheme: "bizilink",
  userInterfaceStyle: "automatic",
  ios: {
    icon: "./assets/images/BizlinkLogo.png",
    googleServicesFile: process.env.GOOGLE_SERVICES_INFO_PLIST ?? "./GoogleService-Info.plist",
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/BizlinkLogo.png",
      backgroundImage: "./assets/images/BizlinkLogo.png",
      monochromeImage: "./assets/images/BizlinkLogo.png",
    },
    predictiveBackGestureEnabled: false,
    package: "com.forkhive.bizilink",
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
  },
  web: {
    output: "static",
    favicon: "./assets/images/BizlinkLogo.png",
  },
  plugins: [
    "expo-router",
    "@react-native-google-signin/google-signin",
    [
      "expo-splash-screen",
      {
        backgroundColor: "#933EFF",
        image: "./assets/images/BizlinkLogo.png",
        imageWidth: 120,
        android: {
          image: "./assets/images/BizlinkLogo.png",
          imageWidth: 120,
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: "77abcbfc-ec43-403e-87eb-dffb2e53c943",
    },
  },
};

export default config;
