import {AccessToken} from '../src/AccessToken'
describe('AccessToken', () => {
  describe('#constructor()', () => {
    it('should be able to create via constructor', () => {
      const token = new AccessToken('access_token_test', new Date(Date.now() + 60 * 1000))
      expect(token).toBeInstanceOf(AccessToken)
    })
  })
  describe('#isValidRedirectUri', () => {
    it('should return true if the access token is valid.', () => {
      const token = new AccessToken('access_token_test', new Date(Date.now() + 60 * 1000))
      expect(token.isValid()).toBe(true)
    })
    it('should return false if the access token is invalid.', () => {
      const token = new AccessToken('access_token_test', new Date(Date.now() - 60 * 1000))
      expect(token.isValid()).toBe(false)
    })
  })
})
