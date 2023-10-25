import { Component, Inject, OnInit } from '@angular/core';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

@Component({
  selector: 'app-login-status',
  templateUrl: './login-status.component.html',
  styleUrls: ['./login-status.component.css']
})
export class LoginStatusComponent implements OnInit {

  isAuthenticated: boolean = false;
  userFullName: string = '';
  userEmail: string = '';
  storage:Storage = sessionStorage;

  constructor(private oktaAuthService: OktaAuthStateService,
    @Inject(OKTA_AUTH) private oktaAuth: OktaAuth) {
    console.log("inside login status constructor")
  }
  ngOnInit(): void {
    console.log("inside login status oninit")
    this.oktaAuthService.authState$.subscribe(
      (result) => {
        this.isAuthenticated = result.isAuthenticated;
        //console.log("okta auth service resule" + JSON.stringify(result))
        this.getUserDetails();

      }
    );
  }
  getUserDetails() {
    if(this.isAuthenticated)
    {
      //console.log("user get" + this.oktaAuth.getUser())
      this.oktaAuth.getUser().then(
        (res) => {
          
          this.userFullName = res.name as string
          this.userEmail = res.email as string
          this.storage.setItem('userEmail',this.userEmail);
          console.log("under res" + JSON.stringify(res))
        }
      )
    }
  }

  logout() {
    // Terminates the session with Okta and removes current tokens.
    this.oktaAuth.signOut();
  }

}
