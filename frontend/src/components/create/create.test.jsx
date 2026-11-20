import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../../i18n';
import FleetSelector from './FleetSelector';
import CreateRoom from './CreateRoom';
import CodeField from '../CodeField';

const CONFIG = { 4: 1, 3: 2, 2: 2, 1: 4 };

beforeEach(async () => { await i18n.changeLanguage('en'); });

test('klik w 3 przy 2-masztowcu woła onChange("2", 3)', async () => {
  const onChange = vi.fn();
  render(<FleetSelector config={CONFIG} onChange={onChange} />);
  const group = screen.getByRole('radiogroup', { name: '2-mast ship count' });
  await userEvent.click(group.querySelector('[role="radio"][data-value="3"]'));
  expect(onChange).toHaveBeenCalledWith('2', 3);
});

test('wybrana wartość ma aria-checked="true"', () => {
  render(<FleetSelector config={CONFIG} onChange={() => {}} />);
  const group = screen.getByRole('radiogroup', { name: '1-mast ship count' });
  expect(group.querySelector('[data-value="4"]')).toHaveAttribute('aria-checked', 'true');
  expect(group.querySelector('[data-value="3"]')).toHaveAttribute('aria-checked', 'false');
});

test('CodeField domyślnie ukrywa kod, a po Show code go pokazuje', async () => {
  render(<CodeField code="7F3K9Q" revealable />);
  expect(screen.queryByText('7F3K9Q')).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: 'Show code' }));
  expect(screen.getByText('7F3K9Q')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Hide code' })).toBeInTheDocument();
});

test('nazwy statków po polsku', async () => {
  await i18n.changeLanguage('pl');
  render(<MemoryRouter><CreateRoom nick="" onNickChange={() => {}} config={CONFIG} onConfigChange={() => {}} onBack={() => {}} onCreate={() => {}} /></MemoryRouter>);
  expect(screen.getByText('4-masztowiec')).toBeInTheDocument();
  expect(screen.queryByText(/of 100 cells/)).not.toBeInTheDocument();
});

test('CreateRoom wywołuje onCreate po kliknięciu przycisku', async () => {
  const onCreate = vi.fn();
  render(<MemoryRouter><CreateRoom nick="K" onNickChange={() => {}} config={CONFIG} onConfigChange={() => {}} onBack={() => {}} onCreate={onCreate} /></MemoryRouter>);
  await userEvent.click(screen.getByRole('button', { name: 'Create room' }));
  expect(onCreate).toHaveBeenCalledTimes(1);
});
