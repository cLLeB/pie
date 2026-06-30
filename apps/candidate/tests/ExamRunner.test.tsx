import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ExamRunner } from '../src/exam/ExamRunner';
import type { Exam } from '../src/exam/types';

const exam: Exam = {
  id: 't',
  title: 'Test Exam',
  durationSeconds: 60,
  questions: [
    { id: 'q1', prompt: 'Explain.', kind: 'text' },
    { id: 'q2', prompt: 'Choose.', kind: 'choice', options: ['A', 'B'] },
  ],
};

describe('ExamRunner', () => {
  it('renders the exam title and questions', () => {
    render(<ExamRunner exam={exam} />);
    expect(screen.getByText('Test Exam')).toBeInTheDocument();
    expect(screen.getByText(/Explain\./)).toBeInTheDocument();
    expect(screen.getByText(/Choose\./)).toBeInTheDocument();
  });

  it('shows the glass-box promise that no footage is stored', () => {
    render(<ExamRunner exam={exam} />);
    const panel = screen.getByLabelText('What PIE is monitoring');
    expect(within(panel).getByText('none')).toBeInTheDocument();
  });

  it('records a choice as an integrity event (event count rises)', () => {
    render(<ExamRunner exam={exam} />);
    const panel = screen.getByLabelText('What PIE is monitoring');
    fireEvent.click(screen.getByLabelText('A'));
    // After selecting, the integrity event count should be at least 2 (start + choice).
    expect(within(panel).getByText(/^[2-9]\d*$/)).toBeInTheDocument();
  });

  it('issues a verified Authenticity Certificate on submit', () => {
    render(<ExamRunner exam={exam} />);
    fireEvent.click(screen.getByRole('button', { name: /submit exam/i }));
    const cert = screen.getByLabelText('Authenticity Certificate');
    expect(within(cert).getByText(/Chain verified/)).toBeInTheDocument();
  });
});
