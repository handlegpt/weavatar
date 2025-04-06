# WeAvatar - AI 智能图像处理

基于 AI 的图像处理应用，支持多种风格转换和自定义处理。

## 功能特点

- 支持多种预设风格
- 自定义提示词处理
- 会员系统
- 每日免费额度
- 实时处理状态显示

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/handlegpt/weavatar.git
cd weavatar
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env.example` 文件并重命名为 `.env`：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，填入必要的配置信息：

```env
# API配置
API_KEY=your_api_key_here
API_ENDPOINT=your_api_endpoint_here
API_MODEL=your_api_model_here

# 服务器配置
PORT=3000
NODE_ENV=production

# 请求限制配置
RATE_LIMIT_WINDOW_MS=86400000  # 24小时
RATE_LIMIT_MAX_REQUESTS=5       # 每个时间窗口内的最大请求数
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 构建生产版本

```bash
npm run build
npm start
```

## Docker 部署

1. 构建 Docker 镜像：

```bash
docker build -t weavatar .
```

2. 运行容器：

```bash
docker run -p 3000:3000 --env-file .env weavatar
```

## 使用说明

1. 访问 http://localhost:3000
2. 上传图片或拖拽图片到指定区域
3. 选择预设风格或输入自定义提示词
4. 点击处理按钮开始处理
5. 等待处理完成后下载结果

## 会员系统

- 免费用户：每日 5 次处理额度
- 月度会员：¥29.9/月，无限次使用
- 季度会员：¥79.9/季，无限次使用
- 年度会员：¥299.9/年，无限次使用

## 技术栈

- 前端：React + TypeScript + Tailwind CSS
- 后端：Node.js + Express
- 数据库：MongoDB
- 部署：Docker

## 许可证

MIT 