
// Configuration for SharePoint Embedded application
export const appConfig = {
  // These values should be updated with your actual values
  clientId: "453b9fbd-7155-4832-8324-efd5c13de9fb", // Replace with your application client ID
  tenantId: "3e8e53be-a48f-4147-adf8-7e90a6e46b57", // Replace with your tenant ID
  containerTypeId: "5d56b164-88fc-4574-b399-7da2520f3a03", // Replace with your container type ID
  appName: "Project Management using SharePoint Embedded",
  ContainerID: "b!q-fcBJA8zE6Af0BM2Nw6xtTONTR4hJ9CufdHAYe_x0y3nP3LqEnASJ6COdc9ZIcQ",

  // Add the SharePoint hostname explicitly
  sharePointHostname: "https://chandrudemo.sharepoint.com",

  // MSAL configuration
  msalConfig: {
    auth: {
      clientId: "453b9fbd-7155-4832-8324-efd5c13de9fb", // Same as above
      authority: "https://login.microsoftonline.com/3e8e53be-a48f-4147-adf8-7e90a6e46b57", // Will be updated with actual tenant ID
      redirectUri: window.location.origin, // Dynamic redirect URI based on current origin
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
  },

  // API endpoints
  endpoints: {
    graphBaseUrl: "https://graph.microsoft.com/v1.0",
    fileStorage: "/storage/fileStorage",
    containers: "/containers",
    drives: "/drives",
  },

  // Copilot theme configuration
  copilotTheme: {
    useDarkMode: false,
    customTheme: {
      themePrimary: '#6941C6',
      themeSecondary: '#7F56D9',
      themeDark: '#5E37BF',
      themeDarker: '#4924A1',
      themeTertiary: '#9E77ED',
      themeLight: '#E9D7FE',
      themeDarkAlt: '#7F56D9',
      themeLighter: '#F4EBFF',
      themeLighterAlt: '#FAF5FF',
      themeDarkAltTransparent: 'rgba(111, 66, 193, 0.9)',
      themeLighterTransparent: 'rgba(233, 215, 254, 0.9)',
      themeLighterAltTransparent: 'rgba(250, 245, 255, 0.9)',
      themeMedium: '#9E77ED',
      neutralSecondary: '#6941C6',
      neutralSecondaryAlt: '#7F56D9',
      neutralTertiary: '#9E77ED',
      neutralTertiaryAlt: '#B692F6',
      neutralQuaternary: '#D6BBFB',
      neutralQuaternaryAlt: '#E9D7FE',
      neutralPrimaryAlt: '#4924A1',
      neutralDark: '#5E37BF',
      themeBackground: 'white',
    }
  }
};
