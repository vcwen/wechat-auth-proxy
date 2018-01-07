import {List} from 'immutable'
import {URL} from 'url'
export interface ISecurityChecker {
  isValidRedirectUri(uri: string): boolean
}

export class SimpleSecurityChecker implements ISecurityChecker {
  private whitelist: List<string>
  constructor(validHosts: string[]) {
    const regex = /^((\w|-)+\.)+(\w|-)+(:\d+)?$/
    const list = List<string>()
    this.whitelist = list.withMutations((mutable) => {
      for (const host of validHosts) {
        if (!regex.test(host)) {
          throw new Error(`Invalid host:${host}.`)
        } else {
          if (host.endsWith(':80')) {
            mutable.push(host.split(':')[0])
          } else {
            mutable.push(host)
          }
        }
      }
    })
  }
  public isValidRedirectUri(uri: string) {
    const host = new URL(uri).host
    const valid = this.whitelist.some((item) => item === host)
    return valid
  }
}

// tslint:disable-next-line:max-classes-per-file
export class MuteSecurityChecker implements ISecurityChecker {
  public isValidRedirectUri(_: string) {
    return true
  }
}
