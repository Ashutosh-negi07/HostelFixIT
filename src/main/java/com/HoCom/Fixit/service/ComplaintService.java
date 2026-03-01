package com.HoCom.Fixit.service;

import java.util.List;
import java.util.UUID;

import com.HoCom.Fixit.dto.ComplaintResponse;
import com.HoCom.Fixit.dto.CreateComplaintRequest;
import com.HoCom.Fixit.dto.UpdateComplaintRequest;
import com.HoCom.Fixit.models.Complaint;
import com.HoCom.Fixit.models.User;

public interface ComplaintService {

    ComplaintResponse createComplaint(CreateComplaintRequest request, User student);

    ComplaintResponse updateComplaint(UUID complaintId, UpdateComplaintRequest request, String photoUrl, User student);

    ComplaintResponse cancelComplaint(UUID complaintId, User student);

    List<ComplaintResponse> getMyComplaints(User student, Complaint.Status status, Complaint.Priority priority, UUID categoryId, String sortBy, String order);

    ComplaintResponse getComplaintById(UUID complaintId, User currentUser);

    List<ComplaintResponse> getComplaintsByHostel(User warden);

    List<ComplaintResponse> getComplaintsByHostelFiltered(User warden, Complaint.Status status,
                                                          Complaint.Priority priority, UUID categoryId,
                                                          String sortBy, String order);

    List<ComplaintResponse> getComplaintsByWorker(User worker);

    ComplaintResponse assignWorker(UUID complaintId, UUID workerId, User warden);

    ComplaintResponse resolveComplaint(UUID complaintId, User worker);

    ComplaintResponse startProgress(UUID complaintId, User worker);

    List<ComplaintResponse> getWorkerComplaints(User worker, Complaint.Status status, Complaint.Priority priority, String sortBy, String order);

    ComplaintResponse rejectComplaint(UUID complaintId, User warden);

    List<ComplaintResponse> getAllComplaints(Complaint.Status status, Complaint.Priority priority,
                                             UUID hostelId, String sortBy, String order);
}
