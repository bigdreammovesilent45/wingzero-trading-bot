import * as jwt from 'jsonwebtoken';

describe('JWTAuthService', () => {
  const secret = 'test-secret-key';
  const testUser = {
    id: '123',
    email: 'test@example.com',
    role: 'trader'
  };

  describe('JWT token generation', () => {
    it('should generate a valid JWT token', () => {
      const token = jwt.sign(testUser, secret, { expiresIn: '1h' });
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should verify a valid token', () => {
      const token = jwt.sign(testUser, secret, { expiresIn: '1h' });
      const decoded = jwt.verify(token, secret) as any;
      
      expect(decoded.id).toBe(testUser.id);
      expect(decoded.email).toBe(testUser.email);
      expect(decoded.role).toBe(testUser.role);
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });

    it('should reject an invalid token', () => {
      const token = jwt.sign(testUser, secret, { expiresIn: '1h' });
      const invalidToken = token + 'tampered';
      
      expect(() => {
        jwt.verify(invalidToken, secret);
      }).toThrow();
    });

    it('should reject an expired token', () => {
      const token = jwt.sign(testUser, secret, { expiresIn: '-1s' }); // Already expired
      
      expect(() => {
        jwt.verify(token, secret);
      }).toThrow('jwt expired');
    });

    it('should handle refresh tokens', () => {
      const accessToken = jwt.sign(testUser, secret, { expiresIn: '15m' });
      const refreshToken = jwt.sign(
        { ...testUser, type: 'refresh' }, 
        secret, 
        { expiresIn: '7d' }
      );
      
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(accessToken).not.toBe(refreshToken);
      
      // Verify refresh token
      const decodedRefresh = jwt.verify(refreshToken, secret) as any;
      expect(decodedRefresh.type).toBe('refresh');
    });
  });

  describe('JWT security features', () => {
    it('should use appropriate algorithm', () => {
      const token = jwt.sign(testUser, secret, { 
        expiresIn: '1h',
        algorithm: 'HS256'
      });
      
      const decoded = jwt.decode(token, { complete: true }) as any;
      expect(decoded.header.alg).toBe('HS256');
    });

    it('should include necessary claims', () => {
      const token = jwt.sign({
        ...testUser,
        iss: 'windsurf-trading',
        aud: 'wing-zero',
        permissions: ['trade', 'view_portfolio']
      }, secret, { expiresIn: '1h' });
      
      const decoded = jwt.verify(token, secret) as any;
      expect(decoded.iss).toBe('windsurf-trading');
      expect(decoded.aud).toBe('wing-zero');
      expect(decoded.permissions).toContain('trade');
    });
  });
});