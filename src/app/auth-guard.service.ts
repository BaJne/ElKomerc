import { map } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { Observable } from 'rxjs';
import { CanActivate, RouterStateSnapshot, ActivatedRouteSnapshot, Router } from '@angular/router';
import { Injectable } from '@angular/core';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot)
  : Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.user.pipe(map(user => {
      if (!user) {
        this.router.navigate(['/home']);
      }
      return !!user;
    }));
  }

}
