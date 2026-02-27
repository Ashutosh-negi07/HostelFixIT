package com.HoCom.backend.Config;

import com.cloudinary.Cloudinary;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class Cloudinaryconfig {
    @Bean
    public Cloudinary cloudinary(){
        return new Cloudinary(Map.of(
                "cloud_name", "ddmog9gmh",
                "api_key", "517361626893892",
                "api_secret", "-LYDcjbhOjoHP1mLDZoWaOBugkc"

        ));
    }
}
