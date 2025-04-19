// audit-service/repositories/edgeone_repository.go
package repositories

import (
	"audit-service/models"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// EdgeOneLogRepository EdgeOne日志仓库接口
type EdgeOneLogRepository interface {
	SaveLog(log *models.EdgeOneLogEntry) error
	FindByID(requestID string) (*models.EdgeOneLogEntry, error)
	Find(filter map[string]interface{}, page, pageSize int) ([]*models.EdgeOneLogEntry, int64, error)
	GetStatistics(startTime, endTime time.Time) (map[string]interface{}, error)
	GetHosts() ([]string, error)
}

// mongoEdgeOneLogRepository MongoDB EdgeOne日志仓库实现
type mongoEdgeOneLogRepository struct {
	client   *mongo.Client
	database string
}

// NewMongoEdgeOneLogRepository 创建MongoDB EdgeOne日志仓库
func NewMongoEdgeOneLogRepository(client *mongo.Client, database string) EdgeOneLogRepository {
	return &mongoEdgeOneLogRepository{
		client:   client,
		database: database,
	}
}

// 获取EdgeOne日志集合
func (r *mongoEdgeOneLogRepository) getCollection() *mongo.Collection {
	return r.client.Database(r.database).Collection("edgeone_logs")
}

// SaveLog 保存EdgeOne日志
func (r *mongoEdgeOneLogRepository) SaveLog(log *models.EdgeOneLogEntry) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 查找是否已存在相同RequestID的记录
	filter := bson.M{"RequestID": log.RequestID}
	update := bson.M{"$set": log}
	opts := options.Update().SetUpsert(true)

	_, err := r.getCollection().UpdateOne(ctx, filter, update, opts)
	return err
}

// FindByID 根据RequestID查找日志
func (r *mongoEdgeOneLogRepository) FindByID(requestID string) (*models.EdgeOneLogEntry, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var log models.EdgeOneLogEntry
	err := r.getCollection().FindOne(ctx, bson.M{"RequestID": requestID}).Decode(&log)
	if err != nil {
		return nil, err
	}

	return &log, nil
}

// Find 查找EdgeOne日志
func (r *mongoEdgeOneLogRepository) Find(filter map[string]interface{}, page, pageSize int) ([]*models.EdgeOneLogEntry, int64, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 构建查询
	query := bson.M{}
	for key, value := range filter {
		query[key] = value
	}

	// 创建选项
	opts := options.Find().
		SetSort(bson.M{"LogTime": -1}).
		SetSkip(int64((page - 1) * pageSize)).
		SetLimit(int64(pageSize))

	// 查询日志
	cursor, err := r.getCollection().Find(ctx, query, opts)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(ctx)

	// 解码日志
	var logs []*models.EdgeOneLogEntry
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

// GetHosts 获取所有Host列表
func (r *mongoEdgeOneLogRepository) GetHosts() ([]string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// 聚合查询
	cursor, err := r.getCollection().Distinct(ctx, "RequestHost", bson.M{})
	if err != nil {
		return nil, err
	}

	// 转换为字符串数组
	hosts := make([]string, 0)
	for _, v := range cursor {
		if s, ok := v.(string); ok {
			hosts = append(hosts, s)
		}
	}

	return hosts, nil
}

// GetStatistics 获取EdgeOne统计信息
func (r *mongoEdgeOneLogRepository) GetStatistics(startTime, endTime time.Time) (map[string]interface{}, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 构建时间范围查询
	timeRange := bson.M{
		"LogTime": bson.M{
			"$gte": startTime.Format(time.RFC3339),
			"$lte": endTime.Format(time.RFC3339),
		},
	}

	// 统计总请求数
	totalCount, err := r.getCollection().CountDocuments(ctx, timeRange)
	if err != nil {
		return nil, err
	}

	// 统计状态码分布
	statusCodePipeline := mongo.Pipeline{
		{{"$match", timeRange}},
		{{"$group", bson.M{
			"_id":   "$EdgeResponseStatusCode",
			"count": bson.M{"$sum": 1},
		}}},
		{{"$sort", bson.M{"count": -1}}},
	}

	statusCodeCursor, err := r.getCollection().Aggregate(ctx, statusCodePipeline)
	if err != nil {
		return nil, err
	}
	defer statusCodeCursor.Close(ctx)

	var statusCodeStats []bson.M
	if err = statusCodeCursor.All(ctx, &statusCodeStats); err != nil {
		return nil, err
	}

	// 统计Host分布
	hostPipeline := mongo.Pipeline{
		{{"$match", timeRange}},
		{{"$group", bson.M{
			"_id":   "$RequestHost",
			"count": bson.M{"$sum": 1},
		}}},
		{{"$sort", bson.M{"count": -1}}},
		{{"$limit", 10}},
	}

	hostCursor, err := r.getCollection().Aggregate(ctx, hostPipeline)
	if err != nil {
		return nil, err
	}
	defer hostCursor.Close(ctx)

	var hostStats []bson.M
	if err = hostCursor.All(ctx, &hostStats); err != nil {
		return nil, err
	}

	// 统计客户端地区分布
	regionPipeline := mongo.Pipeline{
		{{"$match", timeRange}},
		{{"$group", bson.M{
			"_id":   "$ClientRegion",
			"count": bson.M{"$sum": 1},
		}}},
		{{"$sort", bson.M{"count": -1}}},
		{{"$limit", 10}},
	}

	regionCursor, err := r.getCollection().Aggregate(ctx, regionPipeline)
	if err != nil {
		return nil, err
	}
	defer regionCursor.Close(ctx)

	var regionStats []bson.M
	if err = regionCursor.All(ctx, &regionStats); err != nil {
		return nil, err
	}

	// 统计安全动作分布
	securityPipeline := mongo.Pipeline{
		{{"$match", timeRange}},
		{{"$group", bson.M{
			"_id":   "$SecurityAction",
			"count": bson.M{"$sum": 1},
		}}},
		{{"$sort", bson.M{"count": -1}}},
	}

	securityCursor, err := r.getCollection().Aggregate(ctx, securityPipeline)
	if err != nil {
		return nil, err
	}
	defer securityCursor.Close(ctx)

	var securityStats []bson.M
	if err = securityCursor.All(ctx, &securityStats); err != nil {
		return nil, err
	}

	// 按时间分组统计请求量
	// 根据时间范围自动选择分组粒度
	var timeFormat string
	var groupID bson.M

	// 计算时间范围
	duration := endTime.Sub(startTime)

	if duration.Hours() <= 24 {
		// 小于1天，按小时分组
		timeFormat = "%Y-%m-%d %H:00"
		groupID = bson.M{
			"$substr": []interface{}{"$LogTime", 0, 13},
		}
	} else if duration.Hours() <= 24*7 {
		// 小于1周，按天分组
		timeFormat = "%Y-%m-%d"
		groupID = bson.M{
			"$substr": []interface{}{"$LogTime", 0, 10},
		}
	} else {
		// 大于1周，按周分组
		timeFormat = "week"
		groupID = bson.M{
			"$substr": []interface{}{"$LogTime", 0, 7},
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
		"total_count":  totalCount,
		"status_codes": statusCodeStats,
		"hosts":        hostStats,
		"regions":      regionStats,
		"security":     securityStats,
		"time_series":  timeStats,
		"time_format":  timeFormat,
	}

	return result, nil
}