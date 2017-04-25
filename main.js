const url = require('url')
const qs = require('querystring')
const WechatOAuth = require('wechat-oauth')
const debug = require('debug')('proxy')
const assert = require('assert')
const async = require('async')

class WechatAuthProxy {
  constructor(appId, appSecret, callbackUrl, getAllowedHosts, getAccessToken, saveAccessToken) {
    assert(appId, 'appId is required')
    assert(appSecret, 'appSecret is required')
    assert(callbackUrl, 'callbackUrl is required')
    assert(getAllowedHosts, 'getAllowedHosts is required')
    this._appId = appId
    this._appSecret = appSecret
    this._getAllowedHosts = getAllowedHosts
    this._callbackUrl = callbackUrl
    this._oauth = new WechatOAuth(appId, appSecret, getAccessToken, saveAccessToken)
  }
  auth(req, res) {
    const query = req.query
    if (query.appId !== this._appId) {
      return res.status(400).send('Invalid appId.')
    }
    const successRedirect = query.successRedirect || query.redirectUri
    const failureRedirect = query.failureRedirect || successRedirect
    async.every([successRedirect, failureRedirect], (url, cb) => {
      this._isRedirectUriAllowed(url, cb)
    }, (err, valid) => {
      if (err) return res.sendStatus(500)
      if (!valid) {
        res.status(400).send('Invliad redirect URI.')
      } else {
        const scope = query.scope || 'snsapi_base'
        const state = query.state || 'proxy'
        req.session.successRedirect = successRedirect
        req.session.failureRedirect = failureRedirect
        req.session.lang = query.lang || 'zh_CN'
        res.redirect(302, this._oauth.getAuthorizeURL(this._callbackUrl, state, scope))
      }
    })


  }
  callback(req, res) {
    if (!req.query.code || req.query.code === 'authdeny') {
      res.redirect(301, req.session.failureRedirect)
    }
    this._oauth.getAccessToken(req.query.code, (err, result) => {
      if (err) return res.redirect(301, req.session.failureRedirect)
      const data = result.data
      debug('retrieved access token.%j', data)
      const openId = data.openid
      if (data.scope === 'snsapi_base') {
        const profile = {
          openid: openId,
          scope: data.scope
        }
        res.redirect(301, req.session.successRedirect + '?' + qs.stringify(profile))
      } else {
        const lang = this._lang
        const options = {
          openid: openId,
          lang: lang
        }
        this._oauth.getUser(options, function (err, result) {
          if (err) return res.redirect(301, req.session.failureRedirect)
          debug('retrieved user profile: %j', result.data)
          res.redirect(301, req.session.successRedirect + '?' + qs.stringify(result.data))
        })
      }
    })
  }
  _isRedirectUriAllowed(uri, callback) {
    if (typeof uri !== 'string') {
      return false
    }
    const hostname = url.parse(uri).hostname
    this._getAllowedHosts((err, allowedHosts) => {
      if (err) return callback(err)
      callback(null, allowedHosts.includes(hostname))
    })
  }
}

module.exports = WechatAuthProxy
