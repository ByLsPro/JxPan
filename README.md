[![Stars](https://img.shields.io/github/stars/ByLsPro/JxPan?style=flat-square&logo=github)](https://github.com/ByLsPro/JxPan/stargazers)
[![Forks](https://img.shields.io/github/forks/ByLsPro/JxPan?style=flat-square&logo=github)](https://github.com/ByLsPro/JxPan/network/members)
[![License](https://img.shields.io/github/license/ByLsPro/JxPan?style=flat-square)](https://github.com/ByLsPro/JxPan/blob/main/LICENSE)

## ⭐ 项目热度

[![Stargazers over time](https://starchart.cc/ByLsPro/JxPan.svg?variant=adaptive)](https://starchart.cc/ByLsPro/JxPan)

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

---

## ⚠️ 免责声明

1. **本项目仅供学习研究使用**，旨在探索网盘分享链接的解析原理及边缘计算技术应用。
2. 使用本项目获取的下载链接，请严格遵守各网盘平台的服务条款及相关法律法规。
3. **严禁**将本项目用于以下行为：
   - 大规模自动化爬取、转存或分发网盘资源
   - 破解、绕过网盘平台的付费功能或访问限制
   - 传播盗版、侵权或违法违规内容
4. 作者 **ByLsPro** 不对因使用本项目导致的任何法律纠纷、账号封禁或数据损失承担责任。
5. 如因网盘平台政策调整或反爬升级导致功能失效，本项目可能随时停止维护，敬请谅解。
6. 下载的文件请在 24 小时内删除，不得用于商业用途或二次传播。

---

---
