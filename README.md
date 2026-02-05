[![Stars](https://img.shields.io/github/stars/ByLsPro/JxPan?style=flat-square&logo=github)](https://github.com/ByLsPro/JxPan/stargazers)
[![Forks](https://img.shields.io/github/forks/ByLsPro/JxPan?style=flat-square&logo=github)](https://github.com/ByLsPro/JxPan/network/members)
[![License](https://img.shields.io/github/license/ByLsPro/JxPan?style=flat-square)](https://github.com/ByLsPro/JxPan/blob/main/LICENSE)

---

## 📖 项目简介

**JxPan** 是一个基于 Cloudflare Workers 平台的网盘直链解析工具。它能够解析主流网盘分享链接，提取文件真实下载地址，并通过 JSON 格式输出或 302 重定向直接下载，有效绕过网盘客户端限制。

- 🖥️ **Demo 演示站点**：[https://jx.fsapk.xx.kg](https://jx.fsapk.xx.kg)

### ✨ 核心特性

- 🔗 **直链解析**：支持解析网盘分享链接，获取文件真实下载直链
- 📡 **JSON 输出**：标准化 API 响应，方便二次开发集成
- 🔄 **302 重定向**：支持直接重定向到下载地址，实现无缝下载体验
- 🛡️ **边缘计算**：基于 Cloudflare Workers 全球节点，避免 IP 封禁
- ⚡ **高速稳定**：利用 CF 全球网络，解析速度快、可用性高
- 🌍 **全球访问**：自动选择最优节点，无视地域限制

---

## 🚀 支持平台

| 平台 | 域名 | 状态 |
| :--- | :--- | :---: |
| **小飞机网盘** | feijipan.com | ✅ 已支持 |
| **蓝奏云优享版** | ilanzou.com | ✅ 已支持 |
| **蓝奏云** | lanzou.com | ✅ 已支持 |

> 🔜 **更多平台**：正在适配中，欢迎提交 Issue 建议新增平台

---

## 💡 快速部署

### ⚙️ Workers 部署

<details>
<summary><code><strong>「 Workers 部署文字教程 」</strong></code></summary>

1. **创建 Worker**：
   - 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)，进入 Workers & Pages
   - 点击 **"创建服务"**，输入服务名称（如 `jxpan`），点击 **"创建服务"**

2. **上传代码**：
   - 进入 Worker 编辑页面，点击 **"快速编辑"**
   - 将 [`_worker.js`](https://github.com/ByLsPro/JxPan/blob/main/_worker.js) 的完整代码粘贴到编辑器中
   - 点击 **"保存并部署"**

3. **绑定自定义域**（推荐）：
   - 在 **"触发器"** 选项卡点击 **"添加自定义域"**
   - 输入您的域名（如 `pan.yourdomain.com`），点击 **"添加自定义域"**
   - 按提示完成 DNS 解析，等待证书生效

4. **访问测试**：
   - 访问 `https://your-domain.com/` 查看使用说明
   - 或访问 `https://your-domain.com/?url=分享链接` 进行解析测试

</details>

---

## 📚 API 使用文档

### 基础接口

#### 1. 解析接口（JSON 返回）

### 接口说明

#### 1. 302 自动跳转下载

**通用接口**
```
GET your-domain.dev/?url={分享链接}&pwd={密码}
```

#### 2. 获取直链 JSON

```
GET your-domain.dev/?url={分享链接}&pwd={密码}&type=json
```


#### 3. 302重定向下载

```
GET your-domain.dev/?url={分享链接}&pwd={密码}&type=down
```

### _worker.js配置说明

- `auto-switch` 自动切换平台UA
- `{cache}` 解析缓存，可将已解析的URL储存到KV中
- `redirect-url` 是否默认使用302重定向下载

### 特殊说明

- 目前缓存功能还未实现储存KV空间，请勿开启cache功能
- 目前该项目仅支持单个文件的解析，暂未实现文件夹解析功能

### 演示站示例

```bash
# 302 跳转（通用接口 - 有密码）
https://jx.fsapk.xx.kg/?url=https%3A%2F%2Fwww.ilanzou.com%2Fs%2FlGFndCM&pwd=KMnv&type=down


# 获取 JSON（通用接口 - 无密码）
https://jx.fsapk.xx.kg/?url=https%3A%2F%2Fwww.ilanzou.com%2Fs%2FLEBZySxF&type=json
