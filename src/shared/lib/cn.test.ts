import { cn } from './cn';

describe('cn', () => {
  it('lets later classes override conflicting ones, including custom tokens', () => {
    expect(cn('text-sm text-muted', 'text-danger')).toBe('text-sm text-danger');
    expect(cn('font-body-bold', 'font-body-semibold')).toBe('font-body-semibold');
    expect(cn('rounded-full px-4', false, null, 'px-6')).toBe('rounded-full px-6');
  });
});
