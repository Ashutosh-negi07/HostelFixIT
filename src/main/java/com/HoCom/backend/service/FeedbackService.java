package com.HoCom.backend.service;

import com.HoCom.backend.dto.CreateFeedbackRequest;
import com.HoCom.backend.dto.FeedbackResponse;
import com.HoCom.backend.models.users;

import java.util.UUID;

public interface FeedbackService {

    FeedbackResponse createFeedback(CreateFeedbackRequest request, users student);

    FeedbackResponse getFeedbackByComplaintId(UUID complaintId, users currentUser);
}
