import { AccessToken } from '../src/AccessToken'
import {MemoryTokenStore} from '../src/TokenStore'
describe('MemoryTokenStore', () => {
  describe('#constructor()', () => {
    it('should be able to create via constructor', () => {
      const store = new MemoryTokenStore()
      expect(store).toBeInstanceOf(MemoryTokenStore)
    })
  })
  describe('#saveAccessToken ', () => {
    it('should be able to save token.', async () => {
      const store = new MemoryTokenStore()
      const token = new AccessToken('token_str', new Date())
      store.saveAccessToken('appId1', token)
      expect(await store.getAccessToken('appId1')).toBe(token)
    })
  })
  describe('#getAccessToken ', () => {
    it('should get the token for specific app.', async () => {
      const store = new MemoryTokenStore()
      const token1 = new AccessToken('token_str', new Date())
      const token2 = new AccessToken('token_str2', new Date())
      store.saveAccessToken('appId1', token1)
      store.saveAccessToken('appId2', token2)
      const t = await store.getAccessToken('appId2')
      expect(t).toBe(token2)
    })
  })
})
