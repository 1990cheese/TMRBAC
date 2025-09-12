import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { User } from '../../../../libs/ui-data/users/user.model';
import { Organization } from '../../../../libs/ui-data/organizations/organization.model';
// If you have an Organization model/interface, import it from ui-data as well
@Injectable({ providedIn: 'root' })
export class OrganizationsService {
  private apiUrl = `${environment.apiUrl}/organizations`;

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(this.apiUrl, { headers: this.getAuthHeaders() });
  }
  addUserToOrganization(organizationId: string, userId: string): Observable<User> {
  const headers = this.getAuthHeaders(); // Assuming you have a getAuthHeaders method
  return this.http.post<User>(`${this.apiUrl}/${organizationId}/users`, { userId }, { headers });
}
}