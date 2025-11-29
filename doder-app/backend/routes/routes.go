package routes

import (
	"database/sql"

	"movie-booking-system/handlers"
	"movie-booking-system/services"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, db *sql.DB, cronService *services.CronService) {

	cinemaHandler := handlers.NewCinemaHandler(db)
	movieHandler := handlers.NewMovieHandler(db)
	theaterHandler := handlers.NewTheaterHandler(db)
	showtimeHandler := handlers.NewShowtimeHandler(db)
	seatHandler := handlers.NewSeatHandler(db)
	cronHandler := handlers.NewCronHandler(cronService)
	uploadHandler := handlers.NewUploadHandler()
	authHandler := handlers.NewAuthHandler(db)
	authMiddleware := handlers.AuthMiddleware()
	adminMiddleware := handlers.AdminMiddleware()

	api := router.Group("/api")
	{
		// Authen
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.GET("/profile", authMiddleware, authHandler.GetProfile)
		}

		// Public

		// Movies
		api.GET("/movies", movieHandler.GetAllMovies)
		api.GET("/movies/:id", movieHandler.GetMovieByID)

		// Cinemas
		api.GET("/cinemas", cinemaHandler.GetAllCinemas)
		api.GET("/cinemas/:id", cinemaHandler.GetCinemaByID)

		// Theaters
		api.GET("/theaters", theaterHandler.GetAllTheaters)
		api.GET("/theaters/:id", theaterHandler.GetTheaterByID)

		// Showtimes
		api.GET("/showtimes", showtimeHandler.GetAllShowtimes)
		api.GET("/showtimes/:id", showtimeHandler.GetShowtimeByID)

		// Seats
		api.GET("/seats", seatHandler.GetAllSeats)
		api.GET("/seats/:id", seatHandler.GetSeatByID)

		// Admin
		admin := api.Group("/admin", authMiddleware, adminMiddleware)
		{
			// Movies
			admin.POST("/movies", movieHandler.CreateMovie)
			admin.PUT("/movies/:id", movieHandler.UpdateMovie)
			admin.DELETE("/movies/:id", movieHandler.DeleteMovie)

			// Cinemas
			admin.POST("/cinemas", cinemaHandler.CreateCinema)
			admin.PUT("/cinemas/:id", cinemaHandler.UpdateCinema)
			admin.DELETE("/cinemas/:id", cinemaHandler.DeleteCinema)

			// Theaters
			admin.POST("/theaters", theaterHandler.CreateTheater)
			admin.PUT("/theaters/:id", theaterHandler.UpdateTheater)
			admin.DELETE("/theaters/:id", theaterHandler.DeleteTheater)

			// Showtimes
			admin.POST("/showtimes", showtimeHandler.CreateShowtime)
			admin.PUT("/showtimes/:id", showtimeHandler.UpdateShowtime)
			admin.DELETE("/showtimes/:id", showtimeHandler.DeleteShowtime)

			// Seats
			admin.POST("/seats", seatHandler.CreateSeat)
			admin.POST("/seats/bulk", seatHandler.CreateSeatsInBulk)
			admin.PUT("/seats/:id", seatHandler.UpdateSeat)
			admin.DELETE("/seats/:id", seatHandler.DeleteSeat)

			// Cron
			admin.GET("/cron/status", cronHandler.GetCronStatus)
			admin.POST("/cron/cancel-expired", cronHandler.TriggerCancelExpiredReservations)

			// Upload
			admin.POST("/upload/poster", uploadHandler.UploadPoster)
			admin.DELETE("/upload/poster/:filename", uploadHandler.DeletePoster)
		}
	}
}
