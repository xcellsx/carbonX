package com.ecapybara.carbonx;

import org.springframework.beans.BeansException;
import org.springframework.context.ApplicationContext;
import org.springframework.context.ApplicationContextAware;
import org.springframework.stereotype.Component;

// Alternative: Implement ApplicationContextAware for broader compatibility
@Component
public class ApplicationContextHolder implements ApplicationContextAware {
  private static ApplicationContext context;

  @Override
  public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
      context = applicationContext;
  }

  public static <T> T getBean(Class<T> beanClass) {
    if (context == null) {
      throw new IllegalStateException("ApplicationContext not initialized");
    }
    return context.getBean(beanClass);
  }
}

