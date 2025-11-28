package com.ecapybara.carbonx.service.dev.logger;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import io.micrometer.core.instrument.util.IOUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

// Reference code is from: https://www.baeldung.com/spring-http-logging
@Order(value = Ordered.HIGHEST_PRECEDENCE)
@Component
@WebFilter(filterName = "RequestCachingFilter", urlPatterns = "/*")
public class RequestCachingFilter extends OncePerRequestFilter {

    private final static Logger LOGGER = LoggerFactory.getLogger(RequestCachingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
      FilterChain filterChain) throws ServletException, IOException {
      CachedHttpServletRequest cachedHttpServletRequest = new CachedHttpServletRequest(request);
      LOGGER.info("REQUEST DATA: " + IOUtils.toString(cachedHttpServletRequest.getInputStream(), StandardCharsets.UTF_8));
      filterChain.doFilter(cachedHttpServletRequest, response);
    }
}
