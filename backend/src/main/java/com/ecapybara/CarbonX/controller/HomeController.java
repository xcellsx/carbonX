package com.ecapybara.carbonx.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.ui.Model;

@Controller
public class HomeController {

    @Value("${spring.application.name}")
    private String appName;

    @RequestMapping("/")
    public String index(Model model) {

       model.addAttribute("fileText", "This is supposed to be the homepage ...");
       return "index";
    }

    @RequestMapping("/dev")
    public String dev(Model model) {

       model.addAttribute("btn1Text", "Feature 1");
       model.addAttribute("btn2Text", "Feature 2");
       model.addAttribute("btn3Text", "Feature 3");
       model.addAttribute("btn4Text", "Feature 4");
       model.addAttribute("inputRequest", "Input Request");
       model.addAttribute("outputResponse", "Output Response");

       return "test";
    }
}