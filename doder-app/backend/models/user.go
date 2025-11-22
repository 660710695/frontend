package models

import "time"

type User struct {
	UserID       int       `json:"user_id" db:"user_id"`
	PasswordHash string    `json:"-" db:"password_hash"` // ไม่ส่งกลับใน JSON response
	FirstName    string    `json:"first_name" db:"first_name"`
	LastName     string    `json:"last_name" db:"last_name"`
	Phone        *string   `json:"phone,omitempty" db:"phone"`
	Role         string    `json:"role" db:"role"` // 'customer' หรือ 'admin'
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

type UserProfile struct {
	UserID    int     `json:"user_id" db:"user_id"`
	FirstName string  `json:"first_name" db:"first_name"`
	LastName  string  `json:"last_name" db:"last_name"`
	Phone     *string `json:"phone,omitempty" db:"phone"`
	Role      string  `json:"role" db:"role"`
}

// Register Request
type RegisterRequest struct {
	FirstName string `json:"first_name" binding:"required"`
	LastName  string `json:"last_name" binding:"required"`
	Phone     string `json:"phone" binding:"required,len=10"`
	Password  string `json:"password" binding:"required,min=6"`
}

// Login Request
type LoginRequest struct {
	Phone    string `json:"phone" binding:"required,len=10"`
	Password string `json:"password" binding:"required"`
}

// Update Profile Request
type UpdateProfileRequest struct {
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
	Phone     *string `json:"phone"`
}

// Auth Response (ส่งกลับเมื่อ login/register สำเร็จ)
type AuthResponse struct {
	User  UserProfile `json:"user"`
	Token string      `json:"token"`
}

// Change Password Request
type ChangePasswordRequest struct {
	OldPassword string `json:"old_password" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=6"`
}
