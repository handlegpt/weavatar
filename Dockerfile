FROM node:18-alpine
WORKDIR /app

# 复制项目文件
COPY . .

# 安装依赖并构建前端
RUN npm install
# 安装 TypeScript 类型定义包
RUN npm install --save-dev @types/react @types/react-dom @types/react-dropzone @types/node

# 构建前端
RUN npm run build

# 设置环境变量
ENV NODE_ENV=production

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]