const sinon = require('sinon');
const { assert } = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('App - store', function () {
  const sandbox = sinon.createSandbox();
  let doubles;

  beforeEach(() => {
    doubles = {
      configureStore: sandbox.stub(),
      counterReducer: sandbox.stub(),
    };
  });

  afterEach(() => sandbox.restore());

  it('should call configureStore once', function () {
    proxyquire('../../../../.test-build/App/store/store.js', {
      '@reduxjs/toolkit': {
        configureStore: doubles.configureStore,
      },
      '@app/features/counter/counterSlice': {
        default: doubles.counterReducer,
        __esModule: true,
      },
    });

    assert.strictEqual(doubles.configureStore.callCount, 1);
  });

  it('should call configureStore with the expected arguments', function () {
    proxyquire('../../../../.test-build/App/store/store.js', {
      '@reduxjs/toolkit': {
        configureStore: doubles.configureStore,
      },
      '@app/features/counter/counterSlice': {
        default: doubles.counterReducer,
        __esModule: true,
      },
    });

    assert.deepEqual(
      doubles.configureStore.args[0],
      [{ reducer: { counter: doubles.counterReducer } }]
    );
  });
});
