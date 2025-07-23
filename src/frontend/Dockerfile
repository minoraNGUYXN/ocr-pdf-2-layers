FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy source files (excludes the build folder)
COPY . .

# Expose port cho Vite dev server
EXPOSE 5173

# Chạy ứng dụng frontend
CMD ["npm","run", "dev"]
