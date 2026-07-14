const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('regradeDesktop', {
  isDesktop: true,
  platform: process.platform,
});
