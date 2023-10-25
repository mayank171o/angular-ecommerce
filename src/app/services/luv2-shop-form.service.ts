import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Country } from '../common/country';
import { map } from 'rxjs';
import { State } from '../common/state';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Luv2ShopFormService {

  //private countriesURL = 'http://localhost:8080/api/countries'
  //private statesURL = 'http://localhost:8080/api/states'

   private countriesURL = environment.luv2shopApiUrl + '/countries';
   private statesURL = environment.luv2shopApiUrl + '/states';

  constructor(private httpClient: HttpClient) { }

  getCreditCardMonths(startMonth: number): Observable<number[]> {
    let data: number[] = [];

    for (let theMonth = startMonth; theMonth <= 12; theMonth++) {
      data.push(theMonth)
    }
    return of(data);

  }

  getCreditCardYears(): Observable<number[]> {

    let data: number[] = [];
    const startYear: number = new Date().getFullYear();
    const endYear: number = startYear + 10;

    for (let theYear = startYear; theYear <= endYear; theYear++) {
      data.push(theYear);
    }

    return of(data);


  }

  getCountries(): Observable<Country[]> 
  {

    return this.httpClient.get<getResponseCountries>(this.countriesURL).pipe(
      map(response => response._embedded.countries)
    )
  }

  getStates(countryCode:String):Observable<State[]>
  {
    const stateBycode :string =  `${ this.statesURL}/search/findByCountryCode?code=${countryCode}`;
    console.log("Inside service State api" + stateBycode)
    return this.httpClient.get<getResponseStates>(stateBycode).pipe(
      map(response => response._embedded.states)
    )
  };



}

interface getResponseCountries{
  _embedded:
  {
    countries: Country[];
  }
}

interface getResponseStates{
  _embedded:
  {
    states: State[];
  }
}

