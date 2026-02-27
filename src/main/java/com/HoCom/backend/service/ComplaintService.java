package com.HoCom.backend.service;

import com.HoCom.backend.dto.ComplaintResponse;
import com.HoCom.backend.dto.CreateComplaintRequest;
import com.HoCom.backend.models.users;

import java.util.List;
import java.util.UUID;

public interface ComplaintService {

    ComplaintResponse createComplaint(CreateComplaintRequest request, users student);

    List<ComplaintResponse> getMyComplaints(users student);

    ComplaintResponse getComplaintById(UUID complaintId, users currentUser);

    List<ComplaintResponse> getComplaintsByHostel(users warden);

    List<ComplaintResponse> getComplaintsByWorker(users worker);

    ComplaintResponse assignWorker(UUID complaintId, UUID workerId, users warden);

    ComplaintResponse resolveComplaint(UUID complaintId, users worker);

    ComplaintResponse rejectComplaint(UUID complaintId, users warden);
}
