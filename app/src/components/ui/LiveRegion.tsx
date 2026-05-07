import { useEffect, useRef, useState } from 'react';
import { setAnnouncer } from '../../lib/announce';

export function LiveRegion() {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const politeTimer = useRef<number | null>(null);
  const assertiveTimer = useRef<number | null>(null);

  useEffect(() => {
    setAnnouncer((politeness, text) => {
      if (politeness === 'polite') {
        setPolite('');
        if (politeTimer.current) window.clearTimeout(politeTimer.current);
        politeTimer.current = window.setTimeout(() => setPolite(text), 50);
      } else {
        setAssertive('');
        if (assertiveTimer.current) window.clearTimeout(assertiveTimer.current);
        assertiveTimer.current = window.setTimeout(() => setAssertive(text), 50);
      }
    });
    return () => {
      setAnnouncer(null);
      if (politeTimer.current) window.clearTimeout(politeTimer.current);
      if (assertiveTimer.current) window.clearTimeout(assertiveTimer.current);
    };
  }, []);

  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {polite}
      </div>
      <div role="alert" aria-live="assertive" aria-atomic="true" className="sr-only">
        {assertive}
      </div>
    </>
  );
}
