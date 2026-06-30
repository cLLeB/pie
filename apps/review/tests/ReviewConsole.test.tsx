import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ReviewConsole } from '../src/ReviewConsole';

describe('ReviewConsole', () => {
  it('verifies the demo certificate by default', () => {
    render(<ReviewConsole />);
    expect(screen.getByText('Certificate verified')).toBeInTheDocument();
    expect(screen.getByText(/Hash chain intact/)).toBeInTheDocument();
    expect(screen.getByText(/Signature valid/)).toBeInTheDocument();
  });

  it('flips to a failed verdict when tampering is simulated', () => {
    render(<ReviewConsole />);
    fireEvent.click(screen.getByRole('button', { name: /simulate tampering/i }));
    expect(screen.getByText('Certificate FAILED verification')).toBeInTheDocument();
  });

  it('replays a typed answer to its full reconstructed text', () => {
    render(<ReviewConsole />);
    // The demo q1 answer text appears in its replay pane at full scrub.
    expect(screen.getByText(/Provenance beats detection\./)).toBeInTheDocument();
  });

  it('classifies a typed answer as authored and a pasted one for review', () => {
    render(<ReviewConsole />);
    const answers = screen.getByLabelText('Answers');
    expect(within(answers).getByText('authored (typed)')).toBeInTheDocument();
    expect(within(answers).getByText('pasted — review')).toBeInTheDocument();
    expect(within(answers).getByText(/100% paste/)).toBeInTheDocument();
  });
});
