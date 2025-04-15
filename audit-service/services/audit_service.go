package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"time"

	"github.com/xuri/excelize/v2"

	"audit-service/models"
	"audit-service/repositories"
)

// AuditLogFilter 审计日志过滤条件
type AuditLogFilter struct {
	StartTime    time.Time
	EndTime      time.Time
	UserID       string
	Username     string
	EventType    string
	ServiceName  string
	Result       string
	ResourceType string
	ResourceID   string
	ClientIP     string
}

// AuditService 审计服务接口
type AuditService interface {
	SaveAuditLog(log *models.AuditLog) error
	GetAuditLog(id string) (*models.AuditLog, error)
	GetAuditLogs(filter AuditLogFilter, page, pageSize int) ([]*models.AuditLog, int64, error)
	ExportAuditLogs(filter AuditLogFilter, format string) ([]byte, string, error)
	GetEventTypes() ([]string, error)
	GetServiceNames() ([]string, error)
	GetStatistics(filter AuditLogFilter) (map[string]interface{}, error)
}

// auditService 审计服务实现
type auditService struct {
	repo repositories.AuditRepository
}

// NewAuditService 创建审计服务实例
func NewAuditService(repo repositories.AuditRepository) AuditService {
	return &auditService{
		repo: repo,
	}
}

// SaveAuditLog 保存审计日志
func (s *auditService) SaveAuditLog(log *models.AuditLog) error {
	return s.repo.SaveLog(log)
}

// GetAuditLog 获取单个审计日志
func (s *auditService) GetAuditLog(id string) (*models.AuditLog, error) {
	return s.repo.FindByID(id)
}

// GetAuditLogs 获取审计日志列表
func (s *auditService) GetAuditLogs(filter AuditLogFilter, page, pageSize int) ([]*models.AuditLog, int64, error) {
	// 构建查询条件
	queryFilter := make(map[string]interface{})

	// 时间范围
	if !filter.StartTime.IsZero() || !filter.EndTime.IsZero() {
		timeFilter := make(map[string]interface{})
		if !filter.StartTime.IsZero() {
			timeFilter["$gte"] = filter.StartTime
		}
		if !filter.EndTime.IsZero() {
			timeFilter["$lte"] = filter.EndTime
		}
		queryFilter["timestamp"] = timeFilter
	}

	// 其他过滤条件
	if filter.UserID != "" {
		queryFilter["user_id"] = filter.UserID
	}
	if filter.Username != "" {
		queryFilter["username"] = filter.Username
	}
	if filter.EventType != "" {
		queryFilter["event_type"] = filter.EventType
	}
	if filter.ServiceName != "" {
		queryFilter["service_name"] = filter.ServiceName
	}
	if filter.Result != "" {
		queryFilter["result"] = filter.Result
	}
	if filter.ResourceType != "" {
		queryFilter["resource_type"] = filter.ResourceType
	}
	if filter.ResourceID != "" {
		queryFilter["resource_id"] = filter.ResourceID
	}
	if filter.ClientIP != "" {
		queryFilter["client_ip"] = filter.ClientIP
	}

	return s.repo.Find(queryFilter, page, pageSize)
}

// ExportAuditLogs 导出审计日志
func (s *auditService) ExportAuditLogs(filter AuditLogFilter, format string) ([]byte, string, error) {
	// 获取所有符合条件的日志
	logs, _, err := s.GetAuditLogs(filter, 1, 1000)
	if err != nil {
		return nil, "", err
	}

	// 根据格式导出
	switch format {
	case "csv":
		return s.exportToCSV(logs)
	case "excel":
		return s.exportToExcel(logs)
	default:
		return s.exportToCSV(logs)
	}
}

// exportToCSV 导出为CSV格式
func (s *auditService) exportToCSV(logs []*models.AuditLog) ([]byte, string, error) {
	// 创建CSV写入器
	buf := new(bytes.Buffer)
	writer := csv.NewWriter(buf)

	// 写入表头
	headers := []string{
		"事件ID", "事件类型", "时间", "服务名称", "用户ID", "用户名",
		"请求ID", "客户端IP", "请求路径", "请求方法", "资源类型",
		"资源ID", "操作", "结果", "错误信息",
	}
	if err := writer.Write(headers); err != nil {
		return nil, "", err
	}

	// 写入数据
	for _, log := range logs {
		row := []string{
			log.EventID,
			log.EventType,
			log.Timestamp.Format("2006-01-02 15:04:05"),
			log.ServiceName,
			log.UserID,
			log.Username,
			log.RequestID,
			log.ClientIP,
			log.RequestPath,
			log.RequestMethod,
			log.ResourceType,
			log.ResourceID,
			log.Operation,
			log.Result,
			log.ErrorMessage,
		}
		if err := writer.Write(row); err != nil {
			return nil, "", err
		}
	}

	writer.Flush()
	if err := writer.Error(); err != nil {
		return nil, "", err
	}

	// 生成文件名
	fileName := fmt.Sprintf("audit_logs_%s.csv", time.Now().Format("20060102150405"))

	return buf.Bytes(), fileName, nil
}

// exportToExcel 导出为Excel格式
func (s *auditService) exportToExcel(logs []*models.AuditLog) ([]byte, string, error) {
	// 创建Excel工作簿
	f := excelize.NewFile()
	sheetName := "审计日志"

	// 创建工作表
	index, err := f.NewSheet(sheetName)
	if err != nil {
		return nil, "", err
	}

	// 设置默认工作表
	f.SetActiveSheet(index)

	// 写入表头
	headers := []string{
		"事件ID", "事件类型", "时间", "服务名称", "用户ID", "用户名",
		"请求ID", "客户端IP", "请求路径", "请求方法", "资源类型",
		"资源ID", "操作", "结果", "错误信息",
	}

	for i, header := range headers {
		cell := getExcelColumn(i) + "1"
		f.SetCellValue(sheetName, cell, header)
	}

	// 写入数据
	for i, log := range logs {
		row := i + 2 // 第一行是表头
		f.SetCellValue(sheetName, getExcelColumn(0)+fmt.Sprint(row), log.EventID)
		f.SetCellValue(sheetName, getExcelColumn(1)+fmt.Sprint(row), log.EventType)
		f.SetCellValue(sheetName, getExcelColumn(2)+fmt.Sprint(row), log.Timestamp.Format("2006-01-02 15:04:05"))
		f.SetCellValue(sheetName, getExcelColumn(3)+fmt.Sprint(row), log.ServiceName)
		f.SetCellValue(sheetName, getExcelColumn(4)+fmt.Sprint(row), log.UserID)
		f.SetCellValue(sheetName, getExcelColumn(5)+fmt.Sprint(row), log.Username)
		f.SetCellValue(sheetName, getExcelColumn(6)+fmt.Sprint(row), log.RequestID)
		f.SetCellValue(sheetName, getExcelColumn(7)+fmt.Sprint(row), log.ClientIP)
		f.SetCellValue(sheetName, getExcelColumn(8)+fmt.Sprint(row), log.RequestPath)
		f.SetCellValue(sheetName, getExcelColumn(9)+fmt.Sprint(row), log.RequestMethod)
		f.SetCellValue(sheetName, getExcelColumn(10)+fmt.Sprint(row), log.ResourceType)
		f.SetCellValue(sheetName, getExcelColumn(11)+fmt.Sprint(row), log.ResourceID)
		f.SetCellValue(sheetName, getExcelColumn(12)+fmt.Sprint(row), log.Operation)
		f.SetCellValue(sheetName, getExcelColumn(13)+fmt.Sprint(row), log.Result)
		f.SetCellValue(sheetName, getExcelColumn(14)+fmt.Sprint(row), log.ErrorMessage)
	}

	// 保存到内存
	buf, err := f.WriteToBuffer()
	if err != nil {
		return nil, "", err
	}

	// 生成文件名
	fileName := fmt.Sprintf("audit_logs_%s.xlsx", time.Now().Format("20060102150405"))

	return buf.Bytes(), fileName, nil
}

// getExcelColumn 获取Excel列名
func getExcelColumn(index int) string {
	colName := ""
	if index >= 26 {
		// 双字母列名 (AA-ZZ)
		colName += string(rune('A' + (index / 26) - 1))
		colName += string(rune('A' + (index % 26)))
	} else {
		// 单字母列名 (A-Z)
		colName += string(rune('A' + index))
	}
	return colName
}

// GetEventTypes 获取事件类型列表
func (s *auditService) GetEventTypes() ([]string, error) {
	return s.repo.GetEventTypes()
}

// GetServiceNames 获取服务名列表
func (s *auditService) GetServiceNames() ([]string, error) {
	return s.repo.GetServiceNames()
}

// GetStatistics 获取审计统计信息
func (s *auditService) GetStatistics(filter AuditLogFilter) (map[string]interface{}, error) {
	// 验证时间范围
	startTime := filter.StartTime
	endTime := filter.EndTime

	if startTime.IsZero() {
		startTime = time.Now().AddDate(0, 0, -30) // 默认30天
	}

	if endTime.IsZero() {
		endTime = time.Now()
	}

	return s.repo.GetStatistics(startTime, endTime)
}
