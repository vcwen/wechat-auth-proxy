import {List, Map} from 'immutable'
import {struct} from 'superstruct'
import { MemoryTokenStore } from './TokenStore'
import { WechatAccount } from './WechatAccount'

export interface IDataSource {
  getWechatAccounts(): Promise<List<{[prop: string]: any}>>
  getWechatAccount(appId: string): Promise<WechatAccount | undefined>
}

export class SimpleDataSource implements IDataSource {
  private accounts: Map<string, WechatAccount>
  constructor(data: {[prop: string]: {name?: string, appId: string, appSecret: string, whitelist: string[]}}) {
    const AccountCheck = struct({
      name: 'string?',
      appId: 'string',
      appSecret: 'string',
      whitelist: ['string?']
    })
    const accts = {} as {[key: string]: WechatAccount}
    const tokenStore = new MemoryTokenStore()
    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const info = AccountCheck(data[key])
        const name = info.name || key
        const acct = new WechatAccount(name, info.appId, info.appSecret, tokenStore, info.whitelist)
        accts[acct.appId] = acct
      }
    }
    this.accounts = Map<WechatAccount>(accts)
  }
  public async getWechatAccount(appId: string) {
    return this.accounts.get(appId)
  }
  public async getWechatAccounts() {
    return this.accounts.toList()
  }
}
