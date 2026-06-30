import { ExamRunner } from './exam/ExamRunner';
import { sampleExam } from './exam/sampleExam';

export function App() {
  return <ExamRunner exam={sampleExam} />;
}
