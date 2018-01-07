// import * as qs from 'querystring'
import * as WechatOAuth from 'co-wechat-oauth'
import * as Router from 'koa-router'
import * as qs from 'querystring'
import * as Url from 'url'
import { SimpleDataSource } from '../src/DataSource'
import {WechatAuthProxy} from '../src/WechatAuthProxy'

describe('WechatAutuProxy', () => {
  describe('#constructor()', () => {
    it('should be able to create via constructor', () => {
      const proxy = new WechatAuthProxy({} as any)
      expect(proxy).toBeInstanceOf(WechatAuthProxy)
    })
  })
  describe('#middlewarify', () => {
    it('should koa router instance.', () => {
      const proxy = new WechatAuthProxy({} as any)
      expect(proxy.middlewarify()).toBeInstanceOf(Router)
    })
  })
  describe('#auth', () => {
    const dataSource = new SimpleDataSource({
      test: {
        name: 'Test Account',
        appId: 'appId',
        appSecret: 'secret',
        whitelist: ['api.test.com', 'test.foo.com:3000']
      }
    })
    const proxy = new WechatAuthProxy(dataSource)

    it('should reply 400 "Invalid appId." when appId is invalid', (done) => {
      const ctx: any = {
        query: {
          appId: '123',
          redirectUri: 'http://test.com/callback'
        },
        session: {},
        throw(statusCode, msg) {
          expect(statusCode).toBe(400)
          expect(msg).toBe('Invalid appId.')
          done()
        }
      }
      proxy.auth(ctx)
    })

    it('should reply 400 "Invliad redirect URI." when redirect URI is allowed', (done) => {
      const ctx: any = {
        query: {
          appId: 'appId',
          redirectUri: 'http://taobao.com/callback'
        },
        session: {},
        throw(statusCode, msg) {
          expect(statusCode).toBe(400)
          expect(msg).toBe('Invliad redirect URI.')
          done()
        }
      }
      proxy.auth(ctx)
    })

    it('should redirect to wechat authorize URI', (done) => {
      const ctx: any = {
        href: 'http://test.com/callback',
        query: {
          appId: 'appId',
          redirectUri: 'http://api.test.com/callback',
          scope: 'snsapi_userinfo',
          state: 'proxy'
        },
        session: {},
        origin: 'http://auth.test.com',
        set status(statusCode) {
          expect(statusCode).toBe(302)
        },
        redirect(url) {
          const authUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize'
          const info = {
            appid: 'appId',
            redirect_uri: 'http://auth.test.com/wechat/callback',
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
          redirectUri: 'http://api.test.com/callback',
          scope: 'snsapi_userinfo',
          state: 'proxy',
          failureRedirect: 'http://other.com/callback/failure'
        },
        origin: 'http://auth.test.com',
        session: {} as any,
        redirect() {
          expect(ctx.session.redirectUri).toBe('http://api.test.com/callback')
          done()
        }
      }
      proxy.auth(ctx as any)
    })
  })
  describe('#callback()', () => {
    const dataSource = new SimpleDataSource({
      test: {
        name: 'Test Account',
        appId: 'appId',
        appSecret: 'secret',
        whitelist: ['api.test.com', 'test.foo.com:3000']
      }
    })
    const proxy = new WechatAuthProxy(dataSource)
    it('should reply redirect to failureRedirect url when code is not invalid', (done) => {
      const ctx = {
        query: {
          appId: '123',
          state: 'proxy',
          code: 'authdeny'
        },
        session: {
          redirectUri: 'http://other.com/failure'
        },
        set status(statusCode) {
          expect(statusCode).toBe(301)
        },
        redirect(url) {
          expect(url).toBe('http://other.com/failure?state=proxy&error=authdeny')
          done()
        }
      }
      proxy.callback(ctx as any)
    })

    it('should redirect to redirectUri url with openId when scope is "snsapi_base"', (done) => {
      (WechatOAuth as any).__setData({
        getAccessToken: {
          openid: 'OPENID',
          scope: 'snsapi_base'
        }
      })
      const ctx = {
        query: {
          appId: 'appId',
          redirectUri: 'http://other.com/callback',
          code: 'snsapi_base_code',
          state: 'proxy'
        },
        session: {
          redirectUri: 'http://other.com/callback'
        },
        set status(statusCode) {
          expect(statusCode).toBe(301)
        },
        redirect(url) {
          expect(url).toBe('http://other.com/callback?' + qs.stringify({
            state: 'proxy',
            openid: 'OPENID',
            scope: 'snsapi_base'
          }))
          done()
        }
      }
      proxy.callback(ctx as any)
    })

    it('should redirect to successRedirect url with user info when scope is "snsapi_userinfo"', (done) => {
      const user = {
        openid: 'OPENID',
        nickname: 'NICKNAME',
        sex: '1',
        province: 'PROVINCE',
        city: 'CITY',
        country: 'COUNTRY',
        headimgurl: 'http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
        unionid: 'o6_bmasdasdsad6_2sgVt7hMZOPfL'
      };
      (WechatOAuth as any).__setData({
        getUser: user,
        getAccessToken: {
          openid: 'OPENID',
          scope: 'snsapi_userinfo'
        }
      })
      const ctx = {
        query: {
          appId: 'appId',
          redirectUri: 'http://other.com/callback',
          code: 'userinfo',
          state: 'proxy'
        },
        session: {
          redirectUri: 'http://other.com/callback'
        },
        set status(statusCode) {
          expect(statusCode).toBe(301)
        },
        redirect(url) {
          const info = {
            ...user,
            scope: 'snsapi_userinfo',
            state: 'proxy'
          }
          const urlObj = Url.parse(url)
          expect(urlObj.host).toBe('other.com')
          expect(urlObj.pathname).toBe('/callback')
          expect(qs.parse(urlObj.query)).toEqual(info)
          done()
        }
      }
      proxy.callback(ctx as any)
    })

    it('should redirect to when getAccessToken callback with an error', (done) => {
      (WechatOAuth as any).__setFunc('getAccessToken', async () => {throw new Error('unkown error')})
      const ctx = {
        query: {
          appId: 'appId',
          code: 'err',
          state: 'proxy'
        },
        session: {
          redirectUri: 'http://other.com/callback/failure'
        },
        set status(statusCode) {
          expect(statusCode).toBe(301)
        },
        redirect(url) {
          expect(url).toBe('http://other.com/callback/failure?state=proxy&error=unkown+error')
          done()
        }
      }
      proxy.callback(ctx as any)
    })

    it('should redirect to failureRedirect url when getUser callback with an error', (done) => {
      (WechatOAuth as any).__setFunc('getAccessToken', async () => {
        return {data: {
          openid: 'OPENID',
          scope: 'snsapi_userinfo'
        }}
      });
      (WechatOAuth as any).__setFunc('getUser', async () => {
        throw new Error('getUser error')
      })
      const ctx: any = {
        query: {
          appId: 'appId',
          code: 'user_err',
          state: 'proxy'
        },
        session: {
          redirectUri: 'http://other.com/callback/failure'
        },
        set status(statusCode) {
          expect(statusCode).toBe(301)
        },
        redirect(url) {
          expect(url).toBe('http://other.com/callback/failure?state=proxy&error=getUser+error')
          done()
        }
      }
      proxy.callback(ctx)
    })
  })
})
