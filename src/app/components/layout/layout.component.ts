import { Component, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnDestroy {
  isAdminRoute = false;
  private sub: Subscription;

  constructor(private router: Router) {
    this.checkRoute(this.router.url);
    this.sub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => this.checkRoute(event.urlAfterRedirects || event.url));
  }

  private checkRoute(url: string): void {
    this.isAdminRoute = url.startsWith('/admin') || url.startsWith('/admin-login');
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}




