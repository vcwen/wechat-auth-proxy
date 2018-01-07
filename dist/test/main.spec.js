"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// import * as qs from 'querystring'
const WechatAuthProxy_1 = require("../src/WechatAuthProxy");
describe('WechatAuthProxy', () => {
    describe('#constructor()', () => {
        it('should be able to create via constructor', () => {
            const proxy = new WechatAuthProxy_1.default('appId', 'appSecret', { authUrl: '', callbackUrl: '' });
            expect(proxy).toBeInstanceOf(WechatAuthProxy_1.default);
        });
        it('should throw error when required param is not present', () => {
            expect(() => new WechatAuthProxy_1.default('', 'appSecret', { authUrl: '', callbackUrl: '' })).toThrow('appId is required');
        });
    });
    /* describe('#auth()', () => {
      const proxy = new WechatAuthProxy('appId', 'appSecret', {authUrl: '', callbackUrl: ''})
  
      it('should reply 400 "Invalid appId." when appId is invalid', (done) => {
        const ctx: any = {
          query: {
            appId: '123'
          },
          throw(statusCode, msg) {
            expect(statusCode).toBe(400)
            expect(msg).toBe('Invalid appId.')
            done()
          }
        }
        proxy.auth(ctx)
      })
  
      it('should reply 400 "Invliad redirect URI." when redirect URI is allowed', (done) => {
        const ctx = {
          query: {
            appId: 'appId',
            redirectUri: 'http://taobao.com/callback'
          },
          throw(statusCode, msg) {
            expect(statusCode).toBe(400)
            expect(msg).toBe('Invliad redirect URI.')
            done()
          }
        }
        proxy.auth(ctx)
      })
  
      it('should redirect to uri with the same hostname with the auth server', (done) => {
        const ctx = {
          query: {
            appId: 'appId',
            redirectUri: 'http://sometest.com/callback',
            hostname: 'sometest.com'
          },
          throw(statusCode, msg) {
            expect(statusCode).toBe(400)
            expect(msg).toBe('Invliad redirect URI.')
            done()
          }
        }
        proxy.auth(ctx)
      })
  
      it('should redirect to wechat authorize URI', (done) => {
        const ctx = {
          href: 'http://test.com/callback',
          query: {
            appId: 'appId',
            redirectUri: 'http://other.com/callback',
            scope: 'snsapi_userinfo',
            state: 'proxy'
          },
          session: {},
          set status(statusCode) {
            expect(statusCode).toBe(302)
          },
          redirect(url) {
            const authUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize'
            const info = {
              appId: 'appId',
              redirect_uri: 'http://test.com/callback',
              response_type: 'code',
              scope: 'snsapi_userinfo',
              state: 'proxy'
            }
  
            const expected = authUrl + '?' + qs.stringify(info) + '#wechat_redirect'
            expect(url).toBe(expected)
            done()
          }
        }
        proxy.auth(ctx)
      })
  
      it('should store redirect uri to session', (done) => {
        const ctx = {
          href: 'http://test.com/callback',
          query: {
            appId: 'appId',
            redirectUri: 'http://other.com/callback',
            scope: 'snsapi_userinfo',
            state: 'proxy',
            failureRedirect: 'http://other.com/callback/failure'
          },
          session: {},
          redirect() {
            expect(ctx.session.successRedirect).toBe('http://other.com/callback')
            expect(ctx.session.failureRedirect).toBe('http://other.com/callback/failure')
            done()
          }
        }
        proxy.auth(ctx)
      })
    })
  
    describe('#callback()', () => {
      const proxy = new WechatAuthProxy('appId', 'appSecret', {authUrl: '', callbackUrl: ''})
  
      it('should reply redirect to failureRedirect url when code is not available or invalid', (done) => {
        const ctx = {
          query: {
            appId: '123'
          },
          session: {
            failureRedirect: 'http://other.com/failure'
          },
          set status(statusCode) {
            expect(statusCode).toBe(301)
          },
          redirect(url) {
            expect(url).toBe('http://other.com/failure')
            done()
          }
        }
        proxy.callback(ctx)
      })
  
      it('should redirect to successRedirect url with openId when scope is "snsapi_base"', (done) => {
        const ctx = {
          query: {
            appId: 'appId',
            redirectUri: 'http://other.com/callback',
            code: 'code'
          },
          session: {
            successRedirect: 'http://other.com/callback'
          },
          set status(statusCode) {
            expect(statusCode).toBe(301)
          },
          redirect(url) {
            expect(url).toBe('http://other.com/callback?' + qs.stringify({
              openid: 'OPENID',
              scope: 'snsapi_base'
            }))
            done()
          }
        }
        proxy.callback(ctx)
      })
  
      it('should redirect to successRedirect url with user info when scope is "snsapi_userinfo"', (done) => {
        const ctx = {
          query: {
            appId: 'appId',
            redirectUri: 'http://other.com/callback',
            code: 'userinfo'
          },
          session: {
            successRedirect: 'http://other.com/callback'
          },
          set status(statusCode) {
            expect(statusCode).toBe(301)
          },
          redirect(url) {
            const info = {
              openid: 'OPENID',
              nickname: 'NICKNAME',
              sex: 1,
              province: 'PROVINCE',
              city: 'CITY',
              country: 'COUNTRY',
              headimgurl: 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
              privilege: ['PRIVILEGE1', 'PRIVILEGE2'],
              unionid: 'o6_bmasdasdsad6_2sgVt7hMZOPfL'
            }
            expect(url).toBe('http://other.com/callback?' + qs.stringify(info))
            done()
          }
        }
        proxy.callback(ctx)
      })
  
      it('should redirect to failureRedirect url when getAccessToken callback with an error', (done) => {
        const ctx = {
          query: {
            code: 'err'
          },
          session: {
            failureRedirect: 'http://other.com/callback/failure'
          },
          set status(statusCode) {
            expect(statusCode).toBe(301)
          },
          redirect(url) {
            expect(url).toBe('http://other.com/callback/failure')
            done()
          }
        }
        proxy.callback(ctx)
      })
  
      it('should redirect to failureRedirect url when getUser callback with an error', (done) => {
        const ctx = {
          query: {
            code: 'user_err'
          },
          session: {
            failureRedirect: 'http://other.com/callback/failure'
          },
          set status(statusCode) {
            expect(statusCode).toBe(301)
          },
          redirect(url) {
            expect(url).toBe('http://other.com/callback/failure')
            done()
          }
        }
        proxy.callback(ctx)
      })
    }) */
});
