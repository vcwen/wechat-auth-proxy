const url = require('url')
const qs = require('querystring')
const WechatOAuth = require('co-wechat-oauth')
const debug = require('debug')('proxy')
const assert = require('assert')

class WechatAuthProxy {
  constructor(appId, appSecret, getAccessToken, saveAccessToken, options = {}) {
    assert(appId, 'appId is required')
    assert(appSecret, 'appSecret is required')
    this._appId = appId
    this._appSecret = appSecret
    if(options.allowedHosts) {
      this._getAllowedHosts = async () => {
        return options.allowedHosts
      }
    }

    this._prefix = options.prefix || ''
    if(options.getAllowedHosts) {
      this._getAllowedHosts = options.getAllowedHosts
    }
    if(!this._getAllowedHosts) {
      this._getAllowedHosts =  async () => []
    }
    this._callbackUrl = this._prefix + '/wechatauth/callback'
    this._oauth = new WechatOAuth(appId, appSecret, getAccessToken, saveAccessToken)
  }
  middlewarify(){
    return (req, res, next) => {
      if(req.method === 'GET') {
        switch(req.path) {
          case '/wechatauth':
            return this.auth(req, res)
          case '/wechatauth/callback':
            return this.callback(req, res)
          default:
            next()
        }
      } else {
        next()
      }
    }
  }
  async auth(req, res) {
    const query = req.query
    if (query.appId !== this._appId) {
      return res.status(400).send('Invalid appId.')
    }
    const successRedirect = query.successRedirect || query.redirectUri
    const failureRedirect = query.failureRedirect || successRedirect
    let allowed = false
    try {
      allowed = await this._isRedirectUriAllowed(successRedirect, failureRedirect)
    } catch(err) {
      return res.status(500).send(err)
    }
    if (!allowed) {
      res.status(400).send('Invliad redirect URI.')
    } else {
      const scope = query.scope || 'snsapi_base'
      const state = query.state || 'proxy'
      req.session.successRedirect = successRedirect
      req.session.failureRedirect = failureRedirect
      req.session.lang = query.lang || 'zh_CN'
      res.redirect(302, this._oauth.getAuthorizeURL(this._callbackUrl, state, scope))
    }
  }
  async callback(req, res) {
    if (!req.query.code || req.query.code === 'authdeny') {
      return res.redirect(301, req.session.failureRedirect)
    }
    try {
      const accessToken = await this._oauth.getAccessToken(req.query.code)
      const data = accessToken.data
      const openId = data.openid
      if (data.scope === 'snsapi_base') {
        const profile = {
          openid: openId,
          scope: data.scope
        }
        res.redirect(301, req.session.successRedirect + '?' + qs.stringify(profile))
      } else {
        const lang = req.session.lang
        const options = {
          openid: openId,
          lang: lang
        }
        const user = await this._oauth.getUser(options)
        debug('retrieved user profile: %j', user)
        res.redirect(301, req.session.successRedirect + '?' + qs.stringify(user))
      }

    } catch (err) {
      return res.redirect(301, req.session.failureRedirect)
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
