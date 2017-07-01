const url = require('url')
const path = require('path')
const qs = require('querystring')
const WechatOAuth = require('co-wechat-oauth')
const debug = require('debug')('proxy')
const assert = require('assert')
const _ = require('lodash')

class WechatAuthProxy {
  constructor(appId, appSecret, options = {}) {
    assert(appId, 'appId is required')
    assert(appSecret, 'appSecret is required')
    this._appId = appId
    this._appSecret = appSecret
    if(options.allowedHosts) {
      this._getAllowedHosts = async () => {
        return options.allowedHosts
      }
    }
    if(options.getAllowedHosts) {
      this._getAllowedHosts = options.getAllowedHosts
    }
    if(!this._getAllowedHosts) {
      this._getAllowedHosts =  async () => []
    }
    const prefix = options.prefix ? options.prefix : ''
    this._authUrl = path.join('/', prefix, '/wechatauth')
    this._callbackUrl = path.join('/', prefix, '/wechatauth/callback')
    this._oauth = new WechatOAuth(appId, appSecret, options.getAccessToken, options.saveAccessToken)
  }
  middlewarify(){
    return async (ctx, next) => {
      if(ctx.method === 'GET') {
        switch(ctx.path) {
          case this._authUrl:
            return this.auth(ctx)
          case this._callbackUrl:
            return this.callback(ctx)
          default:
            next()
        }
      } else {
        next()
      }
    }
  }
  async auth(ctx) {
    const query = ctx.query
    if (query.appId !== this._appId) {
      return ctx.throw(400, 'Invalid appId.')
    }
    const successRedirect = query.successRedirect || query.redirectUri
    const failureRedirect = query.failureRedirect || successRedirect
    if(!successRedirect) {
      return ctx.throw(400, 'Redirect URI is required.')
    }
    let allowed = false
    try {
      allowed = await this._isRedirectUriAllowed(successRedirect, failureRedirect)
    } catch(err) {
      console.log(err)
      return ctx.throw(500, err.message)
    }
    if (!allowed) {
      ctx.throw(400, 'Invliad redirect URI.')
    } else {
      const scope = query.scope || 'snsapi_base'
      const state = query.state || 'proxy'
      ctx.session.successRedirect = successRedirect
      ctx.session.failureRedirect = failureRedirect
      ctx.session.lang = query.lang || 'zh_CN'
      ctx.redirect(this._oauth.getAuthorizeURL(url.resolve(ctx.href, this._callbackUrl), state, scope))
    }
  }
  async callback(ctx) {
    if (!ctx.query.code || ctx.query.code === 'authdeny') {
      ctx.status = 301
      return ctx.redirect(ctx.session.failureRedirect)
    }
    try {
      const accessToken = await this._oauth.getAccessToken(ctx.query.code)
      const data = accessToken.data
      const openId = data.openid
      if (data.scope === 'snsapi_base') {
        const profile = {
          openid: openId,
          scope: data.scope
        }
        ctx.status = 301
        ctx.redirect(ctx.session.successRedirect + '?' + qs.stringify(profile))
      } else {
        const lang = ctx.session.lang
        const options = {
          openid: openId,
          lang: lang
        }
        const user = await this._oauth.getUser(options)
        debug('retrieved user profile: %j', user)
        ctx.status = 301
        ctx.redirect(ctx.session.successRedirect + '?' + qs.stringify(user))
      }

    } catch (err) {
      ctx.status = 301
      return ctx.redirect(ctx.session.failureRedirect)
    }
  }
  async _isRedirectUriAllowed(...uris) {
    const allowedHosts = await this._getAllowedHosts()
    const allowed = uris.every((uri) => {
      const hostname = url.parse(uri).hostname
      return allowedHosts.includes(hostname)
    })
    return allowed
  }
}

new WechatAuthProxy('appId', 'appSecret', async () => {}, async () => {},{getAllowedHosts: async () => {}})

module.exports = WechatAuthProxy
