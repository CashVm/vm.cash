import '@testing-library/jest-dom';

declare module 'bun:test' {
  interface Matchers<T = unknown> {
    toHaveClass(...classNames: Array<string | RegExp>): T;
    toHaveClass(classNames: string, options?: { exact?: boolean }): T;
    toBeInTheDocument(): T;
    toHaveValue(expected?: unknown): T;
  }
}
