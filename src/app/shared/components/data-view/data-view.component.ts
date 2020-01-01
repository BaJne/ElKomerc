import { UserService } from './../../../services/user.Service';
import { ArticalService } from './../../../services/artical.service';
import { Artical } from './../../../models/artical.model';
import { Component, OnInit, Input, Renderer2 } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-data-view',
  templateUrl: './data-view.component.html',
  styleUrls: ['./data-view.component.css']
})
export class DataViewComponent implements OnInit {
  @Input() value: Artical[];

  constructor(private articalService: ArticalService,
              private userService: UserService,
              private render: Renderer2,
              private router: Router,
              private route: ActivatedRoute) { }

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
      this.render.addClass(e.childNodes[i], 'hoverStar');
      i++;
    }
  }
  onStarOut(e: any, index: number) {
    let i = 1;
    while (i <= index) {
      this.render.removeClass(e.childNodes[i], 'hoverStar');
      i++;
    }
  }
  onStarClick(e: any, index: number) {
    let i = 1;
    while (i <= index) {
      this.render.addClass(e.childNodes[i], 'addedStar');
      i++;
    }
    index++;
    while (index <= 5) {
      this.render.removeClass(e.childNodes[index], 'addedStar');
      index++;
    }
  }
  // -----------------------------------------------

  onProductDetail(el: Artical) {
    this.articalService.setArticalToDisplay(el);
    this.router.navigate(['../product/', el.sifraArtikla], {relativeTo: this.route, queryParams: {loaded: true}});
  }
  addToCart(a: Artical) {
    this.userService.addToCart(a);
  }

}
