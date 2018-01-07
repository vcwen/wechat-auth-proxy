// import {AxiosResponse} from 'axios'
const wechatoauth: any = require.requireActual('co-wechat-oauth')
const dataset = {} as any
wechatoauth.prototype.getAccessToken = (code) => {
      return {
        data: dataset.getAccessToken
      }
    }
wechatoauth.prototype.getUser = (options) => {
     return dataset.getUser
    }

wechatoauth.__setData = (data) => {
  Object.assign(dataset, data)
}
wechatoauth.__setFunc = (name, func) => {
  wechatoauth.prototype[name] = func
}

module.exports = wechatoauth
