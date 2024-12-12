import {Inject, Injectable, InjectionToken, PLATFORM_ID} from '@angular/core';
import {Observable, of, throwError} from 'rxjs';
import {StorageMethod} from './enums/storage-method';
import {catchError, map, switchMap} from 'rxjs/operators';
import {isPlatformBrowser} from '@angular/common';

// Service can extend for use with SSR
export const BROWSER_STORAGE = new InjectionToken<Storage>('Browser Storage', {
  providedIn: 'root',
  factory: () => localStorage
});

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  private readonly isBrowser;

  constructor(@Inject(BROWSER_STORAGE) public storage: Storage, @Inject(PLATFORM_ID) private platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  public wipe(): Observable<void> {
    return this.invokeStorage(StorageMethod.WIPE);
  }

  public getKeys(): Observable<string[]> {
    return this.invokeStorage(StorageMethod.KEYS);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public set(key: string, value: unknown): Observable<any> {
    return this.invokeStorage(StorageMethod.SET, key, value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public get(key: string): Observable<any> {
    return this.invokeStorage(StorageMethod.GET, key);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public remove(key: string): Observable<any> {
    return this.invokeStorage(StorageMethod.REMOVE, key);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private invokeStorage(type: StorageMethod, key?: string, value?: any): Observable<any> {
    return of(type).pipe(
      switchMap(() => {

        switch (type) {
          case StorageMethod.GET:
            return of( this.isBrowser ? this.storage.getItem(key as string) : null).pipe(
              map((response) => {
                return response ? JSON.parse(response): undefined })
            );

          case StorageMethod.SET:
            value = JSON.stringify(value);
            return of(this.isBrowser ? this.storage.setItem(key as string, value) : null)

          case StorageMethod.REMOVE:
            return of(this.isBrowser ? this.storage.removeItem(key as string) : null)

          case StorageMethod.KEYS:
            return of(this.isBrowser ? this.storage : null).pipe(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              map((ls:any) => {
                const keys: string[] = [];
                for (let i = 0; i < ls.length; i++) {
                  keys.push(ls.key(i));
                }
                return keys;
              })
            );

          case StorageMethod.WIPE:
            return of(this.isBrowser ? this.storage.clear() : null);

          default:
            return throwError(`Unknown request type for storage.`);
        }
      }),
      catchError((err) => {
        if (err.exception !== null) {
          console.error("Unknown storage error", err);
        }
        return of(null);
      })
    );
  }
}
