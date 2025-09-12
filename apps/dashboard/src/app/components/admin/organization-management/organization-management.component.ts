import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Organization } from '../../../../../../libs/ui-data/organizations/organization.model';
import { User } from '../../../../../../libs/ui-data/users/user.model';
import { OrganizationsService } from '../../../services/organizations.service';
import { UsersService } from '../../../services/users.service';

@Component({
  selector: 'app-organization-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="p-6">
      <h1 class="text-3xl font-bold mb-6">Organization Management</h1>
      
      <div class="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 class="text-2xl font-semibold mb-4">Add User to Organization</h2>
        <div *ngIf="!isLoading; else loadingForm">
          <form [formGroup]="addUserForm" (ngSubmit)="onAddUserSubmit()">
            <!-- Organization Dropdown -->
            <div class="mb-4">
              <label for="organization" class="block text-sm font-medium text-gray-700">Select Organization</label>
              <select formControlName="organizationId" id="organization" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option *ngFor="let org of organizations" [value]="org.id">{{ org.name }}</option>
              </select>
            </div>

            <!-- User Dropdown -->
            <div class="mb-4">
              <label for="user" class="block text-sm font-medium text-gray-700">Select User</label>
              <select formControlName="userId" id="user" class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                <option *ngFor="let user of users" [value]="user.id">{{ user.firstName }} {{ user.lastName }} ({{user.email}})</option>
              </select>
            </div>
            
            <button type="submit" [disabled]="!addUserForm.valid" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">
              Assign User
            </button>
            <p *ngIf="successMessage" class="text-green-600 mt-2">{{ successMessage }}</p>
            <p *ngIf="errorMessage" class="text-red-600 mt-2">{{ errorMessage }}</p>
          </form>
        </div>
        <ng-template #loadingForm><p>Loading data...</p></ng-template>
      </div>
    </div>
  `,
})
export class OrganizationManagementComponent implements OnInit {
  // Use simple arrays instead of observables in the template
  organizations: Organization[] = [];
  users: User[] = [];
  isLoading = true; // Add a loading flag

  addUserForm: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor(
    private organizationsService: OrganizationsService,
    private usersService: UsersService,
    private fb: FormBuilder,
  ) {
    this.addUserForm = this.fb.group({
      organizationId: ['', Validators.required],
      userId: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.isLoading = true;
    // Fetch users
    this.usersService.getUsers().subscribe({
      next: (usersData) => {
        this.users = usersData;
        console.log('Users loaded into component:', this.users);
        this.checkIfLoadingComplete();
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.errorMessage = 'Could not load users.';
        this.isLoading = false;
      }
    });

    // Fetch organizations
    this.organizationsService.getOrganizations().subscribe({
      next: (orgsData) => {
        this.organizations = orgsData;
        console.log('Organizations loaded into component:', this.organizations);
        this.checkIfLoadingComplete();
      },
      error: (err) => {
        console.error('Failed to load organizations', err);
        this.errorMessage = 'Could not load organizations.';
        this.isLoading = false;
      }
    });
  }
  
  // Helper to turn off loading spinner only when both API calls are done
  private checkIfLoadingComplete() {
    if (this.users.length > 0 && this.organizations.length > 0) {
      this.isLoading = false;
    }
  }

  onAddUserSubmit() {
    // ... your existing onSubmit logic remains the same
    if (!this.addUserForm.valid) return;
    this.successMessage = '';
    this.errorMessage = '';
    const { organizationId, userId } = this.addUserForm.value;
    this.organizationsService.addUserToOrganization(organizationId, userId).subscribe({
      next: (updatedUser) => {
        this.successMessage = `Successfully assigned ${updatedUser.firstName} to the organization!`;
        this.addUserForm.reset();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to assign user.';
      }
    });
  }
}