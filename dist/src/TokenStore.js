"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MemoryTokenStore {
    async getAccessToken() {
        return this.token;
    }
    async saveAccessToken(token) {
        this.token = token;
    }
}
exports.MemoryTokenStore = MemoryTokenStore;
