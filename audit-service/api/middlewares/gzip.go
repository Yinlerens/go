// audit-service/api/middlewares/gzip.go
package middlewares

import (
	"compress/gzip"
	"fmt"
	"github.com/gin-gonic/gin"
	"io"
	"log"
	"net/http"
	"strings"
)

// GzipDecompressMiddleware 处理gzip压缩请求的中间件
func GzipDecompressMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查Content-Encoding头
		contentEncoding := c.GetHeader("Content-Encoding")

		// 如果是gzip压缩
		if strings.Contains(contentEncoding, "gzip") {
			fmt.Printf("[EDGEONE ERROR] 是gzip:")
			// 获取原始请求体
			gzipReader, err := gzip.NewReader(c.Request.Body)
			if err != nil {
				// 添加生产日志
				log.Printf("无法解析gzip压缩请求")
				c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{
					"code": 1001,
					"msg":  "无法解析gzip压缩请求",
					"data": nil,
				})
				return
			}
			defer gzipReader.Close()

			// 替换请求体
			c.Request.Body = io.NopCloser(gzipReader)

			// 移除Content-Encoding头，避免后续处理混淆
			c.Request.Header.Del("Content-Encoding")
		}

		c.Next()
	}
}