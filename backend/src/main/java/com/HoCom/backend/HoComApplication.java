package com.HoCom.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class HoComApplication {

	public static void main(String[] args) {
		SpringApplication.run(HoComApplication.class, args);
	}

}
