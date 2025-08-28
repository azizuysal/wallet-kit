import { detectPassType } from '../index';

describe('WalletKit Utils', () => {
  describe('detectPassType', () => {
    it('should detect JWT format', () => {
      const jwt =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      expect(detectPassType(jwt)).toBe('jwt');
    });

    it('should detect PKPass format', () => {
      // Base64 encoded data starting with 'PK'
      const pkpassData = 'UEsDBAoAAAAAAIdO4kbr'; // 'PK' in base64
      expect(detectPassType(pkpassData)).toBe('pkpass');
    });

    it('should return unknown for invalid data', () => {
      expect(detectPassType('invalid data')).toBe('unknown');
      expect(detectPassType('')).toBe('unknown');
      expect(detectPassType('not.a.jwt.format.string')).toBe('unknown');
    });

    it('should handle malformed JWT', () => {
      expect(detectPassType('a.b')).toBe('unknown'); // Only 2 parts
      expect(detectPassType('a.b.c.d')).toBe('unknown'); // Too many parts
    });
  });
});
