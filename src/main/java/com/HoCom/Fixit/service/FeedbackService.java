package com.HoCom.Fixit.service;

import java.util.UUID;

import com.HoCom.Fixit.dto.CreateFeedbackRequest;
import com.HoCom.Fixit.dto.FeedbackResponse;
import com.HoCom.Fixit.models.User;

public interface FeedbackService {

    FeedbackResponse createFeedback(CreateFeedbackRequest request, User student);

    FeedbackResponse getFeedbackByComplaintId(UUID complaintId, User currentUser);
}
