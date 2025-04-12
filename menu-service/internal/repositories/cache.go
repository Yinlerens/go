// internal/repositories/cache.go
package repositories

import (
	"sync"
	"time"
)

// Cache 缓存接口
type Cache interface {
	Get(key string) (interface{}, bool)
	Set(key string, value interface{}, expiry time.Duration)
	Delete(key string)
}

// item 缓存项
type item struct {
	value      interface{}
	expiration int64
}

// inMemoryCache 内存缓存实现
type inMemoryCache struct {
	items map[string]item
	mu    sync.RWMutex
}

// NewInMemoryCache 创建内存缓存实例
func NewInMemoryCache() Cache {
	cache := &inMemoryCache{
		items: make(map[string]item),
	}

	// 启动过期项清理协程
	go cache.cleanExpired()

	return cache
}

// Get 获取缓存项
func (c *inMemoryCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, found := c.items[key]
	if !found {
		return nil, false
	}

	// 检查是否过期
	if item.expiration > 0 && item.expiration < time.Now().UnixNano() {
		return nil, false
	}

	return item.value, true
}

// Set 设置缓存项
func (c *inMemoryCache) Set(key string, value interface{}, expiry time.Duration) {
	var expiration int64

	if expiry > 0 {
		expiration = time.Now().Add(expiry).UnixNano()
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = item{
		value:      value,
		expiration: expiration,
	}
}

// Delete 删除缓存项
func (c *inMemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// cleanExpired 定期清理过期项
func (c *inMemoryCache) cleanExpired() {
	ticker := time.NewTicker(5 * time.Minute)
	defer ticker.Stop()

	for {
		<-ticker.C
		c.mu.Lock()
		now := time.Now().UnixNano()
		for k, v := range c.items {
			if v.expiration > 0 && v.expiration < now {
				delete(c.items, k)
			}
		}
		c.mu.Unlock()
	}
}