import { useEffect } from 'react';
import { Landing } from './pages/Landing';
import { JpegLab } from './experiments/jpeg/JpegLab';
import { QrLab } from './experiments/qr/QrLab';
import { useRoute } from './lib/router';

/**
 * QRYX application shell.
 * Three surfaces: the lab index (landing), Experiment 001 — The JPEG Lab and
 * Experiment 002 — The QR Lab. Routing is a tiny local hash router so the app
 * stays dependency-free.
 */
export default function App() {
  const route = useRoute();

  // Each surface starts at the top; the landing's own nav handles in-page anchors.
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [route]);

  if (route === 'jpegLab') return <JpegLab />;
  if (route === 'qrLab') return <QrLab />;
  return <Landing />;
}
