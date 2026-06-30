import { useEffect, useState } from 'react';
import { ExamRunner } from './exam/ExamRunner';
import { sampleExam } from './exam/sampleExam';
import { fetchExam } from './exam/examApi';
import { serverThenLocal, localDemoSigner } from './exam/signerApi';
import type { Exam } from './exam/types';

// When VITE_PIE_SERVER is set, the exam is loaded from the server and signing is
// done server-side (with offline local fallback). With no server configured the
// app runs fully offline against the bundled demo exam and local demo signer.
const serverUrl = import.meta.env.VITE_PIE_SERVER as string | undefined;
const tenant = (import.meta.env.VITE_PIE_TENANT as string | undefined) ?? 'demo';

export function App() {
  const [exam, setExam] = useState<Exam>(sampleExam);

  useEffect(() => {
    if (!serverUrl) return;
    fetchExam(serverUrl, sampleExam.id)
      .then(setExam)
      .catch(() => {
        /* offline / server down — keep the bundled exam */
      });
  }, []);

  const signer = serverUrl ? serverThenLocal(serverUrl, tenant) : localDemoSigner;
  return <ExamRunner exam={exam} signer={signer} />;
}
