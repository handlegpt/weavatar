FROM node:18-alpine
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 安装 TypeScript 类型定义包
RUN npm install --save-dev @types/react @types/react-dom @types/react-dropzone @types/node @types/react-router-dom @types/react-icons

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]