package com.HoCom.backend.controller;

import com.HoCom.backend.service.CloudinaryService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/test")
public class Testcontroller {

    private final CloudinaryService service;

    public Testcontroller(CloudinaryService service) {
        this.service = service;
    }
    @PostMapping("/upload")
    public String upload(@RequestParam("file")MultipartFile file){
        return service.upload(file);
    }
}
