import WechatOAuth from 'co-wechat-oauth'
import { isEmpty } from 'lodash'
import { ISecurityChecker, MuteSecurityChecker, SimpleSecurityChecker } from './SecurityChecker'
import { ITokenStore } from './TokenStore'

export class WechatAccount {
  public name: string
  public appId: string
  public appSecret: string
  public wechatOAuth: any
  public securityChecker: ISecurityChecker
  constructor(name: string, appId: string, appSecret: string, tokenStore: ITokenStore, whitelist: string[]) {
    this.name = name
    this.appId = appId
    this.appSecret = appSecret
    if (isEmpty(whitelist)) {
      this.securityChecker = new MuteSecurityChecker()
    } else {
      this.securityChecker = new SimpleSecurityChecker(whitelist)
    }
    this.wechatOAuth = new WechatOAuth(appId, appSecret, tokenStore.getAccessToken, tokenStore.saveAccessToken)
  }
}
