// models/edgeone_log.go
package models

// EdgeOneLogEntry 代表一条从腾讯云 EdgeOne 推送过来的实时日志记录
// 根据官方文档字段定义
type EdgeOneLogEntry struct {
	// --- 通用信息 ---
	RequestID              string `json:"RequestID,omitempty"`              // 客户端请求的唯一标识 ID
	LogTime                string `json:"LogTime,omitempty"`                // 日志记录的时间，ISO-8601 格式 (string类型便于直接接收，后续可解析为 time.Time)
	EdgeEndTime            string `json:"EdgeEndTime,omitempty"`            // 完成响应客户端请求的时间，ISO-8601 格式 (string类型，后续可解析)
	ParentRequestID        string `json:"ParentRequestID,omitempty"`        // 父请求的 RequestID (若为边缘函数子请求，否则为 "-")
	EdgeFunctionSubrequest int    `json:"EdgeFunctionSubrequest,omitempty"` // 是否边缘函数子请求 (1:是, 0:否)
	ContentID              string `json:"ContentID,omitempty"`              // 内容标识符，用于计费等

	// --- 客户端信息 ---
	ClientIP           string `json:"ClientIP,omitempty"`           // 客户端 IP
	ClientRegion       string `json:"ClientRegion,omitempty"`       // 客户端区域 (ISO-3166-2)
	ClientState        string `json:"ClientState,omitempty"`        // 客户端省份/州
	ClientISP          string `json:"ClientISP,omitempty"`          // 客户端运营商
	ClientDeviceType   string `json:"ClientDeviceType,omitempty"`   // 客户端设备类型
	ClientPort         int    `json:"ClientPort,omitempty"`         // 客户端端口
	ClientConnectionID string `json:"ClientConnectionID,omitempty"` // 客户端连接 ID

	// --- 请求信息 ---
	RequestTime           string `json:"RequestTime,omitempty"`           // 客户端请求时间 (UTC, ISO-8601) (string类型，后续可解析)
	RequestHost           string `json:"RequestHost,omitempty"`           // 请求 Host
	RequestBytes          int64  `json:"RequestBytes,omitempty"`          // 请求大小 (Byte)
	RequestMethod         string `json:"RequestMethod,omitempty"`         // HTTP Method
	RequestUrl            string `json:"RequestUrl,omitempty"`            // 请求 URL
	RequestUrlQueryString string `json:"RequestUrlQueryString,omitempty"` // URL 查询参数
	RequestUA             string `json:"RequestUA,omitempty"`             // User-Agent
	RequestRange          string `json:"RequestRange,omitempty"`          // Range 参数
	RequestReferer        string `json:"RequestReferer,omitempty"`        // Referer
	RequestProtocol       string `json:"RequestProtocol,omitempty"`       // 应用层协议 (HTTP/1.1, HTTP/2, etc.)
	RemotePort            int    `json:"RemotePort,omitempty"`            // TCP 协议下客户端与节点建连端口 (若无则为?) - 文档描述为'-'，但类型为Int，接收时需注意兼容性，或用 interface{}
	RequestSSLProtocol    string `json:"RequestSSLProtocol,omitempty"`    // 使用的 SSL/TLS 协议 (若无则为 "-")
	RequestBodyBytes      int64  `json:"RequestBodyBytes,omitempty"`      // 请求 Body 大小 (Byte)
	RequestStatus         string `json:"RequestStatus,omitempty"`         // 客户端请求状态 (0:未结束, 1:正常结束, 2:WS首条, 3:WS中间条)
	RequestScheme         string `json:"RequestScheme,omitempty"`         // HTTP 协议 (HTTP, HTTPS)

	// --- 响应信息 ---
	EdgeCacheStatus        string `json:"EdgeCacheStatus,omitempty"`        // 缓存状态 (hit, miss, dynamic, other)
	EdgeResponseStatusCode int    `json:"EdgeResponseStatusCode,omitempty"` // 节点响应状态码
	EdgeResponseBytes      int64  `json:"EdgeResponseBytes,omitempty"`      // 节点响应大小 (Byte)
	EdgeResponseTime       int64  `json:"EdgeResponseTime,omitempty"`       // 整体耗时 (ms)
	EdgeInternalTime       int64  `json:"EdgeInternalTime,omitempty"`       // 响应首字节耗时 (ms)
	EdgeResponseBodyBytes  int64  `json:"EdgeResponseBodyBytes,omitempty"`  // 节点响应 Body 大小 (Byte)

	// --- 边缘服务端信息 ---
	EdgeServerID                string `json:"EdgeServerID,omitempty"`                // EdgeOne 服务器 ID
	EdgeServerIP                string `json:"EdgeServerIP,omitempty"`                // EdgeOne 服务器 IP
	EdgeSeverRegion             string `json:"EdgeSeverRegion,omitempty"`             // EdgeOne 节点区域 (ISO-3166-2)
	EdgeServerRegionTopDivision string `json:"EdgeServerRegionTopDivision,omitempty"` // EdgeOne 节点省份/州 (ISO-3166-2)
	EdgeException               string `json:"EdgeException,omitempty"`               // 节点处理请求遇到的问题

	// --- 源站信息 ---
	OriginDNSResponseDuration       float64 `json:"OriginDNSResponseDuration,omitempty"`       // 源站 DNS 解析耗时 (ms, -1表示无或失败)
	OriginIP                        string  `json:"OriginIP,omitempty"`                        // 回源 IP (无则为 "-")
	OriginRequestHeaderSendDuration float64 `json:"OriginRequestHeaderSendDuration,omitempty"` // 源站请求头发送耗时 (ms, -1表示无或失败)
	OriginSSLProtocol               string  `json:"OriginSSLProtocol,omitempty"`               // 回源 SSL 协议 (无则为 "-")
	OriginTCPHandshakeDuration      float64 `json:"OriginTCPHandshakeDuration,omitempty"`      // 源站 TCP 握手耗时 (ms, -1表示无或失败)
	OriginTLSHandshakeDuration      float64 `json:"OriginTLSHandshakeDuration,omitempty"`      // 源站 TLS 握手耗时 (ms, -1表示无或失败)
	OriginResponseHeaderDuration    float64 `json:"OriginResponseHeaderDuration,omitempty"`    // 源站响应头耗时 (ms, -1表示无或失败)
	OriginResponseStatusCode        int     `json:"OriginResponseStatusCode,omitempty"`        // 源站响应码 (-1表示无或失败)

	// --- 安全防护信息 ---
	BotClassAttacker        string `json:"BotClassAttacker,omitempty"`        // Bot 分类 - Attacker 风险等级 (high, medium, low, -)
	BotClassProxy           string `json:"BotClassProxy,omitempty"`           // Bot 分类 - Proxy 风险等级 (high, medium, low, -)
	BotClassScanner         string `json:"BotClassScanner,omitempty"`         // Bot 分类 - Scanner 风险等级 (high, medium, low, -)
	BotClassAccountTakeOver string `json:"BotClassAccountTakeOver,omitempty"` // Bot 分类 - AccountTakeOver 风险等级 (high, medium, low, -)
	BotClassMaliciousBot    string `json:"BotClassMaliciousBot,omitempty"`    // Bot 分类 - MaliciousBot 风险等级 (high, medium, low, -)
	SecurityModule          string `json:"SecurityModule,omitempty"`          // 最终处置的安全模块名称
	SecurityRuleID          string `json:"SecurityRuleID,omitempty"`          // 最终处置的安全规则 ID
	SecurityAction          string `json:"SecurityAction,omitempty"`          // 最终处置动作 (Monitor, Deny, Allow, etc.)
	BotTag                  string `json:"BotTag,omitempty"`                  // Bot 智能分析标签 (evil_bot, suspect_bot, good_bot, normal, -)
	BotCharacteristic       string `json:"BotCharacteristic,omitempty"`       // Bot 智能分析特征
	JA3Hash                 string `json:"JA3Hash,omitempty"`                 // JA3 指纹 Hash
}