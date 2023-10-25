import { Injectable, booleanAttribute } from '@angular/core';
import { CartItem } from '../common/cart-item';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {


  cartItems: CartItem[] = [];
  totalPrice: Subject<number> = new BehaviorSubject<number>(0);
  totalQuantity: Subject<number> = new BehaviorSubject<number>(0);
  //storage:Storage = sessionStorage;
  storage:Storage = localStorage;
 
  constructor() { 
    let data = JSON.parse(this.storage.getItem('cartItems'));

     if(data != null)
     {
       this.cartItems = data;
       this.computeCartTotals();
     }
    

  }

  addToCart(theCartItem: CartItem) {

    let productExistInCart = false;
    let existingCartItem: CartItem = undefined!;

    if (this.cartItems.length > 0) {

      // find the item in the cart based on item id

      // chk if we found it
      for (let tempCartItems of this.cartItems) {
        if (tempCartItems.id === theCartItem.id) {
          existingCartItem = tempCartItems;
          //productExistInCart = true;
          break;
        }
      }

      productExistInCart = (existingCartItem != undefined)


    }

    if (productExistInCart) {
      existingCartItem.quantity++
    } else {
      this.cartItems.push(theCartItem)
    }

    // compute cart total price and quantity

    this.computeCartTotals();

  }
  computeCartTotals() {
    let totalPriceValue = 0;
    let totalQuantityValue = 0;

    for (let currentCartItem of this.cartItems) {
      totalPriceValue += currentCartItem.quantity * currentCartItem.unitPrice;
      totalQuantityValue += currentCartItem.quantity;
    }

    // publish the new value  .. all subscriver will receive the new data
    this.totalPrice.next(totalPriceValue);
    this.totalQuantity.next(totalQuantityValue);

    this.logCartData(totalPriceValue, totalQuantityValue);
    this.persistCartItems();
  }
  logCartData(totalPriceValue: number, totalQuantityValue: number) {
    //console.log('content of the cart')
    for (let tempCartItem of this.cartItems) {
      const subTotalPrice = tempCartItem.quantity * tempCartItem.unitPrice;
      //console.log(`name: ${tempCartItem.name}, quantity=${tempCartItem.quantity}, unitPrice=${tempCartItem.unitPrice}, subTotalPrice=${subTotalPrice}`);
    }

    //console.log(`totalPrice: ${totalPriceValue.toFixed(2)}, totalQuantity: ${totalQuantityValue}`);
   // console.log('----');
  }

  decrementQuantity(thecartItem: CartItem) {
   // console.log("incrementing")

    thecartItem.quantity--;

    //console.log("decrementing")

    //console.log(`${thecartItem.quantity}`)

    if (thecartItem.quantity === 0) {
      //console.log("baba")
      this.remove(thecartItem);
    } else {
      this.computeCartTotals();
    }
  }
  remove(theCartItem: CartItem) {

    // get index of item in the array
    const itemIndex = this.cartItems.findIndex(tempCartItem => tempCartItem.id === theCartItem.id);

    // if found, remove the item from the array at the given index
    if (itemIndex > -1) {
      this.cartItems.splice(itemIndex, 1);

      this.computeCartTotals();
    }
  }

  persistCartItems(){
    this.storage.setItem('cartItems',JSON.stringify(this.cartItems));
  }
}
