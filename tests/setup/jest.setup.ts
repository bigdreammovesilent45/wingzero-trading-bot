// Mock browser APIs for Node.js test environment

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn((key) => null),
  setItem: jest.fn((key, value) => {}),
  removeItem: jest.fn((key) => {}),
  clear: jest.fn(),
  length: 0,
  key: jest.fn((index) => null)
};
(global as any).localStorage = localStorageMock;

// Mock window.location
(global as any).window = {
  location: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    protocol: 'http:',
    host: 'localhost:3000',
    hostname: 'localhost',
    port: '3000',
    pathname: '/',
    search: '',
    hash: ''
  }
};

// Mock fetch if needed
if (!global.fetch) {
  (global as any).fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
      headers: new Headers(),
      status: 200,
      statusText: 'OK'
    })
  );
}