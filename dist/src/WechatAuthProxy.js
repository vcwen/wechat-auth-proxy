"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// const debug = require('debug')('proxy')
const assert = require("assert");
const WechatOAuth = require("co-wechat-oauth");
const qs = require("querystring");
const url = require("url");
const SecurityCheck_1 = require("./SecurityCheck");
const TokenStore_1 = require("./TokenStore");
class WechatAuthProxy {
    constructor(appId, appSecret, options) {
        assert(appId, 'appId is required');
        assert(appSecret, 'appSecret is required');
        this.appId = appId;
        this.appSecret = appSecret;
        this.authUrl = options.authUrl;
        this.securityCheck = options.securityCheck ? options.securityCheck : new SecurityCheck_1.MuteSecurityCheck();
        const tokenStore = options.tokenStore ? options.tokenStore : new TokenStore_1.MemoryTokenStore();
        this.wechatOauth = new WechatOAuth(appId, appSecret, tokenStore.getAccessToken, tokenStore.saveAccessToken);
    }
    middlewarify() {
        return async (ctx, next) => {
            if (ctx.method === 'GET') {
                switch (ctx.path) {
                    case this.authUrl:
                        return this.auth(ctx);
                    case this.callbackUrl:
                        return this.authCallback(ctx);
                    default:
                        await next();
                }
            }
            else {
                await next();
            }
        };
    }
    async auth(ctx) {
        if (!ctx.session) {
            throw new TypeError('Session is required.');
        }
        const query = ctx.query;
        const redirectUri = query.redirectUri;
        if (!redirectUri) {
            return ctx.throw(400, 'Redirect URI is required.');
        }
        const allowed = await this.securityCheck.isValidRedirectUri(redirectUri);
        if (!allowed) {
            ctx.throw(400, 'Invliad redirect URI.');
        }
        const scope = query.scope || 'snsapi_base';
        const state = query.state || 'proxy';
        ctx.session.redirectUri = redirectUri;
        ctx.session.lang = query.lang || 'zh_CN';
        ctx.redirect(this.wechatOauth.getAuthorizeURL(url.resolve(ctx.href, this.callbackUrl), state, scope));
    }
    async authCallback(ctx) {
        if (!ctx.session) {
            throw new TypeError('Session is required.');
        }
        ctx.status = 301;
        if (!ctx.query.code || ctx.query.code === 'authdeny') {
            return ctx.redirect(ctx.session.redirectUri + '?' + qs.stringify({ reason: 'authdeny' }));
        }
        try {
            const accessToken = await this.wechatOauth.getAccessToken(ctx.query.code);
            const data = accessToken.data;
            const openId = data.openid;
            const query = {
                openid: openId,
                scope: data.scope,
                state: data.state
            };
            if (data.scope === 'snsapi_userinfo') {
                const lang = ctx.session.lang;
                const options = {
                    openid: openId,
                    lang
                };
                const user = await this.wechatOauth.getUser(options);
                Object.assign(query, user);
            }
            ctx.redirect(ctx.session.redirectUri + '?' + qs.stringify(query));
        }
        catch (err) {
            ctx.redirect(ctx.session.redirectUri + '?' + qs.stringify({ reason: 'Internal server error.' }));
        }
    }
}
exports.WechatAuthProxy = WechatAuthProxy;
exports.default = WechatAuthProxy;
