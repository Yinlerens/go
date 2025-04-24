package utils

import (
	"fmt"
	"os"
	"strings"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

// 全局 logger 实例
var logger *zap.Logger

// InitLogger 初始化全局的 zap logger，使用适合生产环境的配置。
// 输出格式为 JSON，默认级别为 InfoLevel，时间格式为 ISO8601。
func InitLogger() {
	// 1. 使用 zap 提供的标准生产环境配置
	// 它包含了：
	// - JSON 编码
	// - InfoLevel 作为最低级别
	// - ISO8601 时间格式 (通过 NewProductionEncoderConfig)
	// - 输出到 stderr
	// - 为 Error 及以上级别添加堆栈跟踪
	// - 包含调用者信息
	config := zap.NewProductionConfig()

	// --- 可选的自定义调整 ---
	// 如果需要将日志输出到文件而不是 stderr:
	// config.OutputPaths = []string{"stdout", "./app.log"} // 同时输出到控制台和文件
	// config.ErrorOutputPaths = []string{"stderr", "./app.error.log"} // 错误日志输出位置
	//
	// 如果需要修改时间戳的键名 (默认为 "ts"):
	// config.EncoderConfig.TimeKey = "timestamp"
	//
	// 如果你想关闭调用者信息记录 (默认为开启):
	// config.DisableCaller = true
	//
	// 如果你想关闭 Error 及以上级别的堆栈跟踪 (默认为开启):
	// config.DisableStacktrace = true
	// ------------------------

	// 2. 构建 Logger
	var err error
	// zap.AddCallerSkip(1) 让日志记录的调用位置跳过 logutil.Log 函数本身，
	// 指向调用 logutil.Log 的地方。
	// 对于直接使用 logger 的 Info/Warn 等方法，这个 Skip 是不需要的，
	// 但因为我们封装了 Log 函数，所以需要它。
	logger, err = config.Build(zap.AddCallerSkip(1))
	if err != nil {
		// 在 logger 初始化失败时，回退到标准错误输出
		fmt.Fprintf(os.Stderr, "Failed to initialize zap logger: %v\n", err)
		os.Exit(1) // 初始化失败通常是严重问题，直接退出
	}

	// (可选) 记录一条初始化成功的日志，使用新的 logger
	logger.Info("Logger initialized successfully (Production Mode)")
}

// Sync 在程序退出前调用，以确保所有缓冲的日志都被写入。
// 推荐在 main 函数中使用 defer logutil.Sync()。
func Sync() {
	if logger != nil {
		// 忽略 Sync 返回的错误，因为在程序退出时通常无法有效处理
		_ = logger.Sync()
	}
}

// Log 是核心的结构化日志记录函数。
// levelStr: 日志级别 ("debug", "info", "warn", "error", "dpanic", "panic", "fatal") - 不区分大小写。
// key:      结构化日志字段的键名。
// value:    结构化日志字段的值 (任意类型)。
func Log(levelStr string, key string, value interface{}) {
	if logger == nil {
		// 作为后备措施，如果忘记调用 InitLogger，尝试初始化。
		// 但强烈建议在应用程序启动时显式调用 InitLogger。
		fmt.Fprintln(os.Stderr, "Warning: logutil.Log called before logutil.InitLogger(). Initializing with default production logger.")
		InitLogger()
		// 再次检查，如果初始化仍然失败，则无法记录
		if logger == nil {
			fmt.Fprintf(os.Stderr, "FATAL: Logger initialization failed, cannot log message. Key: %s\n", key)
			return // 或者根据情况 panic/exit
		}
	}

	// 将字符串级别安全地转换为 zapcore.Level
	var level zapcore.Level
	err := level.UnmarshalText([]byte(strings.ToLower(levelStr))) // 使用 zap 内建的方法解析级别字符串

	if err != nil {
		// 如果级别字符串无效，记录一个警告，并使用 InfoLevel 作为默认值
		logger.Warn("Unknown log level provided, using INFO level as default",
			zap.String("providedLevel", levelStr),
			zap.Error(err),
			zap.String("originalKey", key), // 包含原始 key/value 以免信息丢失
			zap.Any("originalValue", value),
		)
		level = zapcore.InfoLevel // 默认回退到 Info
	}

	// 使用 zap.Any 创建结构化字段，它能处理各种类型
	field := zap.Any(key, value)

	// 根据级别记录日志。使用 Check API 可以避免在级别被禁用时构建日志条目的开销。
	// 注意：Check API 对于 Fatal 和 Panic 级别也会正确处理退出或 panic 行为。
	// 我们提供一个空字符串 "" 作为主消息，因为关键信息在字段中。
	if ce := logger.Check(level, ""); ce != nil {
		ce.Write(field)
	}
}

// --- 可选：提供便捷的辅助函数 ---

// Debug 记录 Debug 级别的日志 (如果当前级别允许)。
func Debug(key string, value interface{}) {
	Log("debug", key, value)
}

// Info 记录 Info 级别的日志。
func Info(key string, value interface{}) {
	Log("info", key, value)
}

// Warn 记录 Warn 级别的日志。
func Warn(key string, value interface{}) {
	Log("warn", key, value)
}

// Error 记录 Error 级别的日志。通常 value 可以是一个 error 类型。
func Error(key string, value interface{}) {
	Log("error", key, value)
}

// Fatal 记录 Fatal 级别的日志，然后调用 os.Exit(1)。
func Fatal(key string, value interface{}) {
	Log("fatal", key, value)
}

// Panic 记录 Panic 级别的日志，然后引发 panic。
func Panic(key string, value interface{}) {
	Log("panic", key, value)
}