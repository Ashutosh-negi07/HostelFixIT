package com.HoCom.backend.Config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.Set;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // Messages that are safe to show to the client
    private static final Set<String> SAFE_MESSAGES = Set.of(
            "Invalid email or password",
            "Account is deactivated",
            "Email already registered",
            "Category not found",
            "Hostel not found",
            "User not found",
            "Complaint not found",
            "Worker not found",
            "No feedback found for this complaint",
            "Only students can create complaints",
            "Student must be assigned to a hostel to file a complaint",
            "You can only view your own complaints",
            "You can only provide feedback for your own complaints",
            "You can only view feedback for your own complaints",
            "Feedback can only be given on RESOLVED or REJECTED complaints",
            "Feedback already submitted for this complaint",
            "This complaint is not assigned to you",
            "You can only manage complaints in your hostel",
            "Assigned user must have WORKER role",
            "Description is required",
            "Invalid priority value. Must be LOW, NORMAL, or HIGH",
            "Cannot create another ADMIN",
            "Cannot modify another ADMIN",
            "Warden can only create STUDENT or WORKER",
            "Warden can only modify STUDENT or WORKER",
            "Warden can only manage users in their own hostel",
            "Warden can only create users in their own hostel",
            "Warden is not assigned to a hostel",
            "Only ADMIN can create hostels",
            "Only ADMIN can update hostels",
            "Only ADMIN can delete hostels",
            "Only ADMIN can create categories",
            "Only ADMIN can update categories",
            "Only ADMIN can delete categories",
            "Only ADMIN and WARDEN can access dashboard stats",
            "You do not have permission to create users",
            "No permission",
            "Email is already taken by another user",
            "You can only update your own complaints",
            "Only PENDING complaints can be updated",
            "You can only cancel your own complaints",
            "Only PENDING complaints can be cancelled",
            "Only ASSIGNED complaints can be moved to IN_PROGRESS",
            "Old password is required to change password",
            "Old password is incorrect",
            "Token has been invalidated",
            "Upload failed",
            "Notification not found"
    );

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        String message = ex.getMessage();
        HttpStatus status = HttpStatus.BAD_REQUEST;

        if (message != null) {
            String lc = message.toLowerCase();
            if (lc.contains("not found")) {
                status = HttpStatus.NOT_FOUND;
            } else if (lc.contains("no permission") || lc.contains("do not have permission")
                    || lc.contains("only admin") || lc.contains("can only")
                    || lc.contains("only warden")) {
                status = HttpStatus.FORBIDDEN;
            } else if (lc.contains("already")) {
                status = HttpStatus.CONFLICT;
            }
        }

        // Only expose known safe messages; log the rest for debugging
        String clientMessage;
        if (message != null && (SAFE_MESSAGES.contains(message)
                || message.contains("not found")
                || message.contains("already exists")
                || message.startsWith("Complaint is already"))) {
            clientMessage = message;
        } else {
            log.error("Unhandled RuntimeException", ex);
            clientMessage = "An unexpected error occurred";
        }

        return ResponseEntity.status(status)
                .body(Map.of("error", clientMessage));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .reduce((a, b) -> a + "; " + b)
                .orElse("Validation failed");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", message));
    }
}
