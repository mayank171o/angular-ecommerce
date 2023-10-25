import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Purchase } from '../common/purchase';
import { environment } from 'src/environments/environment';
import { PaymentInfo } from '../common/payment-info';

@Injectable({
  providedIn: 'root'
})
export class CheckoutService {

  //private purchaseUrl: string = "http://localhost:8080/api/checkout/purchase"
  private purchaseUrl: string = environment.luv2shopApiUrl + '/checkout/purchase';
  private payementIntentUrl: string = environment.luv2shopApiUrl + '/checkout/payment-intent';

  constructor(private httpClient: HttpClient) { }

  createPurchase(purchase: Purchase): Observable<any> {

    console.log("inside service")
    return this.httpClient.post<Purchase>(this.purchaseUrl, purchase);

  }
  
  createPaymentIntent(paymentInfo:PaymentInfo) : Observable<any>{
    return this.httpClient.post<PaymentInfo>(this.payementIntentUrl, paymentInfo);
  }

}
