# Frontend Context

## Overview
PhysioAdmin is a React-based frontend application for managing a physiotherapy clinic. It features a modern, mobile-first design with smooth animations and comprehensive SaaS tenant management.

## Tech Stack
- React 18
- Vite
- React Router DOM
- Tailwind CSS
- Lucide React Icons

## Features
- RBAC (Role-Based Access Control): Admin vs. Standard User
- Mobile-first, responsive design
- Dashboard with statistics
- Patient Management (CRUD)
- Attendance tracking
- Subscription / Payment Management
- Company (SaaS Tenant) Management

## Data Models

### Companies (Admin Only)
**Fields**:
- `id` (String UUID)
- `name` (String, required)
- `email` (String)
- `phone` (String)
- `address` (String)
- `city` (String)
- `state` (String)
- `details` (String)
- `logo` (MediumBlob Base64)
- `status` (String: 'active', 'inactive')
- `created_at` (Date)
