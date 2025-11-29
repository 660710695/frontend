package handlers

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"movie-booking-system/models"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// UploadPoster อัพโหลดรูปโปสเตอร์
// POST /api/admin/upload/poster
func (h *UploadHandler) UploadPoster(c *gin.Context) {
	file, err := c.FormFile("poster")
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "กรุณาเลือกไฟล์รูปภาพ",
		})
		return
	}

	maxSize := int64(5 * 1024 * 1024)
	if file.Size > maxSize {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "ไฟล์ใหญ่เกิน 5MB",
		})
		return
	}

	ext := strings.ToLower(filepath.Ext(file.Filename))
	allowedExts := []string{".jpg", ".jpeg", ".png", ".webp"}

	isAllowed := false
	for _, allowed := range allowedExts {
		if ext == allowed {
			isAllowed = true
			break
		}
	}

	if !isAllowed {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "รองรับเฉพาะไฟล์ .jpg, .jpeg, .png, .webp เท่านั้น",
		})
		return
	}

	timestamp := time.Now().Unix()
	newFilename := fmt.Sprintf("poster_%d%s", timestamp, ext)

	uploadPath := "./uploads/posters"
	fullPath := filepath.Join(uploadPath, newFilename)

	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "ไม่สามารถสร้างโฟลเดอร์ได้",
		})
		return
	}

	if err := c.SaveUploadedFile(file, fullPath); err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "บันทึกไฟล์ไม่สำเร็จ",
		})
		return
	}

	posterURL := fmt.Sprintf("/uploads/posters/%s", newFilename)

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "อัพโหลดรูปภาพสำเร็จ",
		Data: gin.H{
			"url":           posterURL,
			"filename":      newFilename,
			"original_name": file.Filename,
			"size":          file.Size,
		},
	})
}

// DeletePoster ลบรูปโปสเตอร์
// DELETE /api/admin/upload/poster/:filename
func (h *UploadHandler) DeletePoster(c *gin.Context) {
	filename := c.Param("filename")

	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "ชื่อไฟล์ไม่ถูกต้อง",
		})
		return
	}

	filePath := filepath.Join("./uploads/posters", filename)

	if err := os.Remove(filePath); err != nil {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "ไม่พบไฟล์หรือถูกลบไปแล้ว",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "ลบรูปภาพสำเร็จ",
	})
}
