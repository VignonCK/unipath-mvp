# Implementation Plan: Système de Notifications Intégré

## Overview

This implementation plan breaks down the integrated notification system into discrete, manageable coding tasks. The system will be built progressively, starting with core infrastructure, then adding email functionality, in-app notifications, monitoring, and finally migrating from the legacy Nodemailer system.

The implementation uses **JavaScript (CommonJS for backend, ES Modules for frontend)** to match the existing UniPath codebase.

## Tasks

- [x] 1. Set up database schema and infrastructure
  - Create Prisma schema extensions for notification tables
  - Add models: Notification, NotificationTemplate, EmailDelivery, UserPreferences, NotificationAuditLog, SystemAlert
  - Create and run database migration
  - Set up Redis connection configuration
  - _Requirements: 1.6, 4.1, 8.1, 12.1_

- [ ]* 1.1 Write unit tests for database models
  - Test Prisma model creation and relationships
  - Test database constraints and validations
  - _Requirements: 1.6, 4.1_

- [ ] 2. Implement Queue Manager with Bull
  - [ ] 2.1 Create QueueManager service class
    - Initialize Bull queue with Redis connection
    - Configure job options (attempts, backoff, removal policies)
    - Implement priority levels (urgent, high, normal, low)
    - Add rate limiting configuration (100 jobs per minute)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [ ] 2.2 Implement queue event handlers
    - Handle 'completed', 'failed', 'stalled', 'error' events
    - Log queue events to console and audit log
    - Create alerts for queue overload (>1000 jobs)
    - _Requirements: 6.7, 7.4_

  - [ ]* 2.3 Write unit tests for QueueManager
    - Test job enqueueing with different priorities
    - Test rate limiting behavior
    - Test event handler callbacks
    - _Requirements: 6.1, 6.2, 6.3_

- [ ] 3. Implement Template Engine with Handlebars
  - [ ] 3.1 Create TemplateEngine service class
    - Initialize Handlebars with custom helpers (formatDate, uppercase, lowercase, truncate, eq, ne)
    - Implement template compilation and caching
    - Add template validation method
    - Implement safe rendering with fallback to default templates
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

  - [ ] 3.2 Create default email templates
    - Create templates for: PRE_INSCRIPTION, VALIDATION, REJET, NOUVEAU_DOSSIER, RAPPORT_HEBDO, RAPPORT_MENSUEL
    - Store templates in database via seed script
    - Include HTML and text versions
    - _Requirements: 2.1, 2.2_

  - [ ]* 3.3 Write unit tests for TemplateEngine
    - Test template rendering with variables
    - Test custom helpers functionality
    - Test validation of template syntax
    - Test fallback to default template on error
    - _Requirements: 2.1, 2.2, 2.3, 2.7_

- [ ] 4. Checkpoint - Ensure infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Retry Handler
  - [ ] 5.1 Create RetryHandler service class
    - Implement exponential backoff calculation (1min, 5min, 15min, 1h, 4h)
    - Add shouldRetry logic based on attempt count
    - Implement onMaxAttemptsReached to create admin alerts
    - Add SMTP rate limiting respect (100 emails/hour)
    - _Requirements: 1.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.7_

  - [ ]* 5.2 Write unit tests for RetryHandler
    - Test exponential backoff delay calculation
    - Test max attempts enforcement
    - Test alert creation on max attempts
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 6. Implement Delivery Tracker
  - [ ] 6.1 Create DeliveryTracker service class
    - Implement createDeliveryRecord method
    - Implement updateStatus method with timestamp tracking
    - Add recordBounce method with SMTP error code
    - Implement getStatistics method (delivery rate, failure rate, bounce rate)
    - Add detectAnomalies method (>10% failure rate in 24h)
    - _Requirements: 1.6, 1.7, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_

  - [ ]* 6.2 Write unit tests for DeliveryTracker
    - Test delivery record creation
    - Test status updates with timestamps
    - Test bounce recording
    - Test statistics calculation
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 7. Implement Email Service
  - [ ] 7.1 Create EmailService class
    - Configure Nodemailer transporter with SMTP settings from env
    - Add connection pooling (maxConnections: 5, maxMessages: 100)
    - Implement sendEmail method with attachment support (up to 5MB)
    - Integrate with TemplateEngine for email rendering
    - Integrate with DeliveryTracker for status updates
    - Add error handling for SMTP errors (4xx temporary, 5xx permanent)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ] 7.2 Implement SMTP error classification
    - Create SMTPErrorHandler class
    - Classify errors as RETRY (4xx), BOUNCE (5xx), or FAIL (network)
    - Return appropriate action and delay for each error type
    - _Requirements: 1.5, 7.1_

  - [ ]* 7.3 Write integration tests for EmailService
    - Test email sending with attachments
    - Test template rendering integration
    - Test delivery tracking integration
    - Test error handling and retry logic
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 8. Implement Preference Manager
  - [ ] 8.1 Create PreferenceManager service class
    - Implement getUserPreferences method with default values
    - Implement setPreferences method with validation
    - Add resetToDefaults method
    - Implement preference application logic (always send critical notifications)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 8.2 Write unit tests for PreferenceManager
    - Test default preferences for new users
    - Test preference updates and persistence
    - Test critical notification override
    - Test reset to defaults
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 9. Checkpoint - Ensure core services tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement Audit Logger
  - [ ] 10.1 Create AuditLogger service class
    - Implement logEvent method for all audit event types
    - Add logNotificationSent, logNotificationRead, logTemplateModified methods
    - Add logDataAccess, logPreferencesUpdated methods
    - Include IP address and user agent in logs
    - _Requirements: 1.7, 12.1, 12.2, 12.3, 12.4_

  - [ ]* 10.2 Write unit tests for AuditLogger
    - Test event logging with all required fields
    - Test different event types
    - Test IP and user agent capture
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 11. Implement Notification Service (Core Orchestrator)
  - [x] 11.1 Create NotificationService class
    - Implement sendNotification method as main entry point
    - Integrate with PreferenceManager to check user preferences
    - Integrate with QueueManager to enqueue email jobs
    - Create in-app notification records in database
    - Integrate with AuditLogger for all actions
    - _Requirements: 1.1, 3.1, 3.2, 5.3, 6.1_

  - [x] 11.2 Implement notification query methods
    - Add getNotifications method with filtering and pagination (20 per page)
    - Add getUnreadCount method
    - Add markAsRead method with timestamp
    - Add markAllAsRead method
    - Add searchNotifications method by keyword
    - _Requirements: 3.3, 3.4, 3.5, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 11.3 Write integration tests for NotificationService
    - Test sendNotification creates both email and in-app notifications
    - Test preference application
    - Test notification queries with pagination
    - Test mark as read functionality
    - Test search functionality
    - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 4.2, 4.3, 4.4, 4.5_

- [ ] 12. Implement Queue Worker
  - [ ] 12.1 Create notification queue worker
    - Create worker script to process notification jobs
    - Implement job processor that calls EmailService
    - Add error handling and retry integration
    - Configure concurrency (10 parallel jobs)
    - _Requirements: 6.6, 7.1, 7.2_

  - [ ]* 12.2 Write integration tests for queue worker
    - Test job processing with mock EmailService
    - Test retry on failure
    - Test concurrency limits
    - _Requirements: 6.6, 7.1, 7.2_

- [ ] 13. Checkpoint - Ensure notification system core is working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Implement WebSocket Server for real-time notifications
  - [ ] 14.1 Set up Socket.IO server
    - Initialize Socket.IO with CORS configuration
    - Implement JWT authentication for WebSocket connections
    - Add connection/disconnection handlers
    - Implement heartbeat/ping-pong for connection health
    - _Requirements: 3.7_

  - [ ] 14.2 Implement WebSocket event handlers
    - Handle 'authenticate' event with JWT validation
    - Handle 'subscribe' event to join user room
    - Handle 'mark_read' event
    - Emit 'notification' event on new notifications
    - Emit 'unread_count' event on count changes
    - Emit 'notification_read' event on mark as read
    - _Requirements: 3.7_

  - [ ] 14.3 Integrate WebSocket with NotificationService
    - Modify NotificationService.sendNotification to emit WebSocket events
    - Modify markAsRead to emit WebSocket events
    - _Requirements: 3.7_

  - [ ]* 14.4 Write integration tests for WebSocket
    - Test authentication flow
    - Test notification emission
    - Test mark as read via WebSocket
    - Test connection health monitoring
    - _Requirements: 3.7_

- [x] 15. Implement REST API endpoints for notifications
  - [x] 15.1 Create notification routes
    - POST /api/notifications - Create notification (admin only)
    - GET /api/notifications - List notifications with pagination
    - GET /api/notifications/:id - Get notification details
    - PATCH /api/notifications/:id/read - Mark as read
    - PATCH /api/notifications/read-all - Mark all as read
    - DELETE /api/notifications/:id - Delete notification
    - GET /api/notifications/unread-count - Get unread count
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.2, 4.3_

  - [ ] 15.2 Add authentication and authorization middleware
    - Verify JWT token
    - Check user owns the notification
    - Check admin role for admin endpoints
    - _Requirements: 14.2, 14.3_

  - [ ]* 15.3 Write API integration tests
    - Test all endpoints with valid authentication
    - Test authorization (user can only access own notifications)
    - Test pagination and filtering
    - Test error cases (404, 401, 403)
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 4.2, 4.3_

- [ ] 16. Implement preferences API endpoints
  - [ ] 16.1 Create preference routes
    - GET /api/preferences - Get user preferences
    - PUT /api/preferences - Update preferences
    - POST /api/preferences/reset - Reset to defaults
    - _Requirements: 5.1, 5.2, 5.6_

  - [ ]* 16.2 Write API integration tests for preferences
    - Test getting preferences
    - Test updating preferences
    - Test reset to defaults
    - _Requirements: 5.1, 5.2, 5.6_

- [ ] 17. Checkpoint - Ensure API endpoints are working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Implement Admin Dashboard API endpoints
  - [ ] 18.1 Create admin template management routes
    - GET /api/admin/templates - List templates
    - GET /api/admin/templates/:id - Get template details
    - POST /api/admin/templates - Create template
    - PUT /api/admin/templates/:id - Update template
    - DELETE /api/admin/templates/:id - Delete template
    - POST /api/admin/templates/:id/preview - Preview with test data
    - _Requirements: 2.4, 2.5, 2.6_

  - [ ] 18.2 Create admin monitoring routes
    - GET /api/admin/dashboard/stats - Global statistics (24h)
    - GET /api/admin/dashboard/queue - Queue status
    - GET /api/admin/dashboard/failures - Failed notifications
    - GET /api/admin/dashboard/alerts - Active alerts
    - GET /api/admin/logs - Audit logs with search and pagination
    - POST /api/admin/notifications/:id/retry - Manual retry
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 7.6, 12.6, 12.7_

  - [ ]* 18.3 Write API integration tests for admin endpoints
    - Test template CRUD operations
    - Test template validation
    - Test template preview
    - Test dashboard statistics
    - Test manual retry
    - Test audit log search
    - _Requirements: 2.4, 2.5, 2.6, 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ] 19. Implement Commission notification features
  - [ ] 19.1 Add Commission notification logic
    - Implement sendToCommission method in NotificationService
    - Create in-app notifications for all Commission members on new dossier
    - Group notifications by concours
    - Add daily email digest for Commission
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 19.2 Add dossier count tracking
    - Implement getPendingDossiersCount method
    - Add endpoint GET /api/commission/pending-dossiers
    - _Requirements: 9.4_

  - [ ]* 19.3 Write integration tests for Commission notifications
    - Test notification creation for all Commission members
    - Test grouping by concours
    - Test daily digest generation
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 20. Implement DGES reporting features
  - [ ] 20.1 Create report generation service
    - Implement ReportGenerator class
    - Add generateWeeklyReport method with statistics
    - Add generateMonthlyReport method with statistics
    - Generate PDF reports using PDFKit
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

  - [ ] 20.2 Create scheduled report jobs
    - Set up cron job for weekly reports
    - Set up cron job for monthly reports
    - Add configurable frequency in user preferences
    - _Requirements: 10.1, 10.2, 10.4_

  - [ ]* 20.3 Write integration tests for DGES reports
    - Test weekly report generation
    - Test monthly report generation
    - Test PDF attachment
    - Test statistics accuracy
    - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 21. Checkpoint - Ensure all backend features are complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 22. Implement Frontend NotificationCenter component
  - [x] 22.1 Create NotificationCenter React component
    - Create dropdown/modal UI with Tailwind CSS
    - Display notifications in chronological order
    - Show unread badge with count
    - Implement infinite scroll pagination
    - Add filter by notification type
    - Connect to WebSocket for real-time updates
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x] 22.2 Implement notification actions
    - Mark as read on click
    - Mark all as read button
    - Delete notification button
    - Navigate to related page on notification click
    - _Requirements: 3.3, 3.4_

  - [ ] 22.3 Add WebSocket connection management
    - Connect on component mount
    - Authenticate with JWT token
    - Handle reconnection on disconnect
    - Update UI on real-time events
    - _Requirements: 3.7_

- [ ] 23. Implement Frontend NotificationBadge component
  - Create reusable badge component
  - Display count with "99+" for large numbers
  - Support different sizes and colors
  - Auto-update from WebSocket events
  - _Requirements: 3.2_

- [ ] 24. Implement Frontend PreferencesPanel component
  - Create preferences UI with toggles for each notification type
  - Show channel options (email, in-app, both)
  - Indicate non-disableable critical notifications
  - Auto-save on change
  - Show success/error feedback
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 25. Implement Frontend AdminDashboard component
  - [ ] 25.1 Create dashboard overview section
    - Display 24h statistics (sent, delivered, failed)
    - Show charts for 7-day notification volume
    - Display queue status (pending, processing)
    - Show active alerts with severity
    - Auto-refresh every 30 seconds
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.8_

  - [ ] 25.2 Create template management section
    - List all templates with edit/delete actions
    - Create new template form with validation
    - Edit template form with preview
    - Template preview with test data
    - _Requirements: 2.4, 2.5, 2.6_

  - [ ] 25.3 Create audit log viewer section
    - Display logs with pagination
    - Add search by user, date, event type, keyword
    - Add export to CSV button
    - _Requirements: 11.7, 12.6, 12.7_

  - [ ] 25.4 Create failures management section
    - List failed notifications
    - Show error details
    - Add manual retry button
    - _Requirements: 11.3, 7.6_

- [ ] 26. Checkpoint - Ensure frontend components are working
  - Ensure all components render correctly and interact with API, ask the user if questions arise.

- [ ] 27. Implement migration strategy from legacy Nodemailer
  - [ ] 27.1 Create feature flag system
    - Create FeatureFlags class with database storage
    - Add isEnabled, enable, disable methods
    - Support per-notification-type flags
    - _Requirements: 13.1, 13.2, 13.3, 13.4_

  - [ ] 27.2 Modify EmailService for dual-write mode
    - Add sendEmailLegacy method wrapping existing functions
    - Modify sendEmail to check feature flags
    - Implement fallback to legacy on new system failure
    - Record legacy notifications in new system for history
    - _Requirements: 13.1, 13.2, 13.5_

  - [ ] 27.3 Create migration monitoring endpoints
    - GET /api/admin/migration/stats - Compare legacy vs new system
    - POST /api/admin/feature-flags - Enable/disable flags
    - _Requirements: 13.4_

  - [ ]* 27.4 Write integration tests for migration
    - Test feature flag toggling
    - Test dual-write mode
    - Test fallback to legacy
    - Test legacy notification recording
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 28. Implement security features
  - [ ] 28.1 Add data encryption
    - Implement encryption for sensitive notification data at rest
    - Use crypto module for encryption/decryption
    - _Requirements: 14.1_

  - [ ] 28.2 Add input validation and sanitization
    - Use Zod for API input validation
    - Sanitize HTML content to prevent XSS
    - Validate email addresses
    - _Requirements: 14.7_

  - [ ] 28.3 Add email masking in logs
    - Implement maskEmail utility function
    - Apply to all log outputs
    - _Requirements: 14.4_

  - [ ] 28.4 Configure HTTPS and TLS
    - Ensure HTTPS for all API endpoints
    - Configure TLS for SMTP connections
    - Configure WSS for WebSocket connections
    - _Requirements: 14.2, 14.3_

  - [ ]* 28.5 Write security tests
    - Test XSS prevention
    - Test email masking
    - Test encryption/decryption
    - Test input validation
    - _Requirements: 14.1, 14.4, 14.7_

- [ ] 29. Implement data retention and cleanup
  - [ ] 29.1 Create cleanup cron job
    - Delete notifications older than 2 years (expiresAt)
    - Delete audit logs older than 3 years
    - Archive old email deliveries (>1 year)
    - _Requirements: 4.1, 12.5, 14.6_

  - [ ] 29.2 Add user data deletion endpoint
    - POST /api/notifications/:id/delete - User can delete own notifications
    - _Requirements: 14.5_

- [ ] 30. Implement performance optimizations
  - [ ] 30.1 Add Redis caching for templates
    - Cache compiled templates with 1-hour TTL
    - Invalidate cache on template update
    - _Requirements: 15.5_

  - [ ] 30.2 Add database indexes
    - Create indexes on (userId, createdAt), (userId, read), (type), (status)
    - Verify query performance with EXPLAIN
    - _Requirements: 15.6_

  - [ ] 30.3 Optimize notification queries
    - Use pagination to limit results
    - Add database query timeout
    - Implement connection pooling
    - _Requirements: 15.3, 15.4_

- [ ] 31. Checkpoint - Ensure security and performance features are complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 32. Set up monitoring and observability
  - [ ] 32.1 Add Prometheus metrics
    - Install prom-client
    - Add metrics: notifications_sent_total, notification_duration_seconds, queue_size, delivery_rate
    - Expose /metrics endpoint
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 32.2 Configure health check endpoints
    - GET /api/health/notifications - Check all services (DB, Redis, Queue, SMTP)
    - Return 200 if healthy, 503 if degraded
    - _Requirements: 15.1_

  - [ ] 32.3 Add alert creation logic
    - Create alerts for high failure rate (>10% in 24h)
    - Create alerts for queue overload (>1000 jobs)
    - Create alerts for slow processing (p95 > 5s)
    - _Requirements: 7.4, 8.7, 15.7_

- [ ] 33. Create deployment configuration
  - [ ] 33.1 Create Docker Compose configuration
    - Add services: api, queue-worker, postgres, redis
    - Configure volumes for data persistence
    - Configure networks and ports
    - _Requirements: 15.1, 15.2_

  - [ ] 33.2 Document environment variables
    - Create .env.example with all required variables
    - Document each variable in ENV_VARIABLES.md
    - _Requirements: 14.2, 14.3_

  - [ ] 33.3 Create deployment scripts
    - Create migration script
    - Create seed script for default templates
    - Create health check script
    - _Requirements: 13.1_

- [ ] 34. Write end-to-end tests
  - [ ]* 34.1 Write E2E test for complete notification flow
    - Test: Create notification → Queue → Email sent → Delivery tracked → In-app notification → WebSocket emission → User receives
    - Verify all components work together
    - _Requirements: 1.1, 1.6, 1.7, 3.1, 3.7, 6.1, 8.1_

  - [ ]* 34.2 Write E2E test for notification reading flow
    - Test: User opens NotificationCenter → Sees unread → Clicks notification → Marked as read → Badge updates
    - _Requirements: 3.2, 3.3, 3.4, 4.6_

  - [ ]* 34.3 Write E2E test for preference flow
    - Test: User disables email → Notification sent → Only in-app created → No email sent
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 34.4 Write E2E test for retry flow
    - Test: Email fails → Retry scheduled → Retry succeeds → Status updated
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ]* 34.5 Write E2E test for admin dashboard
    - Test: Admin views dashboard → Sees statistics → Views failed notification → Retries manually → Success
    - _Requirements: 11.1, 11.2, 11.3, 7.6_

- [ ] 35. Final checkpoint - Complete system integration
  - Run all tests (unit, integration, E2E)
  - Verify all requirements are met
  - Test in staging environment
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 36. Create documentation
  - Update API_DOCUMENTATION.md with new endpoints
  - Create NOTIFICATION_SYSTEM.md with architecture overview
  - Document migration procedure
  - Create admin user guide for dashboard
  - Document troubleshooting procedures
  - _Requirements: All_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP delivery
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- The implementation follows a bottom-up approach: infrastructure → services → API → frontend
- Migration strategy allows gradual rollout with feature flags and rollback capability
- Security and performance are integrated throughout, not added as afterthoughts
- All code should be written in JavaScript (CommonJS for backend, ES Modules for frontend) to match existing codebase
