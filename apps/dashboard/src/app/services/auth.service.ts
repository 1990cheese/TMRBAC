import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

// 1. Import the full User model from your shared data library
import { User } from '../../../../libs/ui-data/users/user.model';

// 2. Update AuthResponse to expect the full User object
interface AuthResponse {
  accessToken: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // 3. Create a BehaviorSubject to hold and broadcast the user's state.
  //    It's initialized with the user data from localStorage, so the session persists.
  private userSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  
  // 4. Expose the user state as a public observable. This is the `currentUser$`
  //    that your SidebarComponent is looking for.
  public currentUser$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, { email, password })
      .pipe(
        tap(response => {
          // 5. When login is successful, update the user state everywhere.
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.userSubject.next(response.user); // Push the new user data to all subscribers
        }),
        catchError(error => {
          console.error('Login error in service:', error);
          return throwError(() => error);
        })
      );
  }

  register(data: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        tap(response => {
          // Also handle user state on registration
          localStorage.setItem('accessToken', response.accessToken);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.userSubject.next(response.user);
        }),
        catchError(error => {
          console.error('Registration error:', error);
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser'); // Also clear the user data
    this.userSubject.next(null); // Notify all subscribers that the user is gone
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Helper function to retrieve the user object from storage on app load.
   */
  private getUserFromStorage(): User | null {
    const userJson = localStorage.getItem('currentUser');
    if (!userJson) {
      return null;
    }
    return JSON.parse(userJson) as User;
  }
}