/**
 * Workbox config for PWA service worker.
 * craco-workbox uses this to customize GenerateSW options.
 */
module.exports = {
  GenerateSW: (options) => {
    options.clientsClaim = true;
    options.skipWaiting = true;
    return options;
  },
};
