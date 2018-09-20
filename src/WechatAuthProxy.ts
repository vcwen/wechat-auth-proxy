// const debug = require('debug')('proxy')
import Koa from 'koa'
import Router from 'koa-router'
import path from 'path'
import qs from 'querystring'
import { URL } from 'url'
import url from 'url'
import { IDataSource } from './DataSource'
import { ISecurityChecker } from './SecurityChecker'
import { ITokenStore } from './TokenStore'

export interface IAuthProxyOptions {
  authUrl: string
  callbackUrl: string
  tokenStore?: ITokenStore
  securityCheck?: ISecurityChecker
}

export class WechatAuthProxy {
  private dataSource: IDataSource
  private prefix: string = ''
  constructor(dataSource: IDataSource) {
    this.dataSource = dataSource
  }
  public middlewarify() {
    const router = new Router()
    router.get('/wechat/authorize', async (ctx) => {
      await this.auth(ctx)
    })
    router.get('/wechat/callback', async (ctx) => {
      await this.callback(ctx)
    })
    return router
  }
  public async auth(ctx: Koa.Context) {
    const query = ctx.query
    const appId = query.appId
    if (!appId) {
      return ctx.throw(400, 'appId is required.')
    }
    const redirectUri = query.redirectUri
    if (!redirectUri) {
      return ctx.throw(400, 'Redirect URI is required.')
    }
    const account = await this.dataSource.getWechatAccount(appId)
    if (!account) {
      return ctx.throw(400, 'Invalid appId.')
    }
    if (!account.securityChecker.isValidRedirectUri(redirectUri)) {
      return ctx.throw(400, 'Invliad redirect URI.')
    }
    const scope = query.scope || 'snsapi_base'
    const state = query.state || 'proxy'
    const callbackQuery: any = { appId }
    if (ctx.session) {
      ctx.session.redirectUri = redirectUri
      ctx.session.lang = query.lang || 'zh_CN'
    } else {
      callbackQuery.redirectUri = redirectUri
      callbackQuery.lang = query.lang || 'zh_CN'
    }

    const callbackUri = url.resolve(
      ctx.origin,
      path.join(this.prefix, '/wechat/callback?' + qs.stringify(callbackQuery))
    )

    ctx.redirect(account.wechatOAuth.getAuthorizeURL(callbackUri, state, scope))
  }
  public async callback(ctx: Koa.Context) {
    let redirectUri: URL
    let lang: string
    if (ctx.session) {
      redirectUri = new URL(ctx.session.redirectUri)
      lang = ctx.session.lang
    } else {
      redirectUri = new URL(ctx.query.redirectUri)
      lang = ctx.query.lang
    }
    redirectUri.searchParams.append('state', ctx.query.state)

    ctx.status = 301
    if (!ctx.query.code || ctx.query.code === 'authdeny') {
      redirectUri.searchParams.append('error', 'authdeny')
      return ctx.redirect(redirectUri.toString())
    }
    const appId = ctx.query.appId
    if (!appId) {
      return ctx.throw(400, 'appId is required.')
    }
    try {
      const account = await this.dataSource.getWechatAccount(appId)
      if (!account) {
        return ctx.throw(400, 'Invalid appId.')
      }
      const accessToken = await account.wechatOAuth.getAccessToken(ctx.query.code)
      const data = accessToken.data
      const openId = data.openid
      const query = {
        openid: openId,
        scope: data.scope
      }
      if (data.scope === 'snsapi_userinfo') {
        const options = {
          openid: openId,
          lang
        }
        const user = await account.wechatOAuth.getUser(options)
        Object.assign(query, user)
      }
      for (const key in query) {
        if (query.hasOwnProperty(key)) {
          redirectUri.searchParams.append(key, query[key])
        }
      }
      ctx.redirect(redirectUri.toString())
    } catch (err) {
      const msg = err instanceof Error ? err.message : err
      redirectUri.searchParams.append('error', msg)
      ctx.redirect(redirectUri.toString())
    }
  }
}

export default WechatAuthProxy
