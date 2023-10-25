import { JsonPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CartItem } from 'src/app/common/cart-item';
import { Country } from 'src/app/common/country';
import { Order } from 'src/app/common/order';
import { OrderItem } from 'src/app/common/order-item';
import { PaymentInfo } from 'src/app/common/payment-info';
import { Purchase } from 'src/app/common/purchase';
import { State } from 'src/app/common/state';
import { CartService } from 'src/app/services/cart.service';
import { CheckoutService } from 'src/app/services/checkout.service';
import { Luv2ShopFormService } from 'src/app/services/luv2-shop-form.service';
import { Luv2ShopValidators } from 'src/app/validators/luv2-shop-validators';
import { environment } from 'src/environments/environment.development';


@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {



  checkoutFormGroup!: FormGroup;
  totalPrice: number = 0.0;
  totalQuantity: number = 0;

  creditCardsYears: number[] = [];
  creditCardsMonths: number[] = [];

  countries: Country[] = [];
  billingAddressStates: State[] = [];
  shippingAddressStates: State[] = [];

  storage: Storage = sessionStorage;

  // Initialize Stripe API

  stripe = Stripe(environment.stripePublishableKey);
  paymentInfo: PaymentInfo = new PaymentInfo();
  cardElement: any;
  displayError: any = "";
  isDisabled: boolean = false;


  constructor(private formBuilder: FormBuilder, private luv2ShopService: Luv2ShopFormService,
    private cartService: CartService, private checkoutService: CheckoutService, private route: Router) {

  }

  ngOnInit(): void {


    this.setupStripePaymentForm();
    this.reviewCartDetails();

    const userEmail = this.storage.getItem('userEmail');

    this.checkoutFormGroup = this.formBuilder.group({
      customer: this.formBuilder.group({
        firstName: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhiteSpace
        ]),
        lastName: new FormControl('', [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhiteSpace
        ]),
        email: new FormControl(userEmail,
          [Validators.required, Validators.pattern('^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$')])
      }),
      shippingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2),
        Luv2ShopValidators.notOnlyWhiteSpace]),

        city: new FormControl('', [Validators.required, Validators.minLength(2),
        Luv2ShopValidators.notOnlyWhiteSpace]),

        state: new FormControl('', [Validators.required]),

        country: new FormControl('', [Validators.required]),

        zipCode: new FormControl('', [Validators.required, Validators.minLength(2),
        Luv2ShopValidators.notOnlyWhiteSpace])

      }),
      billingAddress: this.formBuilder.group({
        street: new FormControl('', [Validators.required, Validators.minLength(2),
        Luv2ShopValidators.notOnlyWhiteSpace]),

        city: new FormControl('', [Validators.required, Validators.minLength(2),
        Luv2ShopValidators.notOnlyWhiteSpace]),

        state: new FormControl('', [Validators.required]),

        country: new FormControl('', [Validators.required]),

        zipCode: new FormControl('', [Validators.required, Validators.minLength(2),
        Luv2ShopValidators.notOnlyWhiteSpace])
      }),
      creditCard: this.formBuilder.group({
      })
    });

    // populate countries

    this.luv2ShopService.getCountries().subscribe(
      data => {
        console.log("Retreive countries: " + JSON.stringify(data));
        this.countries = data;
      }
    )

  }



  // Validation getter setter

  get firstName() { return this.checkoutFormGroup.get('customer.firstName'); }
  get lastName() { return this.checkoutFormGroup.get('customer.lastName'); }
  get email() { return this.checkoutFormGroup.get('customer.email'); }

  get shippingAddressStreet() { return this.checkoutFormGroup.get('shippingAddress.street'); }
  get shippingAddressCity() { return this.checkoutFormGroup.get('shippingAddress.city'); }
  get shippingAddressState() { return this.checkoutFormGroup.get('shippingAddress.state'); }
  get shippingAddressZipCode() { return this.checkoutFormGroup.get('shippingAddress.zipCode'); }
  get shippingAddressCountry() { return this.checkoutFormGroup.get('shippingAddress.country'); }

  get billingAddressStreet() { return this.checkoutFormGroup.get('billingAddress.street'); }
  get billingAddressCity() { return this.checkoutFormGroup.get('billingAddress.city'); }
  get billingAddressState() { return this.checkoutFormGroup.get('billingAddress.state'); }
  get billingAddressZipCode() { return this.checkoutFormGroup.get('billingAddress.zipCode'); }
  get billingAddressCountry() { return this.checkoutFormGroup.get('billingAddress.country'); }

  get creditCardType() { return this.checkoutFormGroup.get('creditCard.cardType'); }
  get creditCardNameOnCard() { return this.checkoutFormGroup.get('creditCard.nameOnCard'); }
  get creditCardNumber() { return this.checkoutFormGroup.get('creditCard.cardNumber'); }
  get creditCardSecurityCode() { return this.checkoutFormGroup.get('creditCard.securityCode'); }

  onSubmit() {
    console.log("Handling the submit button");
    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }
    // setup Order
    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalPrice;

    // get cart items

    let cartItems: CartItem[];
    cartItems = this.cartService.cartItems;


    //get order item from Cart Items

    let orderItems: OrderItem[] = [];
    for (let i = 0; i < cartItems.length; i++) {
      orderItems[i] = new OrderItem(cartItems[i]);
    }

    //set up Purchase

    let purchase = new Purchase();

    // populate customer
    purchase.customer = this.checkoutFormGroup.controls['customer'].value;

    //populate Purchase - Shipping Address
    const shippingAddress = this.checkoutFormGroup.controls['shippingAddress'].value;
    const shippingState: string = JSON.parse(JSON.stringify(shippingAddress.state)).name;
    const shippingCountry: string = JSON.parse(JSON.stringify(shippingAddress.country)).name;
    purchase.shippingAddress = shippingAddress;
    purchase.shippingAddress.state = shippingState;
    purchase.shippingAddress.country = shippingCountry;

    // populate Purchase - Billing Address

    const billingAddress = this.checkoutFormGroup.controls['billingAddress'].value;
    const billingState: string = JSON.parse(JSON.stringify(billingAddress.state)).name;
    const billingCountry: string = JSON.parse(JSON.stringify(billingAddress.country)).name;
    console.log(`billing state is ${billingState}`)
    console.log(`billing country  is ${billingCountry}`)
    purchase.billingAddress = billingAddress;
    purchase.billingAddress.state = billingState;
    purchase.billingAddress.country = billingCountry;

    // populate purchase - order and orderItems

    purchase.order = order;
    purchase.orderItems = orderItems;

    console.log(purchase);

    // compute Payment Info

    this.paymentInfo.amount = Math.round(this.totalPrice * 100);
    this.paymentInfo.currency = 'USD';
    this.paymentInfo.receiptEmail = purchase.customer.email;

    // call service 
    if (!this.checkoutFormGroup.invalid && this.displayError.textContent === "") {
      this.isDisabled = true;
      this.checkoutService.createPaymentIntent(this.paymentInfo).subscribe(
        (paymentIntentResponse) => {
          this.stripe.confirmCardPayment(paymentIntentResponse.client_secret, {
            payment_method: {
              card: this.cardElement,
              billing_details:{
                email: purchase.customer.email,
                name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                  address: {
                    line1: purchase.billingAddress.street,
                    city: purchase.billingAddress.city,
                    state: purchase.billingAddress.state,
                    postal_code: purchase.billingAddress.zipCode,
                    country: this.billingAddressCountry.value.code
                  }
              }
            }
          }, { handleActions: false }).then((result: any) => {
            if (result.error) {
              alert(`there was an error: ${result.error.message}`)
              this.isDisabled = false;
            } else {
              this.checkoutService.createPurchase(purchase).subscribe({
                next: (response: any) => {
                  alert(`your order has been received. \n Order Tracking Number: ${response.orderTrackingNumber}`)
                  this.resetCart();
                  this.isDisabled = false;
                },
                error: (err: any) => {
                  alert(`There was an error: ${err.message}`);
                  this.isDisabled = false;
                }
              })
            }
          })
        }
      )
    } else {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }


  }

  resetCart() {
    // reset cart data
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems();

    // reset the form
    this.checkoutFormGroup.reset();

    // navigate back to the products page
    this.route.navigateByUrl("/products");
  }

  copyShippingAddressToBillingAddress(event: Event) {
    if ((<HTMLInputElement>event.target).checked) {
      this.checkoutFormGroup.controls.billingAddress.setValue(this.checkoutFormGroup.controls.shippingAddress.value);
      this.billingAddressStates = this.shippingAddressStates;
    } else {
      this.checkoutFormGroup.controls.billingAddress.reset();
      this.billingAddressStates = []
    }
  }

  handleMonthsandYears() {
    console.log("hello bro");
    const creditCardFormGroup = this.checkoutFormGroup.get('creditCard');
    const currentExpirationYear: number = creditCardFormGroup?.get('expirationYear')?.value;
    const currentYear: number = new Date().getFullYear();
    let startMonth: number = 1
    if (currentExpirationYear == currentYear) {
      console.log("hello equals");
      startMonth = new Date().getMonth() + 1;

    } else {
      startMonth = 1;
    }

    this.luv2ShopService.getCreditCardMonths(startMonth).subscribe(
      data => {
        console.log("Retreive credit card months: " + JSON.stringify(data));
        this.creditCardsMonths = data;
      }
    )
  }

  getStates(formGroupName: string) {
    const formGroup = this.checkoutFormGroup.get(formGroupName);
    const countryCode = formGroup.value.country.code;
    const countryName = formGroup.value.country.name;

    console.log("country selected " + countryName + " Country code is " + countryCode + " for cateogory " + formGroupName);

    this.luv2ShopService.getStates(countryCode).subscribe(
      data => {
        console.log("Retreive States: " + JSON.stringify(data));
        if (formGroupName === 'shippingAddress') {
          console.log("inside if")
          this.shippingAddressStates = data;
        } else {
          console.log("inside else")
          this.billingAddressStates = data;
        }

        formGroup?.get('state')?.setValue(data[0]);
      }
    )

  }

  reviewCartDetails() {
    this.cartService.totalQuantity.subscribe(
      quantity => this.totalQuantity = quantity
    )

    this.cartService.totalPrice.subscribe(
      price => this.totalPrice = price
    )


  }

  setupStripePaymentForm() {
    // get a handle to stripe elements 
    var elements = this.stripe.elements();

    // create a card element ... and hide the zip code field

    this.cardElement = elements.create('card', { hidePostalCode: true });

    // Add an instance of card UI component into the 'card-element' div 

    this.cardElement.mount('#card-element');

    // Add Event binding  for the 'change' event on the card element

    this.cardElement.on('change', (event: any) => {
      this.displayError = document.getElementById('card-errors');
      if (event.complete) {
        this.displayError.textContent = ""
      } else if (event.error) {
        // Show Validation error to customer
        this.displayError.textContent = event.error.message;
      }

    })
  }
}
