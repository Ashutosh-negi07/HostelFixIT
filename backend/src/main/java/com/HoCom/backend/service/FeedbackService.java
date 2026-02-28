package com.HoCom.backend.service;

import java.util.UUID;

import com.HoCom.backend.dto.CreateFeedbackRequest;
import com.HoCom.backend.dto.FeedbackResponse;
import com.HoCom.backend.models.User;

public interface FeedbackService {

    FeedbackResponse createFeedback(CreateFeedbackRequest request, User student);

    FeedbackResponse getFeedbackByComplaintId(UUID complaintId, User currentUser);
}
