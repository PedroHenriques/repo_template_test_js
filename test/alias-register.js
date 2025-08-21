const tsConfigPaths = require('tsconfig-paths');
const path = require('path');

// point baseUrl to the compiled JS root
const baseUrl = path.resolve(process.cwd(), '.test-build');

tsConfigPaths.register({
  baseUrl,
  paths: {
    '@app/*': ['App/*'],
  }
});
