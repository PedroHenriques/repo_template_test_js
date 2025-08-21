'use strict';
const fs = require('fs');
const path = require('path');

let configs;

function getConfigs(service) {
  if (configs === undefined) {
    const defaultConfigPath = path.resolve(
      __dirname, 'Configs', 'config.default.json'
    );
    if (fs.existsSync(defaultConfigPath) == false) {
      throw new Error(`Missing config: ${defaultConfigPath}`);
    }
    const defaultConfigs = JSON.parse(
      fs.readFileSync(defaultConfigPath, { encoding: 'utf8' })
    );

    const userConfigPath = path.resolve(
      __dirname, "src", service, 'Configs', 'config.json'
    );
    const customConfigs = fs.existsSync(userConfigPath)
      ? JSON.parse(fs.readFileSync(userConfigPath, { encoding: 'utf8' }))
      : {};

    configs = { ...defaultConfigs, ...customConfigs };

    if (process.env.CICD === 'true') {
      const testsConfigPath = path.resolve(
        __dirname, "test", 'Configs', 'config.json'
      );

      const testsConfigs = fs.existsSync(testsConfigPath)
        ? JSON.parse(fs.readFileSync(testsConfigPath, { encoding: 'utf8' }))
        : {};

       configs = { ...configs, ...testsConfigs };
    }
  }

  return configs;
};

module.exports = getConfigs;