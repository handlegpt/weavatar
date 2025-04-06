FROM node:18-alpine
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install
RUN npm install react-router-dom@5.3.4

# 安装 TypeScript 类型定义包
RUN npm install --save-dev @types/react @types/react-dom @types/react-dropzone @types/node @types/react-router-dom @types/react-icons

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=development
ENV PORT=3000

# 构建前端
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]