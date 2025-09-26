import { OpcodesPage } from './opcodes/OpcodesPage';
import { Analytics } from '@vercel/analytics/react';
import './index.css';

export function App() {
  if (typeof window !== 'undefined') {
    const { pathname, search, hash } = window.location;
    if (!pathname.startsWith('/opcodes')) {
      const redirectTarget = `/opcodes${search}${hash}`;
      window.location.replace(redirectTarget);
      return null;
    }
  }

  return (
    <>
      <OpcodesPage />
      <Analytics />
    </>
  );
}

export default App;
