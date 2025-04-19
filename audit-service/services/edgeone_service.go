// audit-service/services/edgeone_service.go
package services

import (
	"audit-service/models"
	"audit-service/repositories"
	"go.mongodb.org/mongo-driver/bson"
	"time"
)

// EdgeOneLogFilter EdgeOne日志过滤条件
type EdgeOneLogFilter struct {
	StartTime              time.Time
	EndTime                time.Time
	RequestID              string
	ClientIP               string
	ClientRegion           string
	RequestHost            string
	RequestMethod          string
	RequestUrl             string
	EdgeResponseStatusCode int
	SecurityAction         string
	BotTag                 string
}

// EdgeOneLogService EdgeOne日志服务接口
type EdgeOneLogService interface {
	SaveLog(log *models.EdgeOneLogEntry) error
	GetLog(requestID string) (*models.EdgeOneLogEntry, error)
	GetLogs(filter EdgeOneLogFilter, page, pageSize int) ([]*models.EdgeOneLogEntry, int64, error)
	GetHosts() ([]string, error)
	GetStatistics(filter EdgeOneLogFilter) (map[string]interface{}, error)
}

// edgeOneLogService EdgeOne日志服务实现
type edgeOneLogService struct {
	repo repositories.EdgeOneLogRepository
}

// NewEdgeOneLogService 创建EdgeOne日志服务实例
func NewEdgeOneLogService(repo repositories.EdgeOneLogRepository) EdgeOneLogService {
	return &edgeOneLogService{
		repo: repo,
	}
}

// SaveLog 保存EdgeOne日志
func (s *edgeOneLogService) SaveLog(log *models.EdgeOneLogEntry) error {
	return s.repo.SaveLog(log)
}

// GetLog 获取单个EdgeOne日志
func (s *edgeOneLogService) GetLog(requestID string) (*models.EdgeOneLogEntry, error) {
	return s.repo.FindByID(requestID)
}

// GetLogs 获取EdgeOne日志列表
func (s *edgeOneLogService) GetLogs(filter EdgeOneLogFilter, page, pageSize int) ([]*models.EdgeOneLogEntry, int64, error) {
	// 构建查询条件
	queryFilter := make(map[string]interface{})

	// 时间范围
	if !filter.StartTime.IsZero() || !filter.EndTime.IsZero() {
		timeFilter := make(map[string]interface{})
		if !filter.StartTime.IsZero() {
			timeFilter["$gte"] = filter.StartTime.Format(time.RFC3339)
		}
		if !filter.EndTime.IsZero() {
			timeFilter["$lte"] = filter.EndTime.Format(time.RFC3339)
		}
		queryFilter["LogTime"] = timeFilter
	}

	// 其他过滤条件
	if filter.RequestID != "" {
		queryFilter["RequestID"] = filter.RequestID
	}
	if filter.ClientIP != "" {
		queryFilter["ClientIP"] = filter.ClientIP
	}
	if filter.ClientRegion != "" {
		queryFilter["ClientRegion"] = filter.ClientRegion
	}
	if filter.RequestHost != "" {
		queryFilter["RequestHost"] = filter.RequestHost
	}
	if filter.RequestMethod != "" {
		queryFilter["RequestMethod"] = filter.RequestMethod
	}
	if filter.RequestUrl != "" {
		queryFilter["RequestUrl"] = bson.M{"$regex": filter.RequestUrl, "$options": "i"}
	}
	if filter.EdgeResponseStatusCode > 0 {
		queryFilter["EdgeResponseStatusCode"] = filter.EdgeResponseStatusCode
	}
	if filter.SecurityAction != "" {
		queryFilter["SecurityAction"] = filter.SecurityAction
	}
	if filter.BotTag != "" {
		queryFilter["BotTag"] = filter.BotTag
	}

	return s.repo.Find(queryFilter, page, pageSize)
}

// GetHosts 获取Host列表
func (s *edgeOneLogService) GetHosts() ([]string, error) {
	return s.repo.GetHosts()
}

// GetStatistics 获取EdgeOne统计信息
func (s *edgeOneLogService) GetStatistics(filter EdgeOneLogFilter) (map[string]interface{}, error) {
	// 验证时间范围
	startTime := filter.StartTime
	endTime := filter.EndTime

	if startTime.IsZero() {
		startTime = time.Now().AddDate(0, 0, -7) // 默认7天
	}

	if endTime.IsZero() {
		endTime = time.Now()
	}

	return s.repo.GetStatistics(startTime, endTime)
}