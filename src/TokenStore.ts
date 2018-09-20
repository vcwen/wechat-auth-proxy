import { AccessToken } from './AccessToken'
export interface ITokenStore {
  getAccessToken(openId: string): Promise<AccessToken | undefined>
  saveAccessToken(openId: string, accessToken: AccessToken): Promise<void>
}

export class MemoryTokenStore implements ITokenStore {
  private tokenMap: Map<string, AccessToken>
  constructor() {
    this.tokenMap = new Map()
  }
  public async getAccessToken(openId: string) {
    return this.tokenMap.get(openId)
  }
  public async saveAccessToken(openId: string, accessToken: AccessToken) {
    this.tokenMap.set(openId, accessToken)
  }
}
