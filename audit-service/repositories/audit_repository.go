package repositories

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"

	"audit-service/models"
)

// AuditRepository 审计日志仓库接口
type AuditRepository interface {
	SaveLog(log *models.AuditLog) error
	FindByID(id string) (*models.AuditLog, error)
	Find(filter map[string]interface{}, page, pageSize int) ([]*models.AuditLog, int64, error)
	GetEventTypes() ([]string, error)
	GetServiceNames() ([]string, error)
	GetStatistics(startTime, endTime time.Time) (map[string]interface{}, error)
}

// mongoAuditRepository MongoDB审计日志仓库
type mongoAuditRepository struct {
	client   *mongo.Client
	database string
}

// NewMongoAuditRepository 创建MongoDB审计日志仓库
func NewMongoAuditRepository(client *mongo.Client, database string) AuditRepository {
	return &mongoAuditRepository{
		client:   client,
		database: database,
	}
}

// getCollection 获取审计日志集合
func (r *mongoAuditRepository) getCollection() *mongo.Collection {
	return r.client.Database(r.database).Collection("audit_logs")
}

// SaveLog 保存审计日志
func (r *mongoAuditRepository) SaveLog(log *models.AuditLog) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 确保ID为空以便MongoDB生成
	log.ID = primitive.ObjectID{}

	_, err := r.getCollection().InsertOne(ctx, log)
	return err
}

// FindByID 根据ID查找日志
func (r *mongoAuditRepository) FindByID(id string) (*models.AuditLog, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var log models.AuditLog

	// 转换ID为ObjectID
	objectID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	err = r.getCollection().FindOne(ctx, bson.M{"_id": objectID}).Decode(&log)
	if err != nil {
		return nil, err
	}

	return &log, nil
}

// Find 查找审计日志
func (r *mongoAuditRepository) Find(filter map[string]interface{}, page, pageSize int) ([]*models.AuditLog, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 构建查询
	query := bson.M{}
	for key, value := range filter {
		query[key] = value
	}

	// 创建选项
	opts := options.Find().
		SetSort(bson.M{"timestamp": -1}).
		SetSkip(int64((page - 1) * pageSize)).
		SetLimit(int64(pageSize))

	// 查询日志
	cursor, err := r.getCollection().Find(ctx, query, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	// 解码日志
	var logs []*models.AuditLog
	if err = cursor.All(ctx, &logs); err != nil {
		return nil, 0, err
	}

	// 获取总数
	count, err := r.getCollection().CountDocuments(ctx, query)
	if err != nil {
		return nil, 0, err
	}

	return logs, count, nil
}

// GetEventTypes 获取所有事件类型
func (r *mongoAuditRepository) GetEventTypes() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 聚合查询
	cursor, err := r.getCollection().Distinct(ctx, "event_type", bson.M{})
	if err != nil {
		return nil, err
	}

	// 转换为字符串数组
	eventTypes := make([]string, 0)
	for _, v := range cursor {
		if s, ok := v.(string); ok {
			eventTypes = append(eventTypes, s)
		}
	}

	return eventTypes, nil
}

// GetServiceNames 获取所有服务名称
func (r *mongoAuditRepository) GetServiceNames() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 聚合查询
	cursor, err := r.getCollection().Distinct(ctx, "service_name", bson.M{})
	if err != nil {
		return nil, err
	}

	// 转换为字符串数组
	serviceNames := make([]string, 0)
	for _, v := range cursor {
		if s, ok := v.(string); ok {
			serviceNames = append(serviceNames, s)
		}
	}

	return serviceNames, nil
}

// GetStatistics 获取审计统计信息
func (r *mongoAuditRepository) GetStatistics(startTime, endTime time.Time) (map[string]interface{}, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 构建基础查询
	timeRange := bson.M{
		"timestamp": bson.M{
			"$gte": startTime,
			"$lte": endTime,
		},
	}

	// 统计总日志数
	totalCount, err := r.getCollection().CountDocuments(ctx, timeRange)
	if err != nil {
		return nil, err
	}

	// 统计事件类型分布
	eventTypePipeline := mongo.Pipeline{
		{{"$match", timeRange}},
		{{"$group", bson.M{
			"_id":   "$event_type",
			"count": bson.M{"$sum": 1},
		}}},
		{{"$sort", bson.M{"count": -1}}},
	}

	eventTypeCursor, err := r.getCollection().Aggregate(ctx, eventTypePipeline)
	if err != nil {
		return nil, err
	}
	defer eventTypeCursor.Close(ctx)

	var eventTypeStats []bson.M
	if err = eventTypeCursor.All(ctx, &eventTypeStats); err != nil {
		return nil, err
	}

	// 统计服务分布
	servicePipeline := mongo.Pipeline{
		{{"$match", timeRange}},
		{{"$group", bson.M{
			"_id":   "$service_name",
			"count": bson.M{"$sum": 1},
		}}},
		{{"$sort", bson.M{"count": -1}}},
	}

	serviceCursor, err := r.getCollection().Aggregate(ctx, servicePipeline)
	if err != nil {
		return nil, err
	}
	defer serviceCursor.Close(ctx)

	var serviceStats []bson.M
	if err = serviceCursor.All(ctx, &serviceStats); err != nil {
		return nil, err
	}

	// 统计结果分布
	resultPipeline := mongo.Pipeline{
		{{"$match", timeRange}},
		{{"$group", bson.M{
			"_id":   "$result",
			"count": bson.M{"$sum": 1},
		}}},
	}

	resultCursor, err := r.getCollection().Aggregate(ctx, resultPipeline)
	if err != nil {
		return nil, err
	}
	defer resultCursor.Close(ctx)

	var resultStats []bson.M
	if err = resultCursor.All(ctx, &resultStats); err != nil {
		return nil, err
	}

	// 按时间分组统计
	// 根据时间范围自动选择分组粒度
	var timeFormat string
	var groupID bson.M

	// 计算时间范围
	duration := endTime.Sub(startTime)

	if duration.Hours() <= 24 {
		// 小于1天，按小时分组
		timeFormat = "%Y-%m-%d %H:00"
		groupID = bson.M{
			"$dateToString": bson.M{
				"format": timeFormat,
				"date":   "$timestamp",
			},
		}
	} else if duration.Hours() <= 24*7 {
		// 小于1周，按天分组
		timeFormat = "%Y-%m-%d"
		groupID = bson.M{
			"$dateToString": bson.M{
				"format": timeFormat,
				"date":   "$timestamp",
			},
		}
	} else {
		// 大于1周，按周分组
		groupID = bson.M{
			"year": bson.M{"$year": "$timestamp"},
			"week": bson.M{"$week": "$timestamp"},
		}
	}

	timePipeline := mongo.Pipeline{
		{{"$match", timeRange}},
		{{"$group", bson.M{
			"_id":   groupID,
			"count": bson.M{"$sum": 1},
		}}},
		{{"$sort", bson.M{"_id": 1}}},
	}

	timeCursor, err := r.getCollection().Aggregate(ctx, timePipeline)
	if err != nil {
		return nil, err
	}
	defer timeCursor.Close(ctx)

	var timeStats []bson.M
	if err = timeCursor.All(ctx, &timeStats); err != nil {
		return nil, err
	}

	// 组装结果
	result := map[string]interface{}{
		"total_count": totalCount,
		"event_types": eventTypeStats,
		"services":    serviceStats,
		"results":     resultStats,
		"time_series": timeStats,
		"time_format": timeFormat,
	}

	return result, nil
}
