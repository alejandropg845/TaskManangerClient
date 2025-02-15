import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { PagesService } from './pages.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { PopupService } from './popup.service';

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {

  const pagesService = inject(PagesService);
  const popupService = inject(PopupService);

  let clonedRequest = req;

  if(pagesService.getToken){
    clonedRequest = req.clone({
      setHeaders:{
        Authorization: `bearer ${pagesService.getToken}`
      }
    });
  }

  return next(clonedRequest).pipe
  (
    catchError((err:HttpErrorResponse) => {
      if(err.status === 401) {
        pagesService.token = null;
        localStorage.removeItem('tmt');
        popupService.showPopup('e', "Your session has expired. Please, log in again");
      }

      return throwError(() => err);

    })
  );
};
