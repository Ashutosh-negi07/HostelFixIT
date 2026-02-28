package com.HoCom.backend.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory token blacklist for logout support.
 * Stores invalidated JWT tokens until they expire naturally.
 */
@Service
public class TokenBlacklistService {

    // token -> expiry timestamp (millis)
    private final Map<String, Long> blacklist = new ConcurrentHashMap<>();

    public void blacklist(String token, long expiryMillis) {
        blacklist.put(token, expiryMillis);
    }

    public boolean isBlacklisted(String token) {
        return blacklist.containsKey(token);
    }

    /**
     * Purge expired tokens every 10 minutes to prevent memory leaks.
     */
    @Scheduled(fixedRate = 600_000)
    public void purgeExpired() {
        long now = System.currentTimeMillis();
        blacklist.entrySet().removeIf(entry -> entry.getValue() < now);
    }
}
