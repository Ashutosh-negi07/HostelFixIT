package com.HoCom.backend.service;

import com.HoCom.backend.dto.NotificationResponse;
import com.HoCom.backend.dto.PagedResponse;
import com.HoCom.backend.models.User;

import java.util.UUID;

public interface NotificationService {

    void notify(User recipient, String title, String message, UUID referenceId, String referenceType);

    PagedResponse<NotificationResponse> getNotifications(User user, int page, int size);

    long getUnreadCount(User user);

    void markAsRead(UUID notificationId, User user);

    void markAllAsRead(User user);

    void deleteNotification(UUID notificationId, User user);
}
