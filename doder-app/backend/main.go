package main

import (
	"log"
	"os"

	"movie-booking-system/config"
	"movie-booking-system/routes"
	"movie-booking-system/services"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// โหลด .env file
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// เชื่อมต่อ database
	config.ConnectDB()
	defer config.CloseDB()

	// สร้าง Gin router
	r := gin.Default()

	// CORS middleware (อนุญาตให้ frontend เข้าถึง API)
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// รูป
	r.Static("/uploads", "./uploads")

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"message": "API Server is running",
			"status":  "healthy",
		})
	})

	//Setup routes
	db := config.GetDB()

	//Cron Jobs (Auto-cancel expired reservations)
	cronService := services.NewCronService(db)
	cronService.StartCronJobs()

	routes.SetupRoutes(r, db, cronService)

	// Start serevr
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server is running on port %s", port)

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
