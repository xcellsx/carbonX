package com.eCapyBara.CarbonX;

public class StripePaymentService implements PaymentService{
    public void processPayment(double amount){
        System.out.println("STRIPE");
        System.out.println("You have paid " + amount);
    }
}
