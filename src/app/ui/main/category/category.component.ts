import { User } from './../../../models/user.model';
import { AuthService } from './../../../services/auth.service';
import { ProducerService } from './../../../services/producer.service';
import { Producer } from './../../../models/producer.model';
import { Subscription } from 'rxjs';
import { CategoryService } from './../../../services/category.service';
import { Category, Feature } from './../../../models/category.model';
import { ArticalService } from './../../../services/artical.service';
import { Artical } from './../../../models/artical.model';

import { Component, OnInit, OnDestroy, HostListener, ElementRef, ViewChild, Renderer2, ViewChildren } from '@angular/core';
import { Paginator } from 'primeng/paginator/paginator';
import { TransitionService } from '../../../services/transition.service';
import { AccorditionService } from '../../../shared/components/accordition/accordition.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
  providers:  [ AccorditionService ]
})
export class CategoryComponent implements OnInit, OnDestroy {
  @ViewChild('leftRef', {static: true}) el: ElementRef;
  @ViewChild('content', {static: true}) con: ElementRef;
  @ViewChild('top', {static: true}) topPag: Paginator;
  @ViewChild('bottom', {static: true}) bottomPag: Paginator;

  // User
  userSubscription: Subscription;
  user: User = null;

  @ViewChild('header', {static: true}) header: ElementRef;
  isSmallHeader: boolean;

  showPan: ElementRef;
  showBottomPag = false;
  wasInside = false;
  @ViewChild('showPanel') set content(content: ElementRef) {
    if (content) { this.showPan = content; }
  }

  // FEATURES
  features: Feature[];
  selectedValues: string[] = [];

  // Filter SORT
  filter: {label: string, value: number}[];
  selectedFilter: string = null;
  display: boolean;

  // Proizvodjaci, Kategorije i Artikli
  producers: Producer[];
  allCategories: Category[];
  articals: Artical[];

  // Parametri za kategorije i podkategorije
  categories: Category[];
  selectedProducer: Producer = null;
  indexProducer = -1;
  searchFiledCategories: Category[] = null;
  searchField = '';
  selectedSubcategory = 1;
  openedTab = 0;
  selectedCategory = 0;
  artCount = 0;
  paginatorState = 0;

  categorySubscription: Subscription;

  showProducers = false;
  isLeftPanelSticked = false;
  isLeftPanelHidden = false;
  isWindowSmall = false;

  // Logika je da se ucitaju sve kategorije za prikaz preko CategoryServisa
  constructor(
    private categoryService: CategoryService,
    private producerService: ProducerService,
    private transService: TransitionService,
    private articalService: ArticalService,
    private authService: AuthService,
    private ac: AccorditionService,
    private renderer: Renderer2
  ) {
    this.filter = [
      {label: 'Ceni Opadajuce', value: 0 },
      {label: 'Ceni Rastuće',   value: 0 },
      {label: 'Proizvođaču',    value: 0 }
    ];
  }

  ngOnInit() {
    this.userSubscription = this.authService.user.subscribe(u => {
      if (this.user !== null && u === null && !!this.articals) {
        this.articals.forEach((value) => {
          value.user_discount = 0;
        });
      }
      this.user = u;
    });

    if (this.header.nativeElement.getBoundingClientRect().width <= 630) {
      this.isSmallHeader = true;
      this.renderer.addClass(this.header.nativeElement, 'header-min');
    } else {
      this.isSmallHeader = false;
    }

    this.onResizeWindow();
    const h = 'calc(100vh - ' + (102) + 'px)';
    this.renderer.setStyle(this.el.nativeElement, 'height', h);

    this.allCategories = this.categoryService.getCategories();
    this.producers = this.producerService.getProducers();
    // Početni podaci
    const startDetails = this.transService.getPageDetails('products');

    if (startDetails !== undefined) {
      this.selectedSubcategory = startDetails.selectedSubcategory;
      this.indexProducer = startDetails.selectedProducer;
      if (this.indexProducer !== -1) {
        this.selectedProducer = this.producers[this.indexProducer];
      }
      this.topPag._first = 20 * startDetails.page;
      this.topPag.updatePageLinks();
      this.topPag.updatePaginatorState();
      this.bottomPag._first = 20 * startDetails.page;
      this.bottomPag.updatePageLinks();
      this.bottomPag.updatePaginatorState();
      this.openedTab = startDetails.cat;
      this.selectedCategory = startDetails.cat;
      this.ac.setOpenedPage(startDetails.cat);
    }

    if (this.allCategories === null) {
      this.categorySubscription = this.categoryService
        .requestCategories()
        .subscribe((data: any) => {
          this.allCategories = data;
          this.updateCategories();
      });
    }
    if (this.producers === null) {
      this.producerService.requestProducers().subscribe(data => {
        this.producers = data;
      });
    }

    this.categoryService.getFeatures(this.selectedSubcategory)
    .subscribe((data: Feature[]) => {
      this.features = data;
      this.selectedValues = [];
    });
    this.updateCategories();

    this.getArticals(
      this.selectedSubcategory,
      [],
      (startDetails !== undefined) ? startDetails.page + 1 : 1,
      this.selectedProducer
    );
  }
  // Updejtovanje kategorija i prikaza
  selectGroup(index: number) {
    this.resetPaginators();
    this.showProducers = !this.showProducers;
    this.searchFiledCategories = null;
    if (index !== -1) {
      this.selectedProducer = this.producers[index];
    } else {
      this.selectedProducer = null;
    }
    this.indexProducer = index;
    this.saveContext();
    this.updateCategories();

    this.getArticals(
      (this.selectedProducer === null) ? 1 : this.selectedProducer.sub_categories_id[0],
      [],
      1,
      this.selectedProducer
    );
  }
  saveContext() {
    this.transService.setPageDetails('products', {
      selectedSubcategory: this.selectedSubcategory,
      selectedProducer: this.indexProducer,
      cat: this.selectedCategory,
      page: this.topPag.getPage()
    });
  }

  // Test
  onCategorySwitch(id: number) {
    this.openedTab = id;
  }

  onSubCategorySelect(id: any) {
    this.isWindowSmall = false;
    this.onResizeWindow();
    if (id !== this.selectedSubcategory) {
      this.selectedSubcategory = id;
      this.categoryService.getFeatures(this.selectedSubcategory)
      .subscribe((data: Feature[]) => {
        this.features = data;
        this.selectedValues = [];
      });
      this.resetPaginators();
      this.getArticals(this.selectedSubcategory, [], 1, this.selectedProducer);
    }
    this.selectedCategory = this.openedTab;
    this.saveContext();
  }

  clearFeatureList() {
    if (this.selectedValues.length === 0) { return; }
    this.selectedValues = [];
    this.onFeatureChange();
  }

  onFeatureChange() {
    this.getArticals(this.selectedSubcategory, this.selectedValues, 1, this.selectedProducer);
  }

  // PAGING
  resetPaginators() {
    this.topPag._first = this.bottomPag._first = 0;
    this.topPag.updatePageLinks();
    this.topPag.updatePaginatorState();
    this.bottomPag.updatePageLinks();
    this.bottomPag.updatePaginatorState();
  }

  topPageChange(event) {
    if(this.paginatorState === 0){
      this.saveContext();
      this.getArticals(this.selectedSubcategory, [], event.page + 1, this.selectedProducer);
      this.paginatorState = 1;
      this.bottomPag.changePage(this.topPag.getPage());
    } else {
      this.paginatorState = 0;
    }
  }

  botPageChange(event) {
    if(this.paginatorState === 0){
      this.saveContext();
      this.getArticals(this.selectedSubcategory, [], event.page + 1, this.selectedProducer);
      setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 200);
      this.paginatorState = 2;
      this.topPag.changePage(this.bottomPag.getPage());
    } else {
      this.paginatorState = 0;
    }
  }

  // ARTICLES
  getArticals(id: number, params: string[], page: number, producer: Producer) {
    this.articalService
      .getArticals((id === undefined) ? 0 : id, params, page, ((producer === null || producer === undefined) ? -1 : producer.id))
      .subscribe( data => {
        this.artCount = data.count;
        this.articals = data.result;
      });
  }

  onSearchFieldChange() {
    const n: any[] = [];
    if (this.searchFiledCategories === null || this.searchFiledCategories === undefined) {
      this.searchFiledCategories = [];
      this.categories.forEach(value => {
        const ct: Category = {
          category_name: value.category_name,
          id: value.id,
          sub_categories: []
        };
        value.sub_categories.forEach(v => {
          ct.sub_categories.push(v);
        });
        this.searchFiledCategories.push(ct);
      });
    }
    this.searchFiledCategories.forEach(value => {
      const ct: Category = {
        category_name: value.category_name,
        id: value.id,
        sub_categories: []
      };
      value.sub_categories.forEach(v => {
        if (v.subcategory_name.toLowerCase().includes(this.searchField)) {
          ct.sub_categories.push(v);
        }
      });
      if (ct.sub_categories.length > 0) {
        n.push(ct);
      }
    });
    this.categories = n;
  }
  // Updejtovanje kategoriaj u zavisnosti od prodjuzera i search dugmeta koje jos uvek treba uraditi
  updateCategories() {
    this.searchField = '';
    if (this.selectedProducer === null) {
      this.categories = this.allCategories;
    } else {  // FILTER
      this.categories = [];
      let j = 0;

      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < this.allCategories.length; i++) {
        const tempCategory: Category = {
          id: this.allCategories[i].id,
          category_name: this.allCategories[i].category_name,
          sub_categories: []
        };

        const lastSubCategory = this.allCategories[i].sub_categories[this.allCategories[i].sub_categories.length - 1];
        while (
          j < this.selectedProducer.sub_categories_id.length &&
          this.selectedProducer.sub_categories_id[j] <= lastSubCategory.id
        ) {
          const m = this.selectedProducer.sub_categories_id[j] - this.allCategories[i].sub_categories[0].id;
          tempCategory.sub_categories.push(this.allCategories[i].sub_categories[m]);
          j++;
        }
        if (tempCategory.sub_categories.length !== 0) {
          this.categories.push(tempCategory);
        }
        if (j >= this.selectedProducer.sub_categories_id.length) { break; }
      }
      // this.selectedSubcategory = this.categories[0].sub_categories[0].id;
    }
  }
  ngOnDestroy() {
    if (this.categorySubscription !== undefined) {
      this.categorySubscription.unsubscribe();
    }
    this.userSubscription.unsubscribe();
  }

  // EVENT LISTENERS
  @HostListener('window:resize', ['$event'])
    onResize(event) {
      if (window.pageYOffset > 0) {
        this.showBottomPag = true;
      } else {
        this.showBottomPag = false;
      }
      this.onResizeWindow();
      if (!this.isLeftPanelSticked) {
        const h = 'calc(100vh - ' + (this.con.nativeElement.getBoundingClientRect().top) + 'px)';
        this.renderer.setStyle(this.el.nativeElement, 'height', h);
      }
  }
  @HostListener('click', ['$event'])
    clickInside(event) {
      if (this.showPan !== undefined && this.showPan.nativeElement.contains(event.target)) {
        this.wasInside = true;
      }
  }
  @HostListener('document:click', ['$event'])
    clickHandler(event) {
      if (
        !this.el.nativeElement.contains(event.target) &&
        !this.wasInside &&
        window.innerWidth < 670 &&
        !this.isLeftPanelHidden
      ) {
        this.onToggleLeftPanel();
      }
      this.wasInside = false;
  }
  @HostListener('window:scroll', ['$event'])
    scrollHandler(event) {
      const scrollY = window.pageYOffset;
      if (scrollY === 0) {
        this.showBottomPag = false;
      } else {
        this.showBottomPag = true;
      }
      const treshold = this.con.nativeElement.getBoundingClientRect().top + scrollY;

      if (scrollY > treshold && !this.isLeftPanelSticked) {   // Left menu se fixira
        this.isLeftPanelSticked = true;
        this.renderer.removeClass(this.el.nativeElement, 'left-panel-relative');
        this.renderer.addClass(this.el.nativeElement, 'left-panel-fixed');
        this.renderer.setStyle(this.el.nativeElement, 'height', 'calc(100vh - 1px)');
        const ml = (this.isLeftPanelHidden) ? '0px' : '280px';
        this.renderer.setStyle(this.con.nativeElement, 'margin-left', ml);
      }

      if (scrollY <= treshold) {
        const h = 'calc(100vh - ' + (treshold - scrollY) + 'px)';
        this.renderer.setStyle(this.el.nativeElement, 'height', h);

        if (this.isLeftPanelSticked) {   // Vraca u pocetni polozaj
          this.isLeftPanelSticked = false;
          this.renderer.removeClass(this.el.nativeElement, 'left-panel-fixed');
          this.renderer.addClass(this.el.nativeElement, 'left-panel-relative');
          this.renderer.setStyle(this.con.nativeElement, 'margin-left', '0px');
        }
      }
  }
  // Dodati klase za menjanje pozicije datasheet
  onResizeWindow() {
    if ( window.innerWidth >= 670 && this.isWindowSmall) {
      this.isWindowSmall = false;
      this.renderer.setStyle(this.con.nativeElement, 'margin-left', '0px');
      if (this.isLeftPanelHidden) {
        this.onToggleLeftPanel();
      }
    } else if (window.innerWidth < 670 && !this.isWindowSmall) {
      this.isWindowSmall = true;
      this.renderer.setStyle(this.con.nativeElement, 'margin-left', '0px');
      if (!this.isLeftPanelHidden) {
        this.onToggleLeftPanel();
      }
    }

    if (
      this.header.nativeElement.getBoundingClientRect().width <= 630 &&
      !this.isSmallHeader
    ) {
      this.isSmallHeader = true;
      this.renderer.addClass(this.header.nativeElement, 'header-min');
    }
    if (
      this.header.nativeElement.getBoundingClientRect().width > 630 &&
      this.isSmallHeader
    ) {

      this.isSmallHeader = false;
      this.renderer.removeClass(this.header.nativeElement, 'header-min');
    }

  }
  onToggleLeftPanel() {
    this.isLeftPanelHidden = !this.isLeftPanelHidden;
    if (this.isLeftPanelHidden) {
      this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
      this.renderer.setStyle(this.con.nativeElement, 'margin-left', '0px');
    } else {
      const ml = (this.isLeftPanelSticked) ? '280px' : '0px';
      this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
      this.renderer.setStyle(this.con.nativeElement, 'margin-left', ml);
    }
  }

}
