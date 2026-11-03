// Jest usa Babel para entender JSX y módulos ES (Vite no participa en las pruebas)
export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|scss)$': 'identity-obj-proxy',
    // axios publica ESM para navegador; en Jest se usa su build CommonJS
    '^axios$': 'axios/dist/node/axios.cjs',
  },
  testPathIgnorePatterns: ['/node_modules/', '/legacy/'],
};
