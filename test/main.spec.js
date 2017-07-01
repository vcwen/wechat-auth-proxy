const expect = require('chai').expect
const qs = require('querystring')
const proxyquire = require('proxyquire')
class WechatOAuth {
  getAuthorizeURL() {
    return 'https://open.weixin.qq.com/connect/oauth2/authorize?appId=appId&redirect_uri=http%3A%2F%2Ftest.com%2Fcallback&response_type=code&scope=snsapi_userinfo&state=proxy#wechat_redirect'
  }
  async getAccessToken(code) {
    if(code === 'err') throw new Error('getAccessToken error')
    let scope = 'snsapi_base'
    if (code === 'userinfo') {
      scope = 'snsapi_userinfo'
    }
    let openid = 'OPENID'
    if(code === 'user_err') {
      openid = 'user_err'
      scope = 'snsapi_userinfo'
    }
    const res = {
      access_token: 'ACCESS_TOKEN',
      expires_in: 7200,
      refresh_token: 'REFRESH_TOKEN',
      openid,
      scope
    }
    return {data: res}
  }
  async getUser(options) {
    if(options.openid === 'user_err') return (new Error('user info error'))
    const user = {
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
    return user
  }

}
const WechatAuthProxy = proxyquire('../main', {
  'co-wechat-oauth': WechatOAuth
})

describe('WechatAuthProxy', function () {
  describe('#constructor()', function () {
    it('should be able to create via constructor', function () {
      const proxy = new WechatAuthProxy('appId', 'appSecret')
      expect(proxy).to.be.instanceof(WechatAuthProxy)
    })

    it('should throw error when required param is not present', () => {
      expect(() => new WechatAuthProxy('', 'appSecret')).to.throw('appId is required')
    })
  })


  describe('#auth()', function () {
    const proxy = new WechatAuthProxy('appId', 'appSecret', {allowedHosts:['other.com']})

    it('should reply 400 "Invalid appId." when appId is invalid', function (done) {
      const ctx = {
        query: {
          appId: '123'
        },
        throw(statusCode, msg) {
          expect(statusCode).to.equal(400)
          expect(msg).to.equal('Invalid appId.')
          done()
        }
      }
      proxy.auth(ctx)
    })

    it('should reply 400 "Invliad redirect URI." when redirect URI is allowed', function (done) {
      const ctx = {
        query: {
          appId: 'appId',
          redirectUri: 'http://taobao.com/callback'
        },
        throw(statusCode, msg) {
          expect(statusCode).to.equal(400)
          expect(msg).to.equal('Invliad redirect URI.')
          done()
        }
      }
      proxy.auth(ctx)
    })

    it('should redirect to wechat authorize URI', function (done) {
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
          expect(statusCode).to.equal(302)
        },
        redirect(url) {
          let authUrl = 'https://open.weixin.qq.com/connect/oauth2/authorize'
          const info = {
            appId: 'appId',
            redirect_uri: 'http://test.com/callback',
            response_type: 'code',
            scope: 'snsapi_userinfo',
            state: 'proxy'
          }

          const expected = authUrl + '?' + qs.stringify(info) + '#wechat_redirect'
          expect(url).to.equal(expected)
          done()
        }
      }
      proxy.auth(ctx)
    })

    it('should store redirect uri to session', function (done) {
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
          expect(ctx.session.successRedirect).to.equal('http://other.com/callback')
          expect(ctx.session.failureRedirect).to.equal('http://other.com/callback/failure')
          done()
        }
      }
      proxy.auth(ctx)
    })
  })

  describe('#callback()', function () {
    const proxy = new WechatAuthProxy('appId', 'appSecret', {allowedHosts: ['other.com']})

    it('should reply redirect to failureRedirect url when code is not available or invalid', function (done) {
      const ctx = {
        query: {
          appId: '123'
        },
        session: {
          failureRedirect: 'http://other.com/failure'
        },
        set status(statusCode) {
          expect(statusCode).to.equal(301)
        },
        redirect(url) {
          expect(url).to.equal('http://other.com/failure')
          done()
        }
      }
      proxy.callback(ctx)
    })

    it('should redirect to successRedirect url with openId when scope is "snsapi_base"', function (done) {
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
          expect(statusCode).to.equal(301)
        },
        redirect(url) {
          expect(url).to.equal('http://other.com/callback?' + qs.stringify({
            openid: 'OPENID',
            scope: 'snsapi_base'
          }))
          done()
        }
      }
      proxy.callback(ctx)
    })

    it('should redirect to successRedirect url with user info when scope is "snsapi_userinfo"', function (done) {
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
          expect(statusCode).to.equal(301)
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
          expect(url).to.equal('http://other.com/callback?' + qs.stringify(info))
          done()
        }
      }
      proxy.callback(ctx)
    })

    it('should redirect to failureRedirect url when getAccessToken callback with an error', function (done) {
      const ctx = {
        query: {
          code: 'err'
        },
        session: {
          failureRedirect: 'http://other.com/callback/failure',
        },
        set status(statusCode) {
          expect(statusCode).to.equal(301)
        },
        redirect(url) {
          expect(url).to.equal('http://other.com/callback/failure')
          done()
        }
      }
      proxy.callback(ctx)
    })

    it('should redirect to failureRedirect url when getUser callback with an error', function (done) {
      const ctx = {
        query: {
          code: 'user_err'
        },
        session: {
          failureRedirect: 'http://other.com/callback/failure'
        },
        set status(statusCode) {
          expect(statusCode).to.equal(301)
        },
        redirect(url) {
          expect(url).to.equal('http://other.com/callback/failure')
          done()
        }
      }
      proxy.callback(ctx)
    })
  })
})
