// audit-service/migrations/003_create_edgeone_logs_collection.go
package migrations

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// CreateEdgeOneLogsCollection 创建EdgeOne日志集合并设置索引
func CreateEdgeOneLogsCollection(client *mongo.Client, dbName string) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// 获取数据库和集合
	db := client.Database(dbName)
	collection := db.Collection("edgeone_logs")

	// 创建索引
	indexes := []mongo.IndexModel{
		{
			Keys: bson.D{
				{Key: "RequestID", Value: 1},
			},
			Options: options.Index().SetUnique(true),
		},
		{
			Keys: bson.D{
				{Key: "LogTime", Value: -1},
			},
		},
		{
			Keys: bson.D{
				{Key: "ClientIP", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "RequestHost", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "EdgeResponseStatusCode", Value: 1},
			},
		},
		{
			Keys: bson.D{
				{Key: "SecurityAction", Value: 1},
			},
		},
	}

	// 创建索引
	_, err := collection.Indexes().CreateMany(ctx, indexes)
	if err != nil {
		return err
	}

	log.Println("EdgeOne日志集合和索引创建成功")
	return nil
}