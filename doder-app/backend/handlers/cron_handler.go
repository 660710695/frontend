package handlers

import (
	"net/http"

	"movie-booking-system/models"
	"movie-booking-system/services"

	"github.com/gin-gonic/gin"
)

type CronHandler struct {
	cronService *services.CronService
}

func NewCronHandler(cronService *services.CronService) *CronHandler {
	return &CronHandler{cronService: cronService}
}

// GetCronStatus ดูสถานะ cronjob
// GET /api/admin/cron/status
func (h *CronHandler) GetCronStatus(c *gin.Context) {
	status := h.cronService.GetCronStatus()

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    status,
	})
}

// TriggerCancelExpiredReservations เรียกใช้ cronjob ด้วยตนเอง
// POST /api/admin/cron/cancel-expired
func (h *CronHandler) TriggerCancelExpiredReservations(c *gin.Context) {
	go h.cronService.CancelExpiredReservations()

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Triggered auto-cancel expired reservations",
	})
}
