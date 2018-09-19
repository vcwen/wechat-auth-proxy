import { List } from 'immutable'
import { URL } from 'url'
export interface ISecurityChecker {
  isValidRedirectUri(uri: string): boolean
}

export class SimpleSecurityChecker implements ISecurityChecker {
  private whitelist: List<string>
  constructor(validHosts: string[]) {
    const hosts = validHosts.map((host) => {
      const url = new URL(host)
      return url.hostname
    })
    this.whitelist = List(hosts)
  }
  public isValidRedirectUri(uri: string) {
    const host = new URL(uri).hostname
    return this.whitelist.some((item) => item === host)
  }
}

// tslint:disable-next-line:max-classes-per-file
export class MuteSecurityChecker implements ISecurityChecker {
  public isValidRedirectUri() {
    return true
  }
}
