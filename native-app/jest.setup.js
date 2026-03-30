/* global jest */

jest.mock('react-native-linear-gradient', () => 'LinearGradient');

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));
