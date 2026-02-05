// Cloudflare Workers - 网盘解析器
// 支持: 小飞机网盘(feijipan.com) | 蓝奏云优享版(ilanzou.com) | 蓝奏云(lanzou*.com)

// ============================== 配置 ==============================
const CONFIG = {
    cache: false,          // 文件链接缓存 (Workers KV 可用时启用)
    cacheexpired: 2000,   // 缓存时间（秒）
    foldercache: false,   // 缓存文件夹参数

    // 缓存功能暂未实现KV绑定

    "auto-switch": true,  // 自动切换获取方式 (pc/mobile)
    mode: "pc",           // 默认请求方式 (pc/mobile)
    "redirect-url": false  // 重定向下载(单文件)：true=302重定向，false=返回JSON
};

// ============================== AES-128-ECB工具 ==============================
class AES128ECB {
    constructor(key) {
        const encoder = new TextEncoder();
        const keyBytes = encoder.encode(key);
        this.key = new Uint8Array(16);
        
        if (keyBytes.length >= 16) {
            this.key.set(keyBytes.slice(0, 16));
        } else {
            this.key.set(keyBytes);
            for (let i = keyBytes.length; i < 16; i++) {
                this.key[i] = 0;
            }
        }
        
        this.sBox = [
            0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
            0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
            0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
            0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
            0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
            0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
            0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
            0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
            0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
            0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
            0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
            0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
            0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
            0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
            0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
            0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
        ];
        
        this.invSBox = new Array(256);
        for (let i = 0; i < 256; i++) {
            this.invSBox[this.sBox[i]] = i;
        }
        
        this.rCon = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
    }

    subBytes(state) {
        for (let i = 0; i < 16; i++) {
            state[i] = this.sBox[state[i]];
        }
    }

    shiftRows(state) {
        const temp = [...state];
        state[1] = temp[5];
        state[5] = temp[9];
        state[9] = temp[13];
        state[13] = temp[1];
        state[2] = temp[10];
        state[6] = temp[14];
        state[10] = temp[2];
        state[14] = temp[6];
        state[3] = temp[15];
        state[7] = temp[3];
        state[11] = temp[7];
        state[15] = temp[11];
    }

    gmul(a, b) {
        let p = 0;
        for (let i = 0; i < 8; i++) {
            if ((b & 1) !== 0) {
                p ^= a;
            }
            const hiBitSet = (a & 0x80) !== 0;
            a <<= 1;
            if (hiBitSet) {
                a ^= 0x1b;
            }
            b >>= 1;
        }
        return p & 0xff;
    }

    mixColumns(state) {
        for (let i = 0; i < 4; i++) {
            const s0 = state[i * 4];
            const s1 = state[i * 4 + 1];
            const s2 = state[i * 4 + 2];
            const s3 = state[i * 4 + 3];

            state[i * 4] = this.gmul(0x02, s0) ^ this.gmul(0x03, s1) ^ s2 ^ s3;
            state[i * 4 + 1] = s0 ^ this.gmul(0x02, s1) ^ this.gmul(0x03, s2) ^ s3;
            state[i * 4 + 2] = s0 ^ s1 ^ this.gmul(0x02, s2) ^ this.gmul(0x03, s3);
            state[i * 4 + 3] = this.gmul(0x03, s0) ^ s1 ^ s2 ^ this.gmul(0x02, s3);
        }
    }

    addRoundKey(state, roundKey) {
        for (let i = 0; i < 16; i++) {
            state[i] ^= roundKey[i];
        }
    }

    keyExpansion() {
        const expandedKey = new Uint8Array(176);
        expandedKey.set(this.key);

        let bytesGenerated = 16;
        let rconIteration = 1;
        const temp = new Uint8Array(4);

        while (bytesGenerated < 176) {
            for (let i = 0; i < 4; i++) {
                temp[i] = expandedKey[bytesGenerated - 4 + i];
            }

            if (bytesGenerated % 16 === 0) {
                const t = temp[0];
                temp[0] = temp[1];
                temp[1] = temp[2];
                temp[2] = temp[3];
                temp[3] = t;

                for (let i = 0; i < 4; i++) {
                    temp[i] = this.sBox[temp[i]];
                }

                temp[0] ^= this.rCon[rconIteration - 1];
                rconIteration++;
            }

            for (let i = 0; i < 4; i++) {
                expandedKey[bytesGenerated] = expandedKey[bytesGenerated - 16] ^ temp[i];
                bytesGenerated++;
            }
        }

        return expandedKey;
    }

    encryptBlock(input) {
        const state = new Uint8Array(16);
        state.set(input);

        const expandedKey = this.keyExpansion();
        this.addRoundKey(state, expandedKey.slice(0, 16));

        for (let round = 1; round < 10; round++) {
            this.subBytes(state);
            this.shiftRows(state);
            this.mixColumns(state);
            this.addRoundKey(state, expandedKey.slice(round * 16, (round + 1) * 16));
        }

        this.subBytes(state);
        this.shiftRows(state);
        this.addRoundKey(state, expandedKey.slice(160, 176));

        return state;
    }

    pkcs7Pad(data) {
        const blockSize = 16;
        const padding = blockSize - (data.length % blockSize);
        const padded = new Uint8Array(data.length + padding);
        padded.set(data);
        for (let i = data.length; i < padded.length; i++) {
            padded[i] = padding;
        }
        return padded;
    }

    encryptHex(plaintext) {
        const encoder = new TextEncoder();
        const data = encoder.encode(plaintext);
        const padded = this.pkcs7Pad(data);
        
        let result = '';
        for (let i = 0; i < padded.length; i += 16) {
            const block = padded.slice(i, i + 16);
            const encrypted = this.encryptBlock(block);
            for (let j = 0; j < 16; j++) {
                result += encrypted[j].toString(16).padStart(2, '0');
            }
        }
        
        return result.toLowerCase();
    }
}

// ============================== 工具函数 ==============================
function generateUUID() {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ-_';
    let result = '';
    for (let i = 0; i < 21; i++) {
        result += chars[Math.floor(Math.random() * 64)];
    }
    return result;
}

function getTimestamp() {
    return Date.now();
}

// ============================== acw_sc_v2 生成 ==============================
function acwScV2Simple(arg1) {
    const posList = [15,35,29,24,33,16,1,38,10,9,19,31,40,27,22,23,25,13,6,11,39,18,20,8,14,21,32,26,2,30,7,4,17,5,3,28,34,37,12,36];
    const mask = '3000176000856006061501533003690027800375';
    const outPutList = new Array(40).fill('');
    
    for (let i = 0; i < arg1.length; i++) {
        const char = arg1[i];
        for (let j = 0; j < posList.length; j++) {
            if (posList[j] === i + 1) {
                outPutList[j] = char;
            }
        }
    }
    
    const arg2 = outPutList.join('');
    let result = '';
    const length = Math.min(arg2.length, mask.length);
    
    for (let i = 0; i < length; i += 2) {
        const strHex = arg2.substr(i, 2);
        const maskHex = mask.substr(i, 2);
        const xorResult = (parseInt(strHex, 16) ^ parseInt(maskHex, 16)).toString(16);
        result += xorResult.padStart(2, '0');
    }
    
    return result;
}

// ============================== 小飞机网盘解析器 ==============================
class FeijipanParser {
    constructor(shareLinkInfo) {
        this.shareLinkInfo = shareLinkInfo;
        this.uuid = generateUUID();
        this.aes = new AES128ECB('dingHao-disk-app');
    }

    async encrypt2hex(source) {
        return this.aes.encryptHex(String(source));
    }

    async parse() {
        const shareId = this.shareLinkInfo.shareKey;
        const ts = getTimestamp();
        const tsEncode = await this.encrypt2hex(String(ts));

        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Origin': 'https://www.feijix.com',
            'Referer': 'https://www.feijix.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
        };

        const vipUrl = `https://api.feejii.com/ws/buy/vip/list?devType=6&devModel=Chrome&uuid=${this.uuid}&extra=2&timestamp=${tsEncode}`;
        try {
            await fetch(vipUrl, { method: 'POST', headers });
        } catch (e) {}

        let apiUrl = `https://api.feejii.com/ws/recommend/list?devType=6&devModel=Chrome&uuid=${this.uuid}&extra=2&timestamp=${tsEncode}&shareId=${shareId}&type=0&offset=1&limit=60`;
        if (this.shareLinkInfo.sharePassword) {
            apiUrl += `&code=${this.shareLinkInfo.sharePassword}`;
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const resJson = await response.json();

        if (!resJson || resJson.code !== 200) {
            throw new Error(resJson?.msg || '请求失败');
        }

        if (!resJson.list || !resJson.list[0] || !resJson.list[0].fileList) {
            throw new Error('文件列表为空');
        }

        const fileInfo = resJson.list[0];
        const fileList = fileInfo.fileList[0];
        const fileId = fileInfo.fileIds;
        const fileName = fileList.fileName || fileInfo.fileName || '未知文件';
        const fileSize = fileList.fileSize || fileInfo.fileSize || '';

        if (fileList.fileType === 2) {
            return {
                download_url: null,
                file_id: fileId,
                file_name: fileName,
                file_size: fileSize,
                is_folder: true,
                folder_id: fileList.folderId
            };
        }

        const userId = fileInfo.userId;
        const nowTs2 = getTimestamp();
        const tsEncode2 = await this.encrypt2hex(String(nowTs2));
        const userIdStr = userId !== null ? String(userId) : 'null';
        
        const fidEncode = await this.encrypt2hex(`${fileId}|${userIdStr}`);
        const auth = await this.encrypt2hex(`${fileId}|${nowTs2}`);

        const redirectUrl = `https://api.feejii.com/ws/file/redirect?downloadId=${fidEncode}&enable=1&devType=6&uuid=${this.uuid}&timestamp=${tsEncode2}&auth=${auth}&shareId=${shareId}`;

        const redirectResponse = await fetch(redirectUrl, {
            method: 'GET',
            headers: headers,
            redirect: 'manual'
        });

        const downloadUrl = redirectResponse.headers.get('Location');
        if (!downloadUrl) {
            throw new Error('未获取到下载链接');
        }

        return {
            download_url: downloadUrl,
            file_id: fileId,
            file_name: fileName,
            file_size: fileSize,
            is_folder: false
        };
    }

    extractShareKey(url) {
        const patterns = [
            /share\.feijipan\.com\/#\/s\/([a-zA-Z0-9]+)/,
            /share\.feijipan\.com\/s\/([a-zA-Z0-9]+)/,
            /feijipan\.com\/s\/([a-zA-Z0-9]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }

        if (/^[a-zA-Z0-9]+$/.test(url)) {
            return url;
        }

        throw new Error('无法从链接中提取分享ID');
    }
}

// ============================== 蓝奏云优享版解析器 ==============================
class IlanzouParser {
    constructor() {
        this.aesKey = 'lanZouY-disk-app';
        this.aes = new AES128ECB(this.aesKey);
    }

    async parse(url, pwd = '') {
        try {
            const shareId = this.extractShareId(url);
            if (!shareId) {
                return { code: 400, msg: '无效的分享链接', data: null };
            }

            const uuid = generateUUID();
            const timestamp = getTimestamp();
            const encryptedTimestamp = this.aes.encryptHex(String(timestamp));

            const apiUrl = this.buildApiUrl(shareId, pwd, uuid, encryptedTimestamp);
            const fileInfo = await this.getFileInfo(apiUrl, uuid, pwd);

            if (fileInfo.error) {
                return { code: 400, msg: fileInfo.msg, data: null };
            }

            if (fileInfo.need_password) {
                return pwd ? 
                    { code: 400, msg: '密码错误', data: null } : 
                    { code: 201, msg: '请输入密码', data: null };
            }

            const fileId = fileInfo.fileIds || fileInfo.fileId || fileInfo.id || '';
            const fileName = fileInfo.fileName || fileInfo.name || '';
            const fileSize = fileInfo.fileSize || fileInfo.size || '';

            if (!fileId) {
                return { code: 400, msg: '文件信息获取失败', data: null };
            }

            if (!fileName && !fileSize && !pwd) {
                return { code: 201, msg: '请输入密码', data: null };
            }

            const downloadUrl = await this.getDownloadUrl(fileInfo, uuid);

            if (!downloadUrl) {
                return { code: 400, msg: '获取下载链接失败', data: null };
            }

            return {
                code: 200,
                msg: '解析成功',
                shareKey: 'iz:' + shareId,
                data: {
                    file_id: fileId,
                    file_name: fileName || this.extractFilenameFromUrl(downloadUrl),
                    file_size: fileSize,
                    download_url: downloadUrl
                }
            };

        } catch (e) {
            return { code: 500, msg: '解析失败: ' + e.message, data: null };
        }
    }

    extractShareId(url) {
        url = url.trim();
        const match = url.match(/ilanzou\.com\/s\/([a-zA-Z0-9]+)/);
        if (match) return match[1];

        const parts = url.replace(/\/+$/, '').split('/');
        let lastPart = parts[parts.length - 1] || '';
        const queryIndex = lastPart.indexOf('?');
        if (queryIndex !== -1) {
            lastPart = lastPart.substring(0, queryIndex);
        }
        return lastPart;
    }

    buildApiUrl(shareId, pwd, uuid, encryptedTimestamp) {
        const params = new URLSearchParams({
            devType: '6',
            devModel: 'Chrome',
            uuid: uuid,
            extra: '2',
            timestamp: encryptedTimestamp,
            shareId: shareId,
            type: '0',
            offset: '1',
            limit: '60'
        });

        if (pwd) {
            params.append('code', pwd);
        }

        return `https://api.ilanzou.com/unproved/recommend/list?${params.toString()}`;
    }

    async getFileInfo(apiUrl, uuid, providedPwd = '') {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Referer': 'https://www.ilanzou.com/',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
        };

        try {
            const response = await fetch(apiUrl, { headers });
            const data = await response.json();

            if (data.msg && data.msg !== '成功') {
                const errorMsg = data.msg;
                if (errorMsg.includes('密码') || errorMsg.includes('提取码')) {
                    return { need_password: true, msg: errorMsg };
                }
                return { error: true, msg: errorMsg };
            }

            if (!data.list || data.list.length === 0) {
                return { error: true, msg: '未找到文件信息' };
            }

            let item = data.list[0];
            if (item.fileList && Array.isArray(item.fileList) && item.fileList.length > 0) {
                Object.assign(item, item.fileList[0]);
            }

            return item;
        } catch (e) {
            return { error: true, msg: '请求失败: ' + e.message };
        }
    }

    extractFilenameFromUrl(downloadUrl) {
        try {
            const url = new URL(downloadUrl);
            const filename = url.searchParams.get('filename');
            return filename ? decodeURIComponent(filename) : '';
        } catch (e) {
            return '';
        }
    }

    async getDownloadUrl(fileInfo, uuid) {
        const fileIds = String(fileInfo.fileIds || fileInfo.fileId || fileInfo.id || '');
        if (!fileIds) return '';

        const timestamp = getTimestamp();
        const encryptedTimestamp = this.aes.encryptHex(String(timestamp));

        const auth = this.aes.encryptHex(`${fileIds}|${timestamp}`);
        const downloadId = this.aes.encryptHex(`${fileIds}|`);

        const redirectUrl = `https://api.ilanzou.com/unproved/file/redirect?` + new URLSearchParams({
            downloadId: downloadId,
            enable: '1',
            devType: '6',
            uuid: uuid,
            timestamp: encryptedTimestamp,
            auth: auth
        }).toString();

        try {
            const response = await fetch(redirectUrl, {
                headers: {
                    'Referer': 'https://www.ilanzou.com/',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                redirect: 'manual'
            });

            const location = response.headers.get('Location');
            if (location) return location;

            const text = await response.text();
            const match = text.match(/https?:\/\/[^\s"']+/i);
            return match ? match[0] : '';
        } catch (e) {
            return '';
        }
    }
}

// ============================== 蓝奏云解析器 ==============================
class LanzouParser {
    constructor() {
        this.mobileUA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36';
        this.desktopUA = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36';
        this.apiDomain = 'www.lanzoui.com';
        this.autoSwitch = CONFIG["auto-switch"];
        this.mode = CONFIG.mode;
    }

    async parse(url, pwd = '') {
        try {
            const id = this.extractId(url);
            if (!id) {
                return { code: 400, msg: '无效的分享链接', data: null };
            }

            let result;
            if (this.mode === "mobile") {
                result = await this.mobileMode(id, pwd);
                if (this.autoSwitch && result.code !== 200 && result.code !== 401) {
                    result = await this.pcMode(id, pwd);
                }
            } else {
                result = await this.pcMode(id, pwd);
                if (this.autoSwitch && result.code !== 200 && result.code !== 401) {
                    result = await this.mobileMode(id, pwd);
                }
            }

            return result;

        } catch (e) {
            return { code: 500, msg: '解析失败: ' + e.message, data: null };
        }
    }

    extractId(url) {
        const match = url.match(/(?:lanzou[a-z]{0,2}\.com)\/(?:tp\/)?([a-zA-Z0-9_\-]+)/i);
        return match ? match[1].split('?')[0] : null;
    }

    async pcMode(id, pwd) {
        const headers = { 'User-Agent': this.desktopUA };
        
        let data = await this.request(`https://${this.apiDomain}/${id}`, 'GET', null, headers, 'data');
        if (!data) return this.createResponse(500, "获取失败", null);
        
        data = data.replace(/<!--[\s\S]*?-->/g, '');
        
        const jsMatch = data.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        let js = jsMatch ? jsMatch.map(m => m.replace(/<script[^>]*>|<\/script>/gi, '')).join('\n').trim() : "";
        
        const errorMatch = data.match(/<\/div><\/div>(.+)<\/div>/);
        const error = errorMatch ? errorMatch[1].replace(/<[^>]+>/g, '') : "获取失败";
        
        if (js.includes("/filemoreajax.php")) {
            return await this.handleFolder(data, js, id, pwd);
        }
        
        const iframeMatch = data.match(/<iframe[^>]*src="(.+?)"/);
        if (iframeMatch) {
            const data2 = await this.request(`https://${this.apiDomain}${iframeMatch[1]}`, 'GET', null, headers, 'data');
            const jsurlMatch = data2.match(/https?:\/\/waf\.woozooo\.com\/pc\/.+?\.js/);
            js = jsurlMatch ? await this.request(jsurlMatch[0], 'GET', null, headers, 'data') : data2;
        }
        
        if (!js) return this.createResponse(501, error, null);
        
        const fileinfoMatch = data.match(/<meta\s+name=["']description["']\s+content=["']([^"]*?)["']/);
        const fileinfo = fileinfoMatch ? fileinfoMatch[1] : "";
        
        const info = {};
        
        const namePatterns = [
            /<div class="n_box_3fn"[^>]*>([^<]+)<\/div>/,
            /<div style="font[^>]*>([^<]+)<\/div>/,
            /class="b">.*?<span>([^<]+)</
        ];
        for (const pattern of namePatterns) {
            const match = data.match(pattern);
            if (match) {
                info.name = this.htmlspecialcharsDecode(match[1]);
                break;
            }
        }
        
        const sizeMatch1 = fileinfo.match(/(?:文件)?大小：([^|]+?)(?:\||$)/);
        if (sizeMatch1) info.size = sizeMatch1[1].trim();
        
        if (!info.size) {
            const sizeMatch2 = data.match(/<div class="n_filesize">大小：(.+?)<\/div>/);
            if (sizeMatch2) info.size = sizeMatch2[1];
        }
        
        if (!info.size) {
            const sizeMatch3 = data.match(/文件大小：<\/span>([^<]+)</);
            if (sizeMatch3) info.size = sizeMatch3[1];
        }
        
        const userMatch1 = data.match(/<span class="user-name">([^<]+)<\/span>/);
        if (userMatch1) info.user = userMatch1[1];
        
        if (!info.user) {
            const userMatch2 = data.match(/<font[^>]*>([^<]+)<\/font>/);
            if (userMatch2) info.user = userMatch2[1];
        }
        
        const timeMatch1 = data.match(/<span class="n_file_infos">([^<]+)<\/span>\s*<span class="n_file_infos">/);
        if (timeMatch1) info.time = timeMatch1[1];
        
        if (!info.time) {
            const timeMatch2 = data.match(/<span class="p7">上传时间：<\/span>([^<]+)<br>/);
            if (timeMatch2) info.time = timeMatch2[1];
        }
        
        const descMatch1 = fileinfo.match(/\|(.+)$/);
        if (descMatch1) info.desc = this.htmlspecialcharsDecode(descMatch1[1].trim());
        
        if (!info.desc) {
            const descMatch2 = data.match(/<div class="n_box_des">([\s\S]+?)<\/div>/);
            if (descMatch2) info.desc = this.htmlspecialcharsDecode(descMatch2[1].replace(/<br\s*\/?>\s*/gi, '\n').replace(/<[^>]+>/g, '').trim());
        }
        
        if (!info.desc) {
            const descMatch3 = data.match(/文件描述：<\/span><br>\s*([^<]+)/);
            if (descMatch3) info.desc = this.htmlspecialcharsDecode(descMatch3[1].trim());
        }
        
        if (!info.desc) info.desc = "";
        
        const iconMatch = data.match(/https?:\/\/image\.woozooo\.com\/image\/ico\/.+?(?=")/);
        info.icon = iconMatch ? iconMatch[0] : null;
        
        const avatarMatch = data.match(/https?:\/\/image\.woozooo\.com\/image\/userimg\/.+?(?=\))/);
        info.avatar = avatarMatch ? avatarMatch[0] : null;
        
        return await this.getUrl(js, info, error, pwd, id);
    }

    async mobileMode(id, pwd) {
        const headers = { 'User-Agent': this.mobileUA };
        
        let data = await this.request(`https://${this.apiDomain}/${id}`, 'GET', null, headers, 'data');
        if (!data) return this.createResponse(500, "获取失败", null);
        
        data = data.replace(/<!--[\s\S]*?-->/g, '');
        
        const jsMatch = data.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        let js = jsMatch ? jsMatch.map(m => m.replace(/<script[^>]*>|<\/script>/gi, '')).join('\n').trim() : "";
        
        if (js.includes("/filemoreajax.php")) {
            return await this.handleFolder(data, js, id, pwd);
        }
        
        let data2 = null;
        let datar = data;
        
        let url = null;
        const urlMatch = js.match(/\?[^'"\s]+/);
        if (urlMatch && urlMatch[0].startsWith('?')) {
            url = urlMatch[0];
        } else {
            let hasMatch = false;
            let id2 = null;
            
            const jstpMatch = data.match(/https?:\/\/waf\.woozooo\.com\/tp\/.+?\.js/);
            if (jstpMatch) {
                const tempData = await this.request(jstpMatch[0], 'GET', null, headers, 'data');
                const id2Match = tempData.match(/tp\/([\w?&=]+)/);
                if (id2Match) {
                    id2 = id2Match[1];
                    hasMatch = true;
                }
            }
            
            if (!hasMatch) {
                const id2Match = data.match(/tp\/([\w?&=]+)/);
                if (id2Match) {
                    id2 = id2Match[1];
                    hasMatch = true;
                }
            }
            
            if (!hasMatch) {
                const redirectInfo = await this.request(`https://${this.apiDomain}/${id}`, 'GET', null, { 'User-Agent': 'MicroMessenger' }, 'info');
                if (redirectInfo.redirect_url) {
                    const secondInfo = await this.request(redirectInfo.redirect_url, 'GET', null, headers, 'info');
                    if (secondInfo.redirect_url) {
                        const id2Match = secondInfo.redirect_url.match(/\.com\/([\w?&=]+)/);
                        if (id2Match) {
                            id2 = id2Match[1];
                            hasMatch = true;
                        }
                    }
                }
            }
            
            if (hasMatch && id2) {
                data2 = await this.request(`https://${this.apiDomain}/tp/${id2}`, 'GET', null, headers, 'data');
                if (data2) {
                    data2 = data2.replace(/<!--[\s\S]*?-->/g, '');
                    datar = data2;
                    const js2Match = data2.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
                    const js2 = js2Match ? js2Match.map(m => m.replace(/<script[^>]*>|<\/script>/gi, '')).join('\n').trim() : null;
                    if (js2) {
                        const url2Match = js2.match(/\?[^'"\s]+/);
                        if (url2Match && url2Match[0].startsWith('?')) url = url2Match[0];
                    }
                }
            }
        }
        
        const errorMatch = data.match(/<\/div><\/div>(.+)<\/div>/);
        const error = errorMatch ? errorMatch[1].replace(/<[^>]+>/g, '') : "获取失败";
        
        if (!js) return this.createResponse(501, error, null);
        
        const fileinfoMatch = data.match(/<meta\s+name=["']description["']\s+content=["']([^"]*?)["']/);
        const fileinfo = fileinfoMatch ? fileinfoMatch[1] : "";
        
        const info = {};
        
        if (data2) {
            const titleMatch = data2.match(/<title>(.+)<\/title>/);
            if (titleMatch) info.name = this.htmlspecialcharsDecode(titleMatch[1]);
            
            if (!info.name) {
                const mdMatch = data2.match(/<div class="md">(.+?)\s*<span class="mtt">/);
                if (mdMatch) info.name = this.htmlspecialcharsDecode(mdMatch[1]);
            }
        }
        
        if (!info.name) {
            const nameMatch = data.match(/<div class="(?:md|appname)">(.+?)\s*</);
            if (nameMatch) info.name = this.htmlspecialcharsDecode(nameMatch[1]);
        }
        
        const sizeMatch1 = fileinfo.match(/(?:文件)?大小：([^|]+?)(?:\||$)/);
        if (sizeMatch1) info.size = sizeMatch1[1].trim();
        
        if (!info.size) {
            const sizeMatch2 = data.match(/>下载\s*\(\s*(.+?)\s*\)<\/a>/);
            if (sizeMatch2) info.size = sizeMatch2[1];
        }
        
        if (!info.size && data2) {
            const sizeMatch3 = data2.match(/mtt">\(\s*(.+?)\s*\)/);
            if (sizeMatch3) info.size = sizeMatch3[1];
        }
        
        const userMatch1 = data.match(/分享者?:<\/span>(.+?)(?:\s|<)/);
        if (userMatch1) info.user = userMatch1[1].trim();
        
        if (!info.user) {
            const userMatch2 = data.match(/<div class="user-name">(.+?)</);
            if (userMatch2) info.user = userMatch2[1];
        }
        
        if (!info.user && data2) {
            const userMatch3 = data2.match(/(?:发布|分享)者:<\/span>(.+?)(?:\s|<span)/);
            if (userMatch3) info.user = userMatch3[1].trim();
        }
        
        const timePatterns = [
            /<span class="mt2"><\/span>(.+?)<span class="mt2">/,
            /<span class="appinfotime">(.+?)</
        ];
        for (const pattern of timePatterns) {
            const match = data.match(pattern);
            if (match) {
                info.time = match[1].trim();
                break;
            }
        }
        
        if (!info.time && data2) {
            const timeMatch = data2.match(/<span class="mt2">时间:<\/span>(.+?)<span class="mt2">/);
            if (timeMatch) info.time = timeMatch[1].trim();
        }
        
        const descMatch1 = fileinfo.match(/\|(.+)$/);
        if (descMatch1) info.desc = this.htmlspecialcharsDecode(descMatch1[1].trim());
        
        if (!info.desc) {
            const descMatch2 = data.match(/<div class="appdes">([\s\S]+?)<\/div>/);
            if (descMatch2) info.desc = this.htmlspecialcharsDecode(descMatch2[1].replace(/<br\s*\/?>\s*/gi, '\n').replace(/<[^>]+>/g, '').trim());
        }
        
        if (!info.desc && data2) {
            const descMatch3 = data2.match(/<div class="mdo">([\s\S]+?)<\/div>/);
            if (descMatch3 && !descMatch3[1].includes("<span>")) {
                info.desc = this.htmlspecialcharsDecode(descMatch3[1].replace(/<br\s*\/?>\s*/gi, '\n').replace(/<[^>]+>/g, '').trim());
            }
        }
        
        if (!info.desc) info.desc = "";
        
        const iconMatch = data.match(/https?:\/\/image\.woozooo\.com\/image\/ico\/.+?(?=\))/);
        info.icon = iconMatch ? iconMatch[0] : null;
        
        const avatarMatch = data.match(/https?:\/\/image\.woozooo\.com\/image\/userimg\/.+?(?=\))/);
        info.avatar = avatarMatch ? avatarMatch[0] : null;
        
        if (url) {
            const domMatch = datar.match(/https?:\/\/.+?(?=['"])/);
            info.url = domMatch ? domMatch[0] + url : null;
        } else {
            const appitemMatch = js.match(/appitem\s*=\s*'(.+?)';/);
            if (appitemMatch) info.url = appitemMatch[1];
        }
        
        const fileidMatch = datar.match(/\?f=(\d+)/);
        const fileid = fileidMatch ? parseInt(fileidMatch[1]) : null;
        info.fid = fileid;
        
        const shareKey = id.match(/([a-zA-Z0-9]+)$/)?.[1] || id;
        const globalShareKey = "lz:" + shareKey;
        
        if (info.url) {
            return await this.getDirectLink(info, globalShareKey);
        } else {
            const appMatch = js.match(/appitem\s*=\s*'(.+?)';/);
            if (appMatch) {
                info.url = appMatch[1];
                return await this.getDirectLink(info, globalShareKey);
            } else {
                return await this.getUrl(js, info, error, pwd, id);
            }
        }
    }

    async getUrl(js, info, error, pwd, id) {
        const cleanedData = js.replace(/\/\/.*|\/\*[\s\S]*?\*\//g, '');
        
        const fileIdMatch = cleanedData.match(/file=(\d+)/);
        const fileid = fileIdMatch ? parseInt(fileIdMatch[1]) : null;
        info.fid = fileid;
        
        if (cleanedData.includes("document.getElementById('pwd').value;") && !pwd) {
            info.download_url = null;
            
            const shareKey = id.match(/([a-zA-Z0-9]+)$/)?.[1] || id;
            const globalShareKey = "lz:" + shareKey;
            
            return this.createResponse(401, "请输入密码", info, globalShareKey);
        }
        
        let sign = null;
        
        const signMatch1 = cleanedData.match(/'sign':'(\w+)'/);
        if (signMatch1) {
            sign = signMatch1[1];
        }
        
        if (!sign) {
            const signVarMatch = cleanedData.match(/'sign':(\w+),/);
            if (signVarMatch) {
                const varName = signVarMatch[1];
                const varPattern = new RegExp(`${varName}\\s*=\\s*'(.*?)'`, 'g');
                const matches = [...cleanedData.matchAll(varPattern)];
                if (matches.length > 0) {
                    const values = matches.map(m => m[1]).filter(Boolean);
                    if (values.length > 0) {
                        sign = values.reduce((a, b) => a.length < b.length ? a : b);
                    }
                }
            }
        }
        
        if (!sign) {
            const cMatches = cleanedData.match(/'(\w+?_c)'/g);
            if (cMatches) {
                const values = cMatches.map(m => m.replace(/'/g, ''));
                if (values.length > 0) {
                    sign = values.reduce((a, b) => a.length < b.length ? a : b);
                }
            }
        }
        
        if (!sign) {
            const longMatches = cleanedData.match(/'([\w]{50,})'/g);
            if (longMatches) {
                const values = longMatches.map(m => m.replace(/'/g, ''));
                if (values.length > 0) {
                    sign = values.reduce((a, b) => a.length > b.length ? a : b);
                }
            }
        }
        
        if (!sign) {
            return this.createResponse(501, error || "获取失败", null);
        }
        
        const websignMatch = cleanedData.match(/'([0-9])'/);
        const websign = websignMatch ? websignMatch[1] : "";
        
        const websignkeyMatch = cleanedData.match(/'([a-zA-Z0-9]{4})'/);
        const websignkey = websignkeyMatch ? websignkeyMatch[1] : "";
        
        const postData = {
            action: 'downprocess',
            sign: sign,
            p: pwd,
            websign: websign,
            websignkey: websignkey
        };
        
        const ajaxResponse = await this.request(
            `https://${this.apiDomain}/ajaxm.php?file=${fileid}`,
            'POST',
            postData,
            { 'User-Agent': this.desktopUA },
            'data'
        );
        
        let json;
        try {
            json = JSON.parse(ajaxResponse);
        } catch (e) {
            json = { zt: 0 };
        }
        
        if (json.zt === 1) {
            if (json.inf) info.name = json.inf;
            
            const shareKey = id.match(/([a-zA-Z0-9]+)$/)?.[1] || id;
            const globalShareKey = "lz:" + shareKey;
            
            info.url = json.dom + '/file/' + json.url;
            return await this.getDirectLink(info, globalShareKey);
        } else {
            info.download_url = null;
            
            const shareKey = id.match(/([a-zA-Z0-9]+)$/)?.[1] || id;
            const globalShareKey = "lz:" + shareKey;
            
            return this.createResponse(502, json.inf || "获取失败", info, globalShareKey);
        }
    }

    async getDirectLink(info, globalShareKey) {
        const headers = {
            'User-Agent': this.desktopUA,
            'Cookie': 'down_ip=1'
        };
        
        let requestData = await this.request(info.url, 'GET', null, headers, 'all');
        let url = requestData.info.redirect_url;
        
        const argMatch = requestData.data.match(/arg1='(.+?)'/);
        if (argMatch) {
            headers.Cookie += `; acw_sc__v2=${acwScV2Simple(argMatch[1])}`;
            const newRequest = await this.request(info.url, 'GET', null, headers, 'info');
            url = newRequest.redirect_url;
        }
        
        if (!url) {
            headers['User-Agent'] = this.mobileUA;
            const mobileRequest = await this.request(info.url, 'GET', null, headers, 'all');
            
            if (mobileRequest.data) {
                const aMatch = mobileRequest.data.match(/<a\s+href="(.+?)"/);
                if (aMatch) {
                    url = aMatch[1];
                } else {
                    url = mobileRequest.info.redirect_url;
                    if (url && url.startsWith('itms-services://')) {
                        const plistMatch = url.match(/&url=(.+)/);
                        if (plistMatch) {
                            const plistData = await this.request(plistMatch[1], 'GET', null, { 'User-Agent': this.mobileUA }, 'data');
                            const cdataMatch = plistData.match(/<!\[CDATA\[(.+)\]\]>/);
                            if (cdataMatch) url = cdataMatch[1];
                        }
                    }
                }
            }
        }
        
        if (!url) {
            return this.createResponse(201, "获取链接失败", info, globalShareKey);
        }
        
        info.download_url = url;
        
        if (!info.time) {
            const timeMatch = url.match(/(?!(0000))\d{4}\/(?:0[1-9]|1[0-2])\/(?:0[1-9]|[12]\d|3[01])/);
            if (timeMatch) {
                info.time = timeMatch[0].replace(/\//g, '-');
            }
        }
        
        const timestamp = Date.now();
        const expiresTimestamp = timestamp + (24 * 60 * 60 * 1000);
        const expiresDate = new Date(expiresTimestamp).toISOString().replace('T', ' ').split('.')[0];
        info.expires = expiresDate;
        info.expiration = expiresTimestamp;
        
        const standardInfo = {
            file_id: info.fid || null,
            file_name: info.name || null,
            file_size: info.size || null,
            download_url: info.download_url || null,
            expires: info.expires || null,
            expiration: info.expiration || null
        };
        
        return this.createResponse(200, "成功", standardInfo, globalShareKey);
    }

    async handleFolder(data, js, id, pwd, page = 1) {
        const arrMatch = js.match(/data\s*:\s*\{([\s\S]*?)\},/);
        if (!arrMatch) {
            return this.createResponse(501, "获取失败", null);
        }
        
        const parameter = {};
        const lines = arrMatch[1].split('\n');
        
        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            
            const kvMatch = trimmed.match(/^'([^']+)':\s*(?:(\d+)|'([^']*)'),?$/);
            if (kvMatch) {
                const key = kvMatch[1];
                const value = kvMatch[2] !== undefined ? parseInt(kvMatch[2]) : kvMatch[3];
                parameter[key] = value;
            }
        }
        
        const info = {
            fid: parseInt(parameter.fid) || 0,
            uid: parseInt(parameter.uid) || 0
        };
        
        const titleVarMatch = js.match(/document\.title\s*=\s*([^;]+);/);
        if (titleVarMatch) {
            const varName = titleVarMatch[1].trim();
            const nameMatch = js.match(new RegExp(`${varName}\\s*=\\s*'(.*?)'`));
            if (nameMatch) {
                info.name = this.htmlspecialcharsDecode(nameMatch[1]);
            }
        }
        
        if (!info.name) {
            const namePatterns = [
                /class="b">([^<]+)</,
                /user-title">([^<]+)</,
                /<title>([^-]+)-\s*蓝奏云/
            ];
            for (const pattern of namePatterns) {
                const match = data.match(pattern) || js.match(pattern);
                if (match) {
                    info.name = this.htmlspecialcharsDecode(match[1].trim());
                    break;
                }
            }
        }
        
        const descPatterns = [
            /说<\/span>([\s\S]*?)<\/div>/,
            /id="filename">([\s\S]*?)<\/div>/,
            /user-radio-0"><\/div>([\s\S]*?)<\/div>/
        ];
        
        for (const pattern of descPatterns) {
            const match = data.match(pattern);
            if (match && match[1]) {
                info.desc = match[1].replace(/<[^>]+>/g, '');
                info.desc = this.htmlspecialcharsDecode(info.desc.trim());
                break;
            }
        }
        if (!info.desc) info.desc = '';
        
        const folderSplit = data.split(/<div class="pc-folderlink">|<div class="mbx mbxfolder">/);
        info.folder = [];
        if (folderSplit.length > 1) {
            for (let i = 1; i < folderSplit.length; i++) {
                const f = folderSplit[i];
                const fiMatch = f.match(/href="\/([^"]+)"/);
                if (fiMatch) {
                    const fnMatch = f.match(/filename">([^<]+)</) || f.match(new RegExp(`href="/${fiMatch[1]}">([^<]+)<`));
                    const fdMatch = f.match(/(?:filesize|pc-folderlinkdes)">([\s\S]*?)</);
                    info.folder.push({
                        id: fiMatch[1],
                        name: fnMatch ? this.htmlspecialcharsDecode(fnMatch[1]) : null,
                        desc: fdMatch ? this.htmlspecialcharsDecode(fdMatch[1].replace(/<[^>]+>/g, '')) : null
                    });
                }
            }
        }
        
        parameter.pg = page;
        parameter.pwd = pwd;
        
        if (js.includes("document.getElementById('pwd').value;") && !pwd) {
            info.list = null;
            
            const shareKey = id.match(/([a-zA-Z0-9]+)$/)?.[1] || id;
            const globalShareKey = "lz:" + shareKey;
            
            return this.createResponse(401, "请输入密码", info, globalShareKey);
        }
        
        if (page === 2) {
            parameter.pg = 0;
        }
        
        return await this.getFolderFiles(info, parameter, id);
    }

    async getFolderFiles(info, parameter, id) {
        const headers = { 'User-Agent': this.desktopUA };
        
        const postData = new URLSearchParams(parameter).toString();
        const response = await this.request(`https://${this.apiDomain}/filemoreajax.php`, 'POST', postData, {
            ...headers,
            'Content-Type': 'application/x-www-form-urlencoded'
        }, 'data');
        
        let json;
        try {
            json = JSON.parse(response);
        } catch (e) {
            json = { zt: 0, info: "解析失败" };
        }
        
        const shareKey = id.match(/([a-zA-Z0-9]+)$/)?.[1] || id;
        const globalShareKey = "lz:" + shareKey;
        
        if (Array.isArray(json.text)) {
            info.list = [];
            for (const v of json.text) {
                if (v.id !== "-1") {
                    info.list.push({
                        id: v.id,
                        ad: !!v.t,
                        name: this.htmlspecialcharsDecode(v.name_all),
                        size: v.size,
                        time: v.time,
                        icon: v.p_ico ? `https://image.woozooo.com/image/ico/${v.ico}?x-oss-process=image/auto-orient,1/resize,m_fill,w_100,h_100/format,png` : null
                    });
                }
            }
            info.have_page = json.text.length >= 50;
            
            return this.createResponse(200, "成功", info, globalShareKey);
        } else if (json.zt === 2) {
            info.list = [];
            info.have_page = false;
            
            return this.createResponse(200, "没有文件", info, globalShareKey);
        } else {
            info.list = null;
            info.have_page = false;
            
            return this.createResponse(502, json.info || "获取失败", info, globalShareKey);
        }
    }

    async request(url, method = 'GET', postdata = null, headers = {}, responseType = 'all') {
        const defaultHeaders = {
            'Referer': `https://${this.apiDomain}/`,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Language': 'zh-CN;q=0.9,zh-HK;q=0.8,zh-TW;q=0.7',
            'Cache-Control': 'max-age=0',
            'X-Forwarded-For': '0.0.0.0'
        };
        
        const allHeaders = { ...defaultHeaders, ...headers };
        
        const fetchOptions = {
            method: method.toUpperCase(),
            headers: allHeaders,
            redirect: 'manual'
        };
        
        if (postdata && method.toUpperCase() === 'POST') {
            fetchOptions.body = typeof postdata === 'string' ? postdata : new URLSearchParams(postdata).toString();
            allHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
        }
        
        const response = await fetch(url, fetchOptions);
        
        const result = {
            data: null,
            info: {
                url: response.url,
                status: response.status,
                redirect_url: response.headers.get('location')
            }
        };
        
        if (responseType !== 'info') {
            result.data = await response.text();
        }
        
        if (responseType === 'data') return result.data;
        if (responseType === 'info') return result.info;
        return result;
    }

    createResponse(code, msg, data, globalShareKey = null) {
        const success = [200, 201, 401].includes(code);
        
        const responseData = {
            code: code,
            msg: msg,
            success: success,
            data: data
        };
        
        if (code === 200 && globalShareKey) {
            responseData.shareKey = globalShareKey;
        }
        
        return responseData;
    }

    htmlspecialcharsDecode(text) {
        if (!text) return text;
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#039;': "'",
            '&apos;': "'",
            '&#39;': "'"
        };
        return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&apos;|&#39;/g, match => entities[match] || match);
    }
}

// ============================== 处理响应 ==============================


function handleResponse(result, type, configRedirect) {
    // 是否使用302重定向
    let shouldRedirect = false;
    
    if (type === 'down') {
        shouldRedirect = true;
    } else if (type === 'json') {
        shouldRedirect = false;
    } else {
        shouldRedirect = configRedirect;
    }
    
    // 检查是否可以重定向
    const canRedirect = result.code === 200 && 
                       result.data && 
                       result.data.download_url && 
                       !result.data.is_folder &&
                       !result.data.list; // 不是文件夹列表
    
    if (shouldRedirect && canRedirect) {
        return new Response(null, {
            status: 302,
            headers: {
                'Location': result.data.download_url,
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'no-cache'
            }
        });
    }
    
    const corsHeaders = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    };
    
    return new Response(JSON.stringify(result, null, 2), {
        headers: corsHeaders
    });
}

// ============================== 主入口 ==============================
export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // CORS 预检
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, HEAD, OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    'Access-Control-Max-Age': '2592000',
                    'Allow': 'GET, POST, HEAD'
                }
            });
        }
        
        if (!['GET', 'POST', 'HEAD'].includes(request.method)) {
            return new Response("Method Not Allowed", {
                status: 405,
                headers: { 'Access-Control-Allow-Origin': '*' }
            });
        }

        // 获取参数
        const targetUrl = url.searchParams.get('url');
        const pwd = url.searchParams.get('pwd') || '';
        const type = url.searchParams.get('type') || '';

        // 参数检查
        if (!targetUrl) {
            return new Response(
                JSON.stringify({ 
                    code: 400, 
                    msg: '缺少URL参数', 
                    success: false,
                    data: null 
                }, null, 2),
                { 
                    status: 400, 
                    headers: {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    } 
                }
            );
        }

        let result;

        try {
            // 路由到对应的解析器
            if (/feijipan\.com/i.test(targetUrl)) {
                const parser = new FeijipanParser({});
                const shareKey = parser.extractShareKey(targetUrl);
                const parser2 = new FeijipanParser({ 
                    shareKey: shareKey, 
                    sharePassword: pwd 
                });
                const data = await parser2.parse();
                
                result = {
                    code: 200,
                    msg: '解析成功',
                    success: true,
                    shareKey: 'fp:' + shareKey,
                    data: data
                };

            } else if (/ilanzou\.com/i.test(targetUrl)) {
                const parser = new IlanzouParser();
                result = await parser.parse(targetUrl, pwd);
                
                if (result.code === 200) {
                    result.msg = '解析成功';
                }
                
            } else if (/(lanzou[a-z]{0,2}\.com)/i.test(targetUrl)) {
                const parser = new LanzouParser();
                result = await parser.parse(targetUrl, pwd);
                
            } else {
                result = { 
                    code: 400, 
                    msg: '不支持的链接格式', 
                    success: false,
                    data: null 
                };
            }

        } catch (e) {
            result = { 
                code: 500, 
                msg: '解析失败: ' + e.message, 
                success: false,
                data: null 
            };
        }
        return handleResponse(result, type, CONFIG["redirect-url"]);
    }
};
