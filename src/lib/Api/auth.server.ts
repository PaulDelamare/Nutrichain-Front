import { env } from '$env/dynamic/private';
import { Api } from './api.server';
import type { ApiResponse } from '$lib/Models/response.model';
import { catchErrorRequest } from '$lib/Functions/utils/catchErrorRequest/catchErrorRequest';
import type { User } from '$lib/models/user.model';

// ! Ceci est un exemple pour réaliser les routes api
export default class AuthApi extends Api {

     private authUrl = `${env.API_URL}api/auth/`;

     private async parseJsonResponse<T>(response: Response): Promise<ApiResponse<T>> {
          try {
               const payload = await response.json();
               return { ...payload, status: response.status } as ApiResponse<T>;
          } catch {
               return { status: response.status, message: response.statusText } as ApiResponse<T>;
          }
     }

     /**
      * Registers a new user.
      * @param user - The user data to register.
      * @returns A promise resolving to the API response.
      */
     register = async (
          firstname: string, lastname: string, email: string, password: string
     ): Promise<ApiResponse> => {
          try {
               const response = await this.fetch(`${this.authUrl}register`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                         firstname,
                         lastname,
                         email,
                         password
                    })
               });

               return await this.parseJsonResponse(response);

          } catch (error) {
               catchErrorRequest(error, 'AuthApi.register');
               throw error;
          }
     };

     /**
      * Logs in a user with the provided email and password.
      * @param email - The user's email address.
      * @param password - The user's password.
      * @returns A promise resolving to the API response containing the user and access token.
      */
     login = async (
          email: string,
          password: string
     ): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken?: string }>> => {
          try {
               const response = await this.fetch(`${this.authUrl}login`, {
                    method: 'POST',
                    headers: {
                         'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ email, password })
               });

               return await this.parseJsonResponse(response);

          } catch (error) {
               catchErrorRequest(error, 'AuthApi.login');
               throw error;
          }
     };

     /**
      * Retrieves information about the currently authenticated user.
      * @returns A promise resolving to an ApiResponse containing the user data.
      */
     getInfo = async (): Promise<ApiResponse<User>> => {
          try {
               const response = await this.fetch(`${this.authUrl}me`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                         'Content-Type': 'application/json',
                         Accept: 'application/json'
                    }
               });

               const status = response.status;

               if (response.ok) {
                    const data: User = await response.json();
                    return { status, data, message: 'Success' };
               }

               const message =
                    status === 401
                         ? 'Unauthorized'
                         : (await response.text().catch(() => 'Error')) || 'Error';

               return { status, message } as ApiResponse<User>;

          } catch (error) {
               catchErrorRequest(error, 'AuthApi.getInfo');
               throw error;
          }
     };

     refresh = async (): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken?: string }>> => {
          try {
               const response = await this.fetch(`${this.authUrl}refresh`, {
                    method: 'POST',
                    headers: {
                         Accept: 'application/json',
                         'Content-Type': 'application/json'
                    },
                    credentials: 'include'
               });

               return await this.parseJsonResponse(response);
          } catch (error) {
               catchErrorRequest(error, 'AuthApi.refresh');
               throw error;
          }
     };

     logout = async (): Promise<ApiResponse<{ success: boolean; message: string }>> => {
          try {
               const response = await this.fetch(`${this.authUrl}logout`, {
                    method: 'POST',
                    headers: {
                         Accept: 'application/json',
                         'Content-Type': 'application/json'
                    },
                    credentials: 'include'
               });

               return await this.parseJsonResponse(response);
          } catch (error) {
               catchErrorRequest(error, 'AuthApi.logout');
               throw error;
          }
     };

}
