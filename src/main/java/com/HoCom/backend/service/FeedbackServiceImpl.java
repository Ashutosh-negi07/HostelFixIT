package com.HoCom.backend.service;

import com.HoCom.backend.dto.CreateFeedbackRequest;
import com.HoCom.backend.dto.FeedbackResponse;
import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.Feedback;
import com.HoCom.backend.models.User;
import com.HoCom.backend.repositories.ComplaintRepository;
import com.HoCom.backend.repositories.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FeedbackServiceImpl implements FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final ComplaintRepository complaintRepository;

    @Override
    public FeedbackResponse createFeedback(CreateFeedbackRequest request, User student) {

        Complaint complaint = complaintRepository.findById(request.getComplaintId())
                .orElseThrow(() -> new RuntimeException("Complaint not found"));

        // Only the student who created the complaint can give feedback
        if (!complaint.getStudent().getId().equals(student.getId())) {
            throw new RuntimeException("You can only provide feedback for your own complaints");
        }

        // Feedback only allowed on RESOLVED or REJECTED complaints
        if (complaint.getStatus() != Complaint.Status.RESOLVED
                && complaint.getStatus() != Complaint.Status.REJECTED) {
            throw new RuntimeException("Feedback can only be given on RESOLVED or REJECTED complaints");
        }

        // Check if feedback already exists
        if (feedbackRepository.existsByComplaintId(request.getComplaintId())) {
            throw new RuntimeException("Feedback already submitted for this complaint");
        }

        Feedback feedback = Feedback.builder()
                .complaint(complaint)
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Feedback saved = feedbackRepository.save(feedback);
        return mapToResponse(saved);
    }

    @Override
    public FeedbackResponse getFeedbackByComplaintId(UUID complaintId, User currentUser) {
        Feedback feedback = feedbackRepository.findByComplaintId(complaintId)
                .orElseThrow(() -> new RuntimeException("No feedback found for this complaint"));
        return mapToResponse(feedback);
    }

    private FeedbackResponse mapToResponse(Feedback f) {
        return FeedbackResponse.builder()
                .id(f.getId())
                .complaintId(f.getComplaint().getId())
                .rating(f.getRating())
                .comment(f.getComment())
                .createdAt(f.getCreatedAt())
                .build();
    }
}
