import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { serializeCertificatePackage } from '@pie/integrity-core';
import { ReviewConsole } from '../src/ReviewConsole';
import { demoPackage } from '../src/demoPackage';

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

  it('imports a pasted package and fails verification under the wrong secret', () => {
    render(<ReviewConsole />);
    fireEvent.click(screen.getByText('Load a certificate package'));
    const json = serializeCertificatePackage(demoPackage.bundle, demoPackage.cert);
    fireEvent.change(screen.getByLabelText('Certificate package JSON'), { target: { value: json } });
    fireEvent.change(screen.getByLabelText('Tenant secret'), { target: { value: 'wrong-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /verify package/i }));
    expect(screen.getByText('Certificate FAILED verification')).toBeInTheDocument();
  });

  it('loads a certificate from an uploaded .json file and verifies with the entered secret', async () => {
    render(<ReviewConsole />);
    fireEvent.click(screen.getByText('Load a certificate package'));
    const json = serializeCertificatePackage(demoPackage.bundle, demoPackage.cert);
    const file = new File([json], 'pie-certificate.json', { type: 'application/json' });

    // Wrong secret → if the file truly loaded and used it, the verdict must FAIL.
    fireEvent.change(screen.getByLabelText('Tenant secret'), { target: { value: 'wrong' } });
    fireEvent.change(screen.getByLabelText('Certificate file'), { target: { files: [file] } });

    expect(await screen.findByText('Certificate FAILED verification')).toBeInTheDocument();
  });

  it('reports a clear error when pasted JSON is malformed', () => {
    render(<ReviewConsole />);
    fireEvent.click(screen.getByText('Load a certificate package'));
    fireEvent.change(screen.getByLabelText('Certificate package JSON'), { target: { value: 'garbage' } });
    fireEvent.click(screen.getByRole('button', { name: /verify package/i }));
    expect(screen.getByText(/not valid JSON/i)).toBeInTheDocument();
  });

  it('classifies a typed answer as authored and a pasted one for review', () => {
    render(<ReviewConsole />);
    const answers = screen.getByLabelText('Answers');
    expect(within(answers).getByText('authored (typed)')).toBeInTheDocument();
    expect(within(answers).getByText(/fully pasted — review/)).toBeInTheDocument();
    expect(within(answers).getByText(/100% paste/)).toBeInTheDocument();
  });

  it('renders a choice answer with its selection and response time, not paste logic', () => {
    render(<ReviewConsole />);
    const answers = screen.getByLabelText('Answers');
    expect(within(answers).getByText(/selected “Page Visibility \/ window blur”/)).toBeInTheDocument();
    expect(within(answers).getByText(/answered in 4\.2s/)).toBeInTheDocument();
  });
});
