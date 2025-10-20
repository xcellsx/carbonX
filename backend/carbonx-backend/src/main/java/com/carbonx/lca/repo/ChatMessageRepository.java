package com.carbonx.lca.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.carbonx.lca.domain.ChatMessage;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {}


