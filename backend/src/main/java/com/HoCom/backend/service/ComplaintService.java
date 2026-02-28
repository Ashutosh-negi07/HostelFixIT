package com.HoCom.backend.service;

import java.util.UUID;

import com.HoCom.backend.dto.ComplaintResponse;
import com.HoCom.backend.dto.CreateComplaintRequest;
import com.HoCom.backend.dto.PagedResponse;
import com.HoCom.backend.dto.UpdateComplaintRequest;
import com.HoCom.backend.models.Complaint;
import com.HoCom.backend.models.User;

public interface ComplaintService {

    ComplaintResponse createComplaint(CreateComplaintRequest request, User student);

    ComplaintResponse updateComplaint(UUID complaintId, UpdateComplaintRequest request, String photoUrl, User student);

    ComplaintResponse cancelComplaint(UUID complaintId, User student);

    PagedResponse<ComplaintResponse> getMyComplaints(User student, Complaint.Status status, Complaint.Priority priority,
                                                      UUID categoryId, String sortBy, String order, int page, int size);

    ComplaintResponse getComplaintById(UUID complaintId, User currentUser);

    PagedResponse<ComplaintResponse> getComplaintsByHostelFiltered(User warden, Complaint.Status status,
                                                                     Complaint.Priority priority, UUID categoryId,
                                                                     String sortBy, String order, int page, int size);

    ComplaintResponse assignWorker(UUID complaintId, UUID workerId, User warden);

    ComplaintResponse resolveComplaint(UUID complaintId, User worker);

    ComplaintResponse startProgress(UUID complaintId, User worker);

    PagedResponse<ComplaintResponse> getWorkerComplaints(User worker, Complaint.Status status, Complaint.Priority priority,
                                                          String sortBy, String order, int page, int size);

    ComplaintResponse rejectComplaint(UUID complaintId, User warden);

    PagedResponse<ComplaintResponse> getAllComplaints(Complaint.Status status, Complaint.Priority priority,
                                                       UUID hostelId, String sortBy, String order, int page, int size);
}
