export class AccessToken {
  public token: string
  public expireAt: Date
  constructor(token: string, expireAt: Date) {
    this.token = token
    this.expireAt = expireAt
  }
  public isValid() {
    return this.expireAt.getTime() > Date.now()
  }
}
