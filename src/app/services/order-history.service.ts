import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { OrderHistory } from '../common/order-history';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrderHistoryService {

  //private serachUrl: string = 'http://localhost:8080/api/orders/search/findByCustomerEmail?email='
  storage: Storage = sessionStorage;

  constructor(private httpClient: HttpClient) {

  }
  getOrderHistory(): Observable<getOrderHistory> {
    const userEmail = this.storage.getItem('userEmail');
    console.log('user email is ' + userEmail)
    //const getOrderURL = `http://localhost:8080/api/orders/search/findByCustomerEmailOrderByDateCreatedDesc?email=${userEmail}`;
    const getOrderURL = environment.luv2shopApiUrl + `/orders/search/findByCustomerEmailOrderByDateCreatedDesc?email=${userEmail}`;
    
    console.log('order history url is ' + getOrderURL)
    return this.httpClient.get<getOrderHistory>(getOrderURL);

  }

}

interface getOrderHistory {
  _embedded:
  {
    orders: OrderHistory[];
  }
}
