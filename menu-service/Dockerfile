FROM golang:1.23 AS builder

WORKDIR /app

# 设置Go代理为国内源
ENV GOPROXY=https://goproxy.cn,direct
# 关闭Go模块校验，有助于绕过某些连接问题
ENV GOSUMDB=off

# 创建目录结构，使相对路径有效
RUN mkdir -p /app/services/menu-service
WORKDIR /app/services/menu-service

# 复制服务的Go模块文件
COPY menu-service/go.mod menu-service/go.sum ./

# 创建相对路径的audit-sdk目录
RUN mkdir -p ../audit-sdk

# 复制SDK到正确位置
COPY audit-sdk/ ../audit-sdk/

# 下载依赖
RUN go mod download

# 复制服务源代码
COPY menu-service/ ./

# 构建应用
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o menu-service ./cmd/server/main.go

# 使用轻量级的alpine镜像
FROM alpine:latest

# 添加CA证书以支持HTTPS
RUN apk --no-cache add ca-certificates tzdata

# 设置时区为亚洲/上海
ENV TZ=Asia/Shanghai

WORKDIR /root/

# 从builder阶段复制二进制文件
COPY --from=builder /app/services/menu-service/menu-service .


# 暴露端口
EXPOSE 8082

# 运行
CMD ["./menu-service"]