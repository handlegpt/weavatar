FROM node:18-alpine

WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install
RUN npm install react-router-dom@5.3.4
RUN npm install @stripe/stripe-js

# 安装 TypeScript 类型定义包
RUN npm install --save-dev @types/react @types/react-dom @types/react-dropzone @types/node @types/react-router-dom @types/react-icons

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 安装serve包来服务静态文件
RUN npm install -g serve

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["serve", "-s", "dist", "-l", "3000"]