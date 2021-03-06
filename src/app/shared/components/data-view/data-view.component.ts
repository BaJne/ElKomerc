import { WishListService } from './../../../services/wish-list.service';

import { AuthService } from '../../../services/auth.service';
import { ArticalService } from './../../../services/artical.service';
import { Artical } from './../../../models/artical.model';
import { Component, OnInit, Input, Renderer2, OnChanges } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: ['./data-view.component.css']
})
export class DataViewComponent implements OnInit {
  @Input() value: Artical[];
  numOfArt = 1;

  constructor(
    private articalService: ArticalService,
    private wishSercive: WishListService,
    private render: Renderer2,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
  }
  // Prikazivanje precice ka detaljima proizvoda
  onHoverIn(e: any, m: any) {
    this.render.removeClass(e, 'hidden');
  }
  onHoverOut(e: any, m: any) {
    this.render.addClass(e, 'hidden');
  }

  // Hoverovanje Zvezdice
  onStarHover(e: any, index: number) {
    let i = 1;
    while (i <= index) {
      this.render.addClass(e.childNodes[i - 1], 'hoverStar');
      i++;
    }
  }
  onStarOut(e: any, index: number) {
    let i = 1;
    while (i <= index) {
      this.render.removeClass(e.childNodes[i - 1], 'hoverStar');
      i++;
    }
  }
  onStarClick(e: any, index: number) {
    let i = 1;
    while (i <= index) {
      this.render.addClass(e.childNodes[i - 1], 'addedStar');
      i++;
    }
    index++;
    while (index <= 5) {
      this.render.removeClass(e.childNodes[index - 1], 'addedStar');
      index++;
    }
  }
  // -----------------------------------------------

  onProductDetail(a: Artical) {
    this.articalService.setArticalToDisplay(a);
    this.router.navigate(['../product/', a.id], {relativeTo: this.route});
  }

  addToCart(art: Artical) {
    this.articalService.addToCart(art, this.numOfArt);
    this.numOfArt = 1;
  }

  // Wish List
  addToWishList(a: Artical) {
    this.wishSercive.addArticleToWishList(a);
  }

}
