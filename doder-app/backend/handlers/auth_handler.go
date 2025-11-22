package handlers

import (
	"database/sql"
	"net/http"
	"os"
	"time"

	"movie-booking-system/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	db *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{db: db}
}

// Register สมัครสมาชิกใหม่
// POST /api/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req models.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// ตรวจสอบว่า phone นี้มีอยู่แล้วหรือไม่
	var existingUserID int
	query := "SELECT user_id FROM users WHERE phone = $1"
	err := h.db.QueryRow(query, req.Phone).Scan(&existingUserID)
	if err == nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   "Phone number already registered",
		})
		return
	}
	if err != sql.ErrNoRows {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to check existing user",
		})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to hash password",
		})
		return
	}

	// สร้าง user
	insertQuery := `
		INSERT INTO users (password_hash, first_name, last_name, phone, role)
		VALUES ($1, $2, $3, $4, 'customer')
		RETURNING user_id, first_name, last_name, phone, role
	`

	var user models.UserProfile
	err = h.db.QueryRow(
		insertQuery,
		string(hashedPassword), req.FirstName, req.LastName, req.Phone,
	).Scan(&user.UserID, &user.FirstName, &user.LastName, &user.Phone, &user.Role)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to register user",
		})
		return
	}

	// สร้าง JWT token
	token, err := generateToken(user.UserID, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to generate token",
		})
		return
	}

	c.JSON(http.StatusCreated, models.Response{
		Success: true,
		Message: "User registered successfully",
		Data: models.AuthResponse{
			User:  user,
			Token: token,
		},
	})
}

// Login เข้าสู่ระบบ
// POST /api/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req models.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Success: false,
			Error:   err.Error(),
		})
		return
	}

	// ดึงข้อมูล user
	query := `
		SELECT user_id, password_hash, first_name, last_name, phone, role
		FROM users
		WHERE phone = $1
	`

	var userID int
	var passwordHash, firstName, lastName, phone, role string
	err := h.db.QueryRow(query, req.Phone).Scan(&userID, &passwordHash, &firstName, &lastName, &phone, &role)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Success: false,
			Error:   "Invalid phone or password",
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch user",
		})
		return
	}

	// ตรวจสอบ password
	err = bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Success: false,
			Error:   "Invalid phone or password",
		})
		return
	}

	// สร้าง JWT token
	token, err := generateToken(userID, role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to generate token",
		})
		return
	}

	user := models.UserProfile{
		UserID:    userID,
		FirstName: firstName,
		LastName:  lastName,
		Phone:     &phone,
		Role:      role,
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Message: "Login successful",
		Data: models.AuthResponse{
			User:  user,
			Token: token,
		},
	})
}

// GetProfile ดึงข้อมูล profile ของผู้ใช้ปัจจุบัน
// GET /api/auth/profile
func (h *AuthHandler) GetProfile(c *gin.Context) {
	userID := c.GetInt("user_id")
	if userID == 0 {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Success: false,
			Error:   "Unauthorized",
		})
		return
	}

	query := `
		SELECT user_id, first_name, last_name, phone, role
		FROM users
		WHERE user_id = $1
	`

	var user models.UserProfile
	err := h.db.QueryRow(query, userID).Scan(&user.UserID, &user.FirstName, &user.LastName, &user.Phone, &user.Role)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, models.ErrorResponse{
			Success: false,
			Error:   "User not found",
		})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Success: false,
			Error:   "Failed to fetch user",
		})
		return
	}

	c.JSON(http.StatusOK, models.Response{
		Success: true,
		Data:    user,
	})
}

// generateToken สร้าง JWT token
func generateToken(userID int, role string) (string, error) {
	secretKey := os.Getenv("JWT_SECRET")
	if secretKey == "" {
		secretKey = "your-secret-key-change-in-production"
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id": userID,
		"role":    role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte(secretKey))
	return tokenString, err
}
