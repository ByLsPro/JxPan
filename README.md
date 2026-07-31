## 📖 项目简介

**JxPan** 是一个基于 Cloudflare Workers 平台的网盘直链解析工具。它能够解析主流网盘分享链接，提取文件真实下载地址，并通过 JSON 格式输出或 302 重定向直接下载，有效绕过网盘客户端限制。

- 🖥️ **Demo 演示站点**：<https://jx.fsapk.xx.kg>

### ✨ 核心特性

- 🔗 **直链解析**：支持解析网盘分享链接，获取文件真实下载直链
- 📡 **JSON 输出**：标准化 API 响应，方便二次开发集成
- 🔄 **302 重定向**：支持直接重定向到下载地址，实现无缝下载体验
- 🛡️ **边缘计算**：基于 Cloudflare Workers 平台，避免 IP 封禁
- ⚡ **高速稳定**：利用 CF 全球网络，解析速度快、可用性高
- 🌍 **全球访问**：自动选择最优节点，无视地域限制
- 📊 **统计功能**：记录解析次数、成功/失败次数
- 💾 **D1 数据库存储**：使用 Cloudflare D1 SQL 数据库存储数据
- 🔐 **数据加密**：所有敏感数据 AES 加密存储

***

## 🚀 支持平台

| 平台     | 域名                           | 状态    | 扫码登录  |
| ------ | ---------------------------- | ----- | ----- |
| 阿里云盘   | alipan.com / aliyundrive.com | ✅ 已支持 | ✅ 支持  |
| 夸克网盘   | pan.quark.cn                 | ✅ 已支持 | ✅ 支持  |
| UC网盘   | drive.uc.cn / fast.uc.cn     | ✅ 已支持 | ✅ 支持  |
| 移动云盘   | yun.139.com / caiyun.139.com | ✅ 已支持 | ❌ 不支持 |
| 天翼云盘   | cloud.189.cn                 | ✅ 已支持 | ✅ 支持  |
| 小飞机网盘  | feijipan.com                 | ✅ 已支持 | -     |
| 蓝奏云优享版 | ilanzou.com                  | ✅ 已支持 | -     |
| 蓝奏云    | lanzou\*.com                 | ✅ 已支持 | -     |
| 光鸭云盘   | guangyapan.com               | ✅ 已支持 | ✅ 支持  |

> **注意**：\
> 阿里云盘、夸克网盘、UC网盘、移动云盘、天翼云盘、光鸭云盘需要配置认证信息才能正常解析。推荐使用后台管理面板的扫码登录功能快速配置。\
> *小飞机网盘需要配置账号信息才能解析大文件（＞500MB）*

***

## 💡 快速部署

### ⚙️ Workers 部署

#### 1. 创建 Worker

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com)，进入 **Workers & Pages**
2. 点击 "创建服务"，输入服务名称（如 `jxpan`），点击 "创建服务"

#### 2. 上传代码

1. 进入 Worker 编辑页面，点击 "编辑代码"
2. 将 `_worker.js` 的完整代码粘贴到编辑器中
3. 点击 "保存并部署"

#### 3. 配置 D1 数据库（必需）

本项目使用 **Cloudflare D1 SQL 数据库** 存储数据（扫码登录信息、统计数据等）。

1. 在 Cloudflare Dashboard 中，进入 **"储存和数据库" → "D1 SQL 数据库"**
2. 点击 **"创建数据库"**，输入名称 `jxpan`
3. 创建完成后，进入 **"Workers & Pages" → 你的 Worker → 设置 → 绑定"**
4. 点击 **"添加绑定" → 选择 "D1 数据库"**
5. 变量名称填写 `jxpan`，选择刚创建的数据库
6. 点击 **"添加绑定"**

> D1 数据库表会在首次请求时自动创建，无需手动执行 SQL。

#### 4. 配置环境变量（可选）

对于需要认证的网盘，可以配置以下环境变量：

| 变量名                    | 说明                        | 适用平台 |
| ---------------------- | ------------------------- | ---- |
| `ALIYUN_AUTHORIZATION` | 阿里云盘的 Authorization Token | 阿里云盘 |
| `QK_COOKIE`            | 夸克网盘的 Cookie              | 夸克网盘 |
| `UC_COOKIE`            | UC网盘的 Cookie              | UC网盘 |
| `MCLOUD_AUTHORIZATION` | 移动云盘的 Authorization Token | 移动云盘 |
| `CLOUD189_TOKEN`       | 天翼云盘的 AccessToken         | 天翼云盘 |
| `GY_Login`             | 光鸭云盘的登录信息 JSON            | 光鸭云盘 |

配置方法：

1. 在 Worker 页面点击 **"设置" → "变量"**
2. 点击 **"添加变量"**，输入变量名和值
3. 点击 **"保存"**

> **推荐**：通过后台管理面板 `/admin` 的扫码登录功能配置，无需手动填写环境变量。

#### 5. 绑定自定义域（推荐）

1. 在 **"触发器"** 选项卡点击 **"添加自定义域"**
2. 输入您的域名（如 `pan.yourdomain.com`），点击 **"添加自定义域"**
3. 按提示完成 DNS 解析，等待证书生效

#### 6. 配置后台管理面板（可选）

为了启用后台管理面板，需要配置以下环境变量：

| 变量名     | 说明      |
| ------- | ------- |
| `admin` | 后台登录用户名 |
| `pass`  | 后台登录密码  |

配置方法同上。

#### 7. 访问测试

- 访问 `https://your-domain.com/` 查看使用说明
- 访问 `https://your-domain.com/?url=分享链接` 进行解析测试
- 访问 `https://your-domain.com/admin` 进入后台管理面板

***

## 📱 扫码登录功能

后台管理面板 (`/admin`) 提供了便捷的扫码登录功能，支持以下网盘：

### 支持扫码登录的平台

| 平台    | 登录方式         | 存储位置   |
| ----- | ------------ | ------ |
| 阿里云盘  | 阿里云盘 APP 扫码  | D1     |
| 天翼云盘  | 天翼云盘 APP 扫码  | D1     |
| 光鸭云盘  | 手机号+验证码      | D1     |
| 夸克网盘  | 夸克 APP 扫码    | D1     |
| UC网盘  | UC APP 扫码    | D1     |

### 使用方式

1. 访问 `https://your-domain.com/admin`
2. 使用管理员账号登录
3. 进入 **"控制面板"** 或 **"扫码登录"** 标签页
4. 点击对应网盘的 **"扫码登录"** 按钮
5. 使用对应网盘 APP 扫描二维码
6. 扫码成功后自动保存登录信息到 D1 数据库
7. 解析时自动优先使用扫码登录的配置信息

### 前端页面配置

前端解析页面也提供了手动配置入口（JSON 输入框）：

- **阿里云盘**：Authorization 手动输入
- **夸克网盘**：Cookie 手动输入
- **UC网盘**：Cookie 手动输入
- **移动云盘**：Authorization + Cookie 手动输入
- **天翼云盘**：AccessToken 手动输入
- **光鸭云盘**：登录信息 JSON 手动输入

配置优先级：**扫码登录（容易失效） > 前端手动输入 > 环境变量（兜底）**

***

## 📚 API 使用文档

### 基础接口

#### 1. 解析接口（JSON 返回）

```
GET /?url={分享链接}&pwd={密码}&type=json
```

**参数说明：**

| 参数   | 类型     | 必填 | 说明       |
| ---- | ------ | -- | -------- |
| url  | string | ✅  | 网盘分享链接   |
| pwd  | string | ❌  | 分享密码（如有） |
| type | string | ❌  | 返回类型     |

**返回示例：**

```json
{
  "code": 200,
  "msg": "解析成功",
  "success": true,
  "shareKey": "uc:xxxxxxxx",
  "cookie_status": {
    "valid": true,
    "remaining_time": "1小时30分",
    "remaining_seconds": 5400
  },
  "data": {
    "file_id": "xxxxxxxx",
    "file_name": "example.zip",
    "file_size": "100.00 MB",
    "download_url": "https://..."
  }
}
```

#### 2. 302 自动跳转下载

```
GET /?url={分享链接}&pwd={密码}&type=down
```

默认情况下，对于支持直接下载的网盘会使用 302 重定向到下载地址。

#### **说明：**

- 对于阿里云盘、夸克网盘、UC网盘、移动云盘 等需要特殊请求头的网盘
- 下载会携带必要的请求头（如：Cookie、Referer、X-CToken、Authorization 等）

#### 4. 获取统计数据

```
GET /?action=get_stats
```

**返回示例：**

```json
{
  "code": 200,
  "msg": "获取统计数据成功",
  "success": true,
  "data": {
    "total": 100,
    "success": 95,
    "failed": 5,
    "cached": 80
  }
}
```

**字段说明：**

- `total`：解析总数
- `success`：成功次数
- `failed`：失败次数
- `cached`：缓存命中次数

#### 5. 获取解析记录

```
GET /?action=get_records
```

**返回示例：**

```json
{
  "code": 200,
  "msg": "获取解析记录成功",
  "success": true,
  "data": {
    "success": [
      {
        "id": 1678901234567,
        "url": "https://lanzoux.com/xxxxxx",
        "pwd": "1234",
        "success": true,
        "code": 200,
        "msg": "解析成功",
        "data": {
          "file_name": "example.zip",
          "file_size": "10.00 MB",
          "download_url": "https://..."
        },
        "timestamp": "2024-03-01T12:00:00Z"
      }
    ],
    "failed": [
      {
        "id": 1678901234568,
        "url": "https://lanzoux.com/yyyyyy",
        "pwd": "",
        "success": false,
        "code": 404,
        "msg": "链接不存在",
        "data": null,
        "timestamp": "2024-03-01T12:01:00Z"
      }
    ]
  }
}
```

#### 6. 获取登录状态

```
GET /?action=login_status
```

返回各网盘的登录状态和配置详情，用于后台管理面板显示。

#### 7. 文件夹解析接口（蓝奏云/小飞机）

支持解析文件夹分享链接，获取文件列表和子文件夹结构。

##### 7.1 解析文件夹根目录

```
GET /?url={文件夹分享链接}&pwd={密码}
```

**返回示例（小飞机文件夹）：**

```json
{
  "code": 200,
  "msg": "解析成功",
  "success": true,
  "shareKey": "fp:jgBISyJG",
  "data": {
    "name": "软件合集",
    "desc": "",
    "list": [],
    "subfolders": [
      {
        "id": "47096870",
        "name": "xxx文件夹",
        "has_children": true
      },
      {
        "id": "1281186915",
        "name": "xxx文件夹",
        "has_children": true
      }
    ],
    "folder": [],
    "have_page": false,
    "is_feiji_folder": true,
    "share_id": "jgBISyJG"
  },
  "url": "https://share.feijipan.com/s/xxxxx",
  "pwd": ""
}
```

**返回示例（蓝奏云文件夹）：**

```json
{
  "code": 200,
  "msg": "解析成功（文件夹）",
  "success": true,
  "type": "lanzou",
  "is_folder": true,
  "folder_name": "xxx合集",
  "folder_desc": "下载完文件后显示.zip格式...",
  "sub_folders": [
    {
      "id": "b01zwbcli/folder1",
      "name": "xxx.zip",
      "desc": null
    }
  ],
  "file_list": [
    {
      "id": "isTAvle7mkj?webpage=VGVRMQFrVDgAZVc1AGNVZQRpVGVTcAIzADBXZ1I4VWYFM1cwCW0FLVQz",
      "name": "xxx.zip",
      "size": "60.8 M",
      "time": "2021-02-06",
      "duan": "ile7mk"
    }
  ],
  "have_page": false,
  "domain": "lanzouu.com"
}
```

**字段说明：**

| 字段                              | 类型      | 说明                                  |
| ------------------------------- | ------- | ----------------------------------- |
| `is_folder` / `is_feiji_folder` | boolean | 是否为文件夹类型                            |
| `name` / `folder_name`          | string  | 文件夹名称                               |
| `list` / `file_list`            | array   | 文件列表（含 id, name, size, duan 等）      |
| `subfolders` / `sub_folders`    | array   | 子文件夹列表（含 id, name, has\_children 等） |
| `has_children`                  | boolean | 是否包含子内容                             |

##### 7.2 多级嵌套解析（fid 参数）

支持无限层级嵌套，通过 `fid`, `fid2`, `fid3`... 参数逐层展开子文件夹（仅支持小飞机网盘）。

**语法：**

```
GET /?url={分享链接}&pwd={密码}&fid={第二级ID}&fid2={第三级ID}&fid3={第四级ID}...
```

**参数说明：**

| 参数     | 类型     | 必填 | 说明          |
| ------ | ------ | -- | ----------- |
| `fid`  | string | ❌  | 第二级子文件夹 ID  |
| `fid2` | string | ❌  | 第三级子文件夹 ID  |
| `fid3` | string | ❌  | 第四级子文件夹 ID  |
| ...    | string | ❌  | 支持最多 20 层嵌套 |

**示例：解析第三层子文件夹**

```
# 小飞机：展开 47096870(文件夹id) → 61047262(文件夹id)
GET /?url=https://share.feijipan.com/s/xxxxx&fid=47096870&fid2=61047262

# 返回：47096870中的61047262文件夹列表
```

```json
{
  "code": 200,
  "data": {
    "name": "子文件夹:61047262",
    "list": [
      {
        "id": "2478402699",
        "name": "eio.jpg",
        "size": "0.21 MB"
      }
    ],
    "subfolders": []
  }
}
```

##### 7.3 解析单个文件（d 参数）

在指定层级下解析单个文件，获取下载直链。

**语法：**

```
GET /?url={分享链接}&pwd={密码}&fid={...}&d={文件标识}
```

**参数说明：**

| 参数                   | 类型     | 必填 | 说明          |
| -------------------- | ------ | -- | ----------- |
| `fid` / `fid2` / ... | string | ❌  | 文件夹层级路径（同上） |
| `d`                  | string | ✅  | 文件标识符（文件ID） |

**示例 - 蓝奏云：**

```
GET /?url=https://sta0.lanzouu.com/b01zwbcli&pwd=。。&d=ile7mk
```

```json
{
  "code": 200,
  "msg": "解析成功",
  "success": true,
  "data": {
    "file_id": "37662609",
    "file_name": "视频素材.zip",
    "file_size": "60.8 M",
    "download_url": "https://developer2.lanrar.com/file/?BGIHOQg5UmMFDAc/...",
    "original_info": {
      "id": "isTAvle7mkj?webpage=VGVRMQFrVDgAZVc1AGNVZQRpVGVTcAIzADBXZ1I4VWYFM1cwCW0FLVQz",
      "name": "视频素材.zip",
      "size": "60.8 M",
      "time": "2021-02-06",
      "duan": "ile7mk"
    }
  },
  "is_single_file_from_folder": true,
  "type": "lanzou"
}
```

**示例 - 小飞机（多级嵌套 + 单文件）：**

```
GET /?url=https://share.feijipan.com/s/jgBISyJG&fid=47096870&fid2=61047262&d=2478402699
```

```json
{
  "code": 200,
  "msg": "解析成功",
  "success": true,
  "data": {
    "download_url": "https://api.feejii.com/file/xxx",
    "file_name": "加群二维码(2).jpg",
    "file_size": "0.21 MB"
  }
}
```

##### 7.4 生成分享下载链接（type=down）

生成带参数的分享链接，访问后 302 重定向到真实下载地址。

**语法：**

```
GET /?url={分享链接}&pwd={密码}&[fid=&fid2=&...]&d={文件ID}&type=down
```

**生成的链接格式：**

```
https://your-domain.com/?url=原始分享链接&pwd=密码&fid=第二层&fid2=第三层&d=文件ID&type=down
```

**使用场景：**

- 前端"复制下载链接"按钮会生成此格式的 URL 作为永久下载直链
- 用户访问此 URL 后自动 302 重定向到文件的直链下载地址

**示例：**

```
# 蓝奏云单文件下载链接
https://jx.fsapk.xx.kg/?url=https://sta0.lanzouu.com/b01zwbcli&pwd=。。&d=ile7mk&type=down

# 小飞机多级嵌套文件下载链接
https://jx.fsapk.xx.kg/?url=https://share.feijipan.com/s/jgBISyJG&fid=47096870&fid2=61047262&d=2478402699&type=down
```

***

⚙️ 配置说明

### 环境变量配置

| 变量名                    | 默认值   | 说明                       |
| ---------------------- | ----- | ------------------------ |
| `ALIYUN_ENABLED`       | true  | 是否启用阿里云盘解析               |
| `ALIYUN_AUTHORIZATION` | -     | 阿里云盘 Authorization Token |
| `ALIYUN_USER_AGENT`    | -     | 阿里云盘自定义 UA               |
| `QK_ENABLED`           | true  | 是否启用夸克网盘解析               |
| `QK_COOKIE`            | -     | 夸克网盘 Cookie              |
| `QK_USER_AGENT`        | -     | 夸克网盘自定义 UA               |
| `UC_ENABLED`           | true  | 是否启用 UC 网盘解析             |
| `UC_COOKIE`            | -     | UC 网盘 Cookie             |
| `UC_USER_AGENT`        | -     | UC 网盘自定义 UA              |
| `MCLOUD_ENABLED`       | true  | 是否启用移动云盘解析               |
| `MCLOUD_AUTHORIZATION` | -     | 移动云盘 Authorization Token |
| `MCLOUD_COOKIE`        | -     | 移动云盘 Cookie              |
| `MCLOUD_USER_AGENT`    | -     | 移动云盘自定义 UA               |
| `CLOUD189_ENABLED`     | true  | 是否启用天翼云盘解析               |
| `CLOUD189_TOKEN`       | -     | 天翼云盘 AccessToken         |
| `CLOUD189_USER_AGENT`  | -     | 天翼云盘自定义 UA               |
| `GY_ENABLED`           | true  | 是否启用光鸭云盘解析               |
| `GY_Login`             | -     | 光鸭云盘登录信息 JSON            |
| `GY_USER_AGENT`        | -     | 光鸭云盘自定义 UA               |
| `AUTO_SWITCH`          | true  | 自动切换平台 UA                |
| `MODE`                 | pc    | 解析模式                     |
| `REDIRECT_URL`         | false | 是否默认使用 302 重定向           |
| `CACHE`                | false | 是否启用解析结果缓存               |
| `CACHE_EXPIRED`        | 2000  | 缓存过期时间（秒）                |
| `FOLDER_CACHE`         | false | 是否启用文件夹缓存                |
| `admin`                | -     | 后台管理面板用户名                |
| `pass`                 | -     | 后台管理面板密码                 |

### 存储绑定配置

| 绑定名称    | 类型 | 说明                       | 必需     |
| ------- | -- | ------------------------ | ------ |
| `jxpan` | D1 | D1 SQL 数据库，用于存储统计数据、登录信息 | **必需** |

### 认证信息获取方法

#### 方式一：扫码登录（推荐）

1. 访问 `https://your-domain.com/admin`
2. 进入 **"控制面板"** 或 **"扫码登录"** 标签
3. 点击对应网盘的 **"扫码登录"** 按钮
4. 使用对应网盘 APP 扫描二维码
5. 登录成功后自动保存，无需手动复制任何信息

#### 方式二：手动获取

##### 阿里云盘

1. 访问 <https://www.alipan.com> 并登录
2. 按 F12 打开开发者工具 → Network
3. 刷新页面，找到任意 API 请求
4. 复制请求头中的 `Authorization` 字段值（包含 Bearer）

##### 夸克网盘

1. 访问 <https://pan.quark.cn> 并登录
2. 按 F12 打开开发者工具 → Network
3. 刷新页面，找到任意 API 请求
4. 复制请求头中的 `Cookie` 字段值

##### UC网盘

1. 访问 <https://drive.uc.cn> 并登录
2. 访问任意分享链接
3. 按 F12 打开开发者工具 → Network
4. 找到 `share/sharepage/token` 或 `transfer_share/detail` 请求
5. 复制请求头中的完整 `Cookie` 字符串

**UC网盘 Cookie 必须包含以下字段：**

- `__pus`
- `__puus`
- `UDRIVE_TRANSFER_SESS`
- `ctoken`（必需，用于 X-CToken 请求头）
- `b-user-id`

##### 移动云盘

1. 访问 <https://yun.139.com> 并登录
2. 按 F12 打开开发者工具 → Network
3. 刷新页面，找到任意 API 请求
4. 复制请求头中的 `Authorization` 字段值（包含 Basic）

##### 光鸭云盘

1. 运行项目中的 `阿里云盘扫码登录.py` 脚本（手机号+验证码登录）
2. 或在后台管理面板中使用扫码登录功能
3. 将生成的 JSON 登录信息配置到 `GY_Login` 环境变量中

***

## 📝 使用示例

### 阿里云盘

```bash
# JSON 返回
curl "https://your-domain.com/?url=https://www.alipan.com/s/xxxxxx&type=json"

# 代理下载
curl "https://your-domain.com/?url=https://www.alipan.com/s/xxxxxx&type=down"
```

### 夸克网盘

```bash
# JSON 返回
curl "https://your-domain.com/?url=https://pan.quark.cn/s/xxxxxx&type=json"

# 代理下载
curl "https://your-domain.com/?url=https://pan.quark.cn/s/xxxxxx&type=down"
```

### UC网盘

```bash
# JSON 返回
curl "https://your-domain.com/?url=https://drive.uc.cn/s/xxxxxx&type=json"

# 代理下载
curl "https://your-domain.com/?url=https://drive.uc.cn/s/xxxxxx&type=down"
```

### 移动云盘

```bash
# JSON 返回
curl "https://your-domain.com/?url=https://yun.139.com/shareweb/#/w/i/xxxxxx&type=json"

# 代理下载
curl "https://your-domain.com/?url=https://yun.139.com/shareweb/#/w/i/xxxxxx&type=down"
```

### 蓝奏云

```bash
# 直接下载（支持 302 重定向）
curl "https://your-domain.com/?url=https://lanzoux.com/xxxxxx"
```

### 天翼云盘

```bash
# JSON 返回
curl "https://your-domain.com/?url=https://cloud.189.cn/web/share?code=xxxxxx&type=json"

# 代理下载
curl "https://your-domain.com/?url=https://cloud.189.cn/web/share?code=xxxxxx&type=down"
```

### 光鸭云盘

```bash
# JSON 返回
curl "https://your-domain.com/?url=https://www.guangyapan.com/s/xxxxxx&type=json"

# 代理下载
curl "https://your-domain.com/?url=https://www.guangyapan.com/s/xxxxxx&type=down"
```

***

## 🔧 技术架构

```
┌─────────────────┐
│   Cloudflare    │
│    Workers      │
│  (Edge Runtime) │
└────────┬────────┘
         │
    ┌────┼───────┐
    │    │       │
┌───▼───┐│  ┌────▼────┐
│ 网盘  ││  │ Cloudflare │
│ API   ││  │    D1      │  ← 主存储（SQL数据库）
└───────┘│  │   (jxpan)  │
         │  └───────────┘
    ┌────▼────┐
    │ 网盘 OSS │
    └─────────┘
```

### 核心模块

- **D1 Database Layer** - D1 SQL 数据库访问层，支持加密存储、过期清理
- **CookieManager** - Cookie 缓存管理，支持有效期检测
- **AliyunPanParser** - 阿里云盘解析器（含扫码登录 + JWT token 刷新）
- **QuarkParser** - 夸克网盘解析器（含扫码登录）
- **UCParser** - UC网盘解析器（含扫码登录）
- **MobileCloudParser** - 移动云盘解析器（含扫码登录）
- **Cloud189Parser** - 天翼云盘解析器（含扫码登录）
- **FeijipanParser** - 小飞机网盘解析器
- **IlanzouParser** - 蓝奏云优享版解析器
- **LanzouParser** - 蓝奏云解析器
- **GuangyaPanParser** - 光鸭云盘解析器（含扫码登录）
- **AES128ECB Encryption** - AES-128-ECB 加密工具，保护敏感数据
- **Cache Mechanism** - 前端内存缓存机制，提高响应速度
- **Statistics** - 记录和提供解析统计数据
- **Admin Panel** - 后台管理面板，查看解析记录、统计数据、登录配置详情
- **Authentication** - 后台登录认证系统
- **QR Code Login** - 多网盘扫码登录系统（阿里云盘/天翼云盘/夸克/UC/移动云盘/光鸭云盘）

### 数据库表结构 (D1)

```sql
CREATE TABLE kv_store (
    key TEXT PRIMARY KEY,      -- 键名（如 jx_total, aliyun_login_default）
    value TEXT NOT NULL,      -- 值（通常为 AES 加密的 JSON）
    expires_at INTEGER DEFAULT 0,  -- 过期时间戳（Unix秒），0 表示永不过期
    created_at INTEGER DEFAULT (strftime('%s', 'now'))  -- 创建时间
);
CREATE INDEX idx_kv_expires ON kv_store(expires_at);  -- 过期索引，便于清理
```

**主要 Key 前缀说明：**

| Key 前缀                 | 用途                     | 过期时间   |
| ---------------------- | ---------------------- | ------ |
| `jx_total`             | 解析统计数据                 | 永久     |
| `parse_record_`        | 解析记录                   | 7天     |
| `aliyun_login_default` | 阿里云盘扫码登录 Authorization | 1天     |
| `aliyun_refresh_token` | 阿里云盘 Refresh Token     | 30天    |
| `gy_login_default`     | 光鸭云盘登录信息               | 永久     |
| `quark_login_default`  | 夸克网盘登录 Cookie          | 永久     |
| `uc_login_default`     | UC网盘登录 Cookie          | 永久     |
| `mcloud_login_default` | 移动云盘登录信息               | 永久     |
| `c189_login_default`   | 天翼云盘登录信息               | 永久     |
| `feiji_tran_login`     | 小飞机网盘转存登录信息            | 永久     |
| `admin_token`          | 后台管理员 Token            | 7天     |
| `gy_qr_` / `uc_qr_` 等  | 扫码登录临时会话数据             | 5-10分钟 |

***

## ⚠️ 免责声明

本项目仅供学习研究使用，旨在探索网盘分享链接的解析原理及边缘计算技术应用。

使用本项目获取的下载链接，请严格遵守各网盘平台的服务条款及相关法律法规。

**严禁将本项目用于以下行为：**

- 大规模自动化爬取、转存或分发网盘资源
- 破解、绕过网盘平台的付费功能或访问限制
- 传播盗版、侵权或违法违规内容

作者不对因使用本项目导致的任何法律纠纷、账号封禁或数据损失承担责任。

如因网盘平台政策调整或反爬升级导致功能失效，本项目可能随时停止维护，敬请谅解。

下载的文件请在 24 小时内删除，不得用于商业用途或二次传播。

***

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

## 📞 联系方式

如有问题或建议，欢迎通过以下方式联系：

- GitHub Issues: [提交问题](https://github.com/ByLsPro/JxPan/issues)

***

<p align="center">
 Made with ❤️ by <a href="https://github.com/ByLsPro">ByLsPro</a>
</p>
