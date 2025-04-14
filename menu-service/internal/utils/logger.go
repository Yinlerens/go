// internal/utils/logger.go
package utils

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"runtime"
	"strings"
	"time"
)

// 日志级别
const (
	LevelDebug = "DEBUG"
	LevelInfo  = "INFO"
	LevelWarn  = "WARN"
	LevelError = "ERROR"
)

// 控制台颜色代码
const (
	ColorReset  = "\033[0m"
	ColorRed    = "\033[31m"
	ColorGreen  = "\033[32m"
	ColorYellow = "\033[33m"
	ColorBlue   = "\033[34m"
	ColorPurple = "\033[35m"
	ColorCyan   = "\033[36m"
	ColorGray   = "\033[37m"
)

// Logger 日志工具结构体
type Logger struct {
	Module     string
	EnableFile bool
	LogFile    *os.File
	logger     *log.Logger
}

// NewLogger 创建日志工具实例
func NewLogger(module string, enableFile bool, filePath string) *Logger {
	logger := &Logger{
		Module:     module,
		EnableFile: enableFile,
	}

	// 设置日志输出
	if enableFile && filePath != "" {
		file, err := os.OpenFile(filePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err != nil {
			log.Printf("打开日志文件失败: %v, 将只输出到控制台", err)
		} else {
			logger.LogFile = file
			logger.logger = log.New(file, "", log.LstdFlags)
		}
	} else {
		logger.logger = log.New(os.Stdout, "", log.LstdFlags)
	}

	return logger
}

// formatMessage 格式化日志消息
func (l *Logger) formatMessage(level, msg string, keysAndValues ...interface{}) string {
	// 获取调用信息
	_, file, line, _ := runtime.Caller(2)
	paths := strings.Split(file, "/")
	shortPath := paths[len(paths)-1]

	// 格式化时间
	timeStr := time.Now().Format("2006-01-02 15:04:05.000")

	// 基本日志信息
	logMsg := fmt.Sprintf("[%s] [%s] [%s:%d] [%s] %s",
		timeStr, level, shortPath, line, l.Module, msg)

	// 添加结构化数据
	if len(keysAndValues) > 0 {
		if len(keysAndValues)%2 != 0 {
			keysAndValues = append(keysAndValues, "MISSING_VALUE")
		}

		logMsg += " |"
		for i := 0; i < len(keysAndValues); i += 2 {
			key := keysAndValues[i]
			value := keysAndValues[i+1]

			// 对复杂结构进行JSON格式化
			valueStr := ""
			switch v := value.(type) {
			case map[string]interface{}, map[string]bool, map[string]string, []interface{}, []string:
				jsonBytes, err := json.MarshalIndent(v, "", "  ")
				if err != nil {
					valueStr = fmt.Sprintf("%+v", v)
				} else {
					valueStr = string(jsonBytes)
				}
			default:
				valueStr = fmt.Sprintf("%+v", v)
			}

			logMsg += fmt.Sprintf(" %v=%v", key, valueStr)
		}
	}

	return logMsg
}

// getColorByLevel 根据日志级别获取颜色
func getColorByLevel(level string) string {
	switch level {
	case LevelDebug:
		return ColorGray
	case LevelInfo:
		return ColorGreen
	case LevelWarn:
		return ColorYellow
	case LevelError:
		return ColorRed
	default:
		return ColorReset
	}
}

// writeLog 写入日志
func (l *Logger) writeLog(level, msg string, keysAndValues ...interface{}) {
	formattedMsg := l.formatMessage(level, msg, keysAndValues...)

	// 控制台输出彩色日志
	color := getColorByLevel(level)
	fmt.Printf("%s%s%s\n", color, formattedMsg, ColorReset)

	// 文件输出无颜色
	if l.EnableFile && l.LogFile != nil {
		l.logger.Println(formattedMsg)
	}
}

// Debug 输出调试级别日志
func (l *Logger) Debug(msg string, keysAndValues ...interface{}) {
	l.writeLog(LevelDebug, msg, keysAndValues...)
}

// Info 输出信息级别日志
func (l *Logger) Info(msg string, keysAndValues ...interface{}) {
	l.writeLog(LevelInfo, msg, keysAndValues...)
}

// Warn 输出警告级别日志
func (l *Logger) Warn(msg string, keysAndValues ...interface{}) {
	l.writeLog(LevelWarn, msg, keysAndValues...)
}

// Error 输出错误级别日志
func (l *Logger) Error(msg string, keysAndValues ...interface{}) {
	l.writeLog(LevelError, msg, keysAndValues...)
}