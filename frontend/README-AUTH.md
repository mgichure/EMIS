# Authentication System

This document describes the authentication system implemented in the EMIS frontend application.

## Overview

The authentication system provides secure user authentication and authorization with role-based access control. It includes login, signup, and protected route functionality.

## Components

### 1. Authentication Context (`contexts/AuthContext.tsx`)

The main authentication context that manages:
- User authentication state
- Login/logout functions
- Token management
- Authentication verification

**Key Features:**
- Automatic token verification on app startup
- Local storage management for persistence
- Integration with backend authentication endpoints

**Usage:**
```tsx
import { useAuth } from '@/contexts/AuthContext';

const { user, isAuthenticated, login, logout } = useAuth();
```

### 2. Login Form (`components/auth/LoginForm.tsx`)

A comprehensive login form with:
- Email and password validation
- Error handling
- Loading states
- Password visibility toggle

**Features:**
- Form validation using Zod schema
- Integration with authentication context
- Responsive design with Tailwind CSS

### 3. Signup Form (`components/auth/SignupForm.tsx`)

User registration form with:
- Personal information fields
- Role selection
- Organization details
- Password confirmation

**Features:**
- Multi-step form validation
- Role-based access control setup
- Automatic login after successful registration

### 4. Protected Route (`components/auth/ProtectedRoute.tsx`)

Route protection component that:
- Checks authentication status
- Redirects unauthenticated users
- Supports role-based access control

**Usage:**
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

<ProtectedRoute requiredRole="admin">
  <AdminDashboard />
</ProtectedRoute>
```

## Pages

### 1. Login Page (`/auth/login`)

- Clean, professional login interface
- Responsive design for all devices
- Integration with authentication context

### 2. Signup Page (`/auth/signup`)

- Comprehensive registration form
- Role-based account creation
- Organization setup

### 3. Dashboard (`/dashboard`)

- Personalized user dashboard
- Quick access to modules
- Role-based content display
- Recent activity and statistics

### 4. Unauthorized Page (`/unauthorized`)

- Access denied messaging
- Navigation options
- Professional error handling

## Backend Integration

The authentication system expects the following backend endpoints:

### 1. Login (`POST /api/auth/login`)

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "organization": "School Name"
  }
}
```

### 2. Signup (`POST /api/auth/signup`)

**Request:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "admin",
  "organization": "School Name"
}
```

**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin",
    "organization": "School Name"
  }
}
```

### 3. Token Verification (`GET /api/auth/verify`)

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
- `200 OK` for valid tokens
- `401 Unauthorized` for invalid tokens

## User Roles

The system supports the following user roles:

1. **Admin** - Full system access
2. **Teacher** - Educational content management
3. **Staff** - Administrative tasks
4. **Student** - Limited access to courses and personal data

## Security Features

- JWT token-based authentication
- Secure password requirements (minimum 8 characters)
- Role-based access control
- Automatic token verification
- Secure local storage handling
- Protected route implementation

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Backend Endpoints:**
   Ensure your backend provides the required authentication endpoints.

3. **Environment Variables:**
   Set up any required environment variables for your backend URLs.

4. **Wrap Application:**
   The `AuthProvider` is already configured in the root layout.

## Usage Examples

### Basic Authentication Check
```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { isAuthenticated, user } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return <div>Welcome, {user.firstName}!</div>;
}
```

### Role-Based Access Control
```tsx
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  );
}
```

### Custom Login Handler
```tsx
import { LoginForm } from '@/components/auth/LoginForm';

function CustomLoginPage() {
  const handleSuccess = (token: string, user: any) => {
    // Custom logic after successful login
    console.log('User logged in:', user);
  };
  
  return <LoginForm onSuccess={handleSuccess} />;
}
```

## Styling

The authentication components use Tailwind CSS for styling and are fully responsive. The design follows modern UI/UX principles with:

- Clean, professional appearance
- Consistent color scheme
- Responsive layouts
- Accessible form elements
- Loading states and animations

## Future Enhancements

- Two-factor authentication (2FA)
- Password reset functionality
- Social login integration
- Session management
- Audit logging
- Multi-tenant support

## Troubleshooting

### Common Issues

1. **Token Not Persisting:**
   - Check localStorage availability
   - Verify token format from backend

2. **Authentication Loop:**
   - Ensure backend endpoints are working
   - Check token verification logic

3. **Role-Based Access Issues:**
   - Verify user role in backend response
   - Check ProtectedRoute implementation

### Debug Mode

Enable console logging for debugging:
```tsx
// In AuthContext.tsx
console.log('Auth state:', { user, token, isAuthenticated });
```

## Support

For issues or questions about the authentication system, please refer to the main project documentation or create an issue in the project repository.
