import { OpcodesPage } from './opcodes/OpcodesPage';
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

  return <OpcodesPage />;
}

export default App;
