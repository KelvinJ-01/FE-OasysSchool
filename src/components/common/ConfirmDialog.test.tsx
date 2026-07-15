import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfirmDialog } from './ConfirmDialog';

afterEach(cleanup);

function setup(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      isOpen
      title="Hapus Kelas"
      description='Kelas "XII IPA 1" akan dihapus. Tindakan ini tidak dapat dibatalkan.'
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('menampilkan judul dan deskripsi', () => {
    setup();
    expect(screen.getByText('Hapus Kelas')).toBeDefined();
    expect(screen.getByText(/XII IPA 1/)).toBeDefined();
  });

  it('tidak merender apa pun saat tertutup', () => {
    setup({ isOpen: false });
    expect(screen.queryByText('Hapus Kelas')).toBeNull();
  });

  it('memanggil onConfirm saat tombol konfirmasi ditekan', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup({ confirmLabel: 'Ya, Hapus' });

    await user.click(screen.getByRole('button', { name: 'Ya, Hapus' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('memanggil onCancel saat tombol batal ditekan', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();

    await user.click(screen.getByRole('button', { name: 'Batal' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('memakai label bawaan bila tidak diberikan', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Konfirmasi' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDefined();
  });

  it('menonaktifkan kedua tombol selama proses berjalan (cegah klik ganda)', () => {
    setup({ isProcessing: true, confirmLabel: 'Ya, Hapus' });

    const buttons = screen.getAllByRole('button').filter((b) => /Ya, Hapus|Batal/.test(b.textContent ?? ''));
    expect(buttons.length).toBeGreaterThan(0);
    buttons.forEach((b) => expect((b as HTMLButtonElement).disabled).toBe(true));
  });

  it('tidak memanggil onConfirm saat sedang memproses', async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup({ isProcessing: true, confirmLabel: 'Ya, Hapus' });

    await user.click(screen.getByRole('button', { name: /Ya, Hapus/ }));

    expect(onConfirm).not.toHaveBeenCalled();
  });
});
