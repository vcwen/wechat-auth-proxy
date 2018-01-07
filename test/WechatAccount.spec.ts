import { MuteSecurityChecker, SimpleSecurityChecker } from '../src/SecurityChecker'
import {WechatAccount} from '../src/WechatAccount'
describe('WechatAccount', () => {
  describe('#constructor()', () => {
    it('should be able to create via constructor', () => {
      const wechatAccount = new WechatAccount('test', 'appId', 'secret', {} as any, [])
      expect(wechatAccount).toBeInstanceOf(WechatAccount)
    })
    it('should use SimpleSecurityCheker if whitelist is not empty.', () => {
      const wechatAccount = new WechatAccount('test', 'appId', 'secret', {} as any, ['test.com'])
      expect(wechatAccount.securityChecker).toBeInstanceOf(SimpleSecurityChecker)
    })
    it('should use MuteSecurityCheker if whitelist is empty.', () => {
      const wechatAccount = new WechatAccount('test', 'appId', 'secret', {} as any, [])
      expect(wechatAccount.securityChecker).toBeInstanceOf(MuteSecurityChecker)
    })
  })
})
