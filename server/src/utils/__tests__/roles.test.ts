import { describe, expect, it } from 'vitest';

import { isAdminRole, isHigherThan } from '../roles';

describe('roles utils', () => {
  describe('isAdminRole', () => {
    it('returns true for admin roles', () => {
      expect(isAdminRole('ADMIN')).toBe(true);
      expect(isAdminRole('SUPERADMIN')).toBe(true);
    });

    it('returns false for non-admin roles', () => {
      expect(isAdminRole('READER')).toBe(false);
      expect(isAdminRole('WRITER')).toBe(false);
    });
  });

  describe('isHigherThan', () => {
    it('returns true when actor is higher than target', () => {
      expect(isHigherThan('ADMIN', 'WRITER')).toBe(true);
      expect(isHigherThan('SUPERADMIN', 'ADMIN')).toBe(true);
    });

    it('returns false when actor is lower or equal', () => {
      expect(isHigherThan('WRITER', 'ADMIN')).toBe(false);
      expect(isHigherThan('ADMIN', 'ADMIN')).toBe(false);
    });

    it('returns false for unknown roles', () => {
      expect(isHigherThan('UNKNOWN', 'ADMIN')).toBe(false);
      expect(isHigherThan('ADMIN', 'UNKNOWN')).toBe(true);
      expect(isHigherThan('UNKNOWN', 'UNKNOWN')).toBe(false);
    });
  });
});
