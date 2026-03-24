package com.HoCom.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@Service
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }
    @SuppressWarnings("unchecked")
    public String upload(MultipartFile file) {
        try {
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.emptyMap()
            );
            return uploadResult.get("url").toString();

        } catch (Exception e) {
            throw new RuntimeException("Upload failed", e);
        }
    }

    /**
     * Deletes an image from Cloudinary by extracting the public ID from its URL.
     * Fails silently — a failed cleanup should never break the main operation.
     */
    public void delete(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return;
        try {
            String publicId = extractPublicId(imageUrl);
            if (publicId != null) {
                cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
            }
        } catch (Exception e) {
            // Log but don't propagate — cleanup failure should not break the request
            System.err.println("Cloudinary cleanup failed for: " + imageUrl + " — " + e.getMessage());
        }
    }

    /**
     * Extracts the Cloudinary public ID from a URL like:
     * http://res.cloudinary.com/xxx/image/upload/v1234567890/abcdef.jpg → abcdef
     */
    private String extractPublicId(String url) {
        try {
            // Remove query params
            String clean = url.contains("?") ? url.substring(0, url.indexOf("?")) : url;
            // Get the part after /upload/vXXXX/
            int uploadIdx = clean.indexOf("/upload/");
            if (uploadIdx == -1) return null;
            String afterUpload = clean.substring(uploadIdx + "/upload/".length());
            // Skip the version segment (v1234567890/)
            if (afterUpload.startsWith("v") && afterUpload.contains("/")) {
                afterUpload = afterUpload.substring(afterUpload.indexOf("/") + 1);
            }
            // Remove file extension
            int dotIdx = afterUpload.lastIndexOf(".");
            return dotIdx != -1 ? afterUpload.substring(0, dotIdx) : afterUpload;
        } catch (Exception e) {
            return null;
        }
    }
}
