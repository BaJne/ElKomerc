import { WishListService } from './wish-list.service';
import { tap } from 'rxjs/operators';
import { Globals } from './globals';
import { HttpClient, HttpParams } from '@angular/common/http';
import { messagetype } from 'src/app/models/message.model';
import { MessageService } from './message.service';
import { Artical } from './../models/artical.model';
import { ProducerService } from './producer.service';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ArticalService {
  articalToDisplay: Artical = null;
  loadedArticals: Artical[] = [];
  cart = new BehaviorSubject<{art: Artical, num: number}[]>([]);
  toPay = 0;

  constructor(
    private producerService: ProducerService,
    private wishList: WishListService,
    private messageService: MessageService,
    private http: HttpClient,
    private globals: Globals
  ) {
    this.articalToDisplay = JSON.parse(localStorage.getItem('toDisplay'));
    this.toPay = +JSON.parse(localStorage.getItem('toPay'));
    if (JSON.parse(localStorage.getItem('cart')) === null) {
      this.cart.next([]);
      this.toPay = 0;
    } else {
      this.cart.next(JSON.parse(localStorage.getItem('cart')));
    }

  }

  // Metoda za dohvatanje proizvoda
  getArticals(subCategoryID: number, features: string[], page: number, idProducer: number) {
    let queryParams = new HttpParams();
    // queryParams = queryParams.append('value', v)
    queryParams = queryParams
      .append('sub_category_id', subCategoryID + '')
      .append('page', page + '');
    if (idProducer !== -1) {
      queryParams = queryParams.append('producer', idProducer + '');
    }

    return this.http.get(
      this.globals.location + '/api/product/articles/',
      {params: queryParams}
    )
    .pipe(tap(responseData => {
      const data: Artical[] = [];
      responseData['results'].forEach(art => {
        const a = {
          id: art.id,
          article_code: art.article_code,
          article_name: art.article_name,
          price: art.price,
          uri: art.uri,
          isOnWishList: null,
          article_images: []
        };
        this.wishList.wish.forEach((value, index) => {
          console.log(value);

          if (value.id === a.id) {
            a.isOnWishList = index;
          }
        });
        if (art.profile_image !== null) {
          a.article_images.push({
            uri: art.profile_image
          });
        }
        data.push(a);
      });

    }));
  }

  // Metoda kojom se prosledjuje artikal radi ispisivanja njegovih detalja
  setArticalToDisplay(a: Artical) {
    localStorage.setItem('toDisplay', JSON.stringify(a));
    this.articalToDisplay = a;
  }

  addToCart(a: Artical, numOfArt: number) {
    let appeard = false;
    // tslint:disable-next-line: prefer-for-of
    for (let index = 0; index < this.cart.value.length; index++) {
      if (this.cart.value[index].art.id === a.id) {
        appeard = true;
        this.cart.value[index].num += numOfArt;
        break;
      }
    }
    if (!appeard) {
      this.cart.value.push({art: a, num: numOfArt});
    }
    this.toPay += (+a.price * numOfArt);
    localStorage.setItem('cart', JSON.stringify(this.cart.value));
    localStorage.setItem('toPay', JSON.stringify(this.toPay));

    this.messageService.sendMessage({
      key: '',
      text: 'Uspešno ste dodali proizvod.',
      type: messagetype.succes
    });
    this.cart.next(this.cart.value);
  }
}
