import { PodiumAuthProvider } from '@/contexts/PodiumAuthContext';

export default function RacecaptureLayout({ children }: { children: React.ReactNode }) {
  return <PodiumAuthProvider>{children}</PodiumAuthProvider>;
}
