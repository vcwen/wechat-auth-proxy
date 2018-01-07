import {MuteSecurityChecker, SimpleSecurityChecker} from '../src/SecurityChecker'
describe('SimpleSecurityChecker', () => {
  describe('#constructor()', () => {
    it('should be able to create via constructor', () => {
      const checker = new SimpleSecurityChecker(['api.test.com', 'test.foo.com'])
      expect(checker).toBeInstanceOf(SimpleSecurityChecker)
    })
  })
  describe('#isValid', () => {
    it('should return true if the redirect uri is valid.', () => {
      const checker = new SimpleSecurityChecker(['api.test.com', 'test.foo.com:3000'])
      expect(checker.isValidRedirectUri('http://api.test.com/callback')).toBe(true)
      expect(checker.isValidRedirectUri('http://test.foo.com:3000/callback')).toBe(true)
    })
    it('should return false if the redirect uri is invalid.', () => {
      const checker = new SimpleSecurityChecker(['api.test.com', 'test.foo.com:3000'])
      expect(checker.isValidRedirectUri('http://not.test.com')).toBe(false)
      expect(checker.isValidRedirectUri('http://test.foo.com:4000/callback')).toBe(false)
    })
  })
})

describe('MuteSecurityChecker', () => {
  describe('#constructor()', () => {
    it('should be able to create via constructor', () => {
      const checker = new MuteSecurityChecker()
      expect(checker).toBeInstanceOf(MuteSecurityChecker)
    })
  })
  describe('#isValid', () => {
    it('should return true if the redirect uri is valid.', () => {
      const checker = new MuteSecurityChecker()
      expect(checker.isValidRedirectUri('http://api.test.com/callback')).toBe(true)
      expect(checker.isValidRedirectUri('http://test.foo.com:3000/callback')).toBe(true)
      expect(checker.isValidRedirectUri('http://not.test.com')).toBe(true)
      expect(checker.isValidRedirectUri('http://test.foo.com:4000/callback')).toBe(true)
    })
  })
})
