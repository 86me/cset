import { NumberSymbol } from '@angular/common';
import { AfterViewInit, Component, NgZone, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import SwiperCore, { SwiperOptions, Navigation, Pagination, Virtual } from 'swiper';
import { MatDialog } from '@angular/material/dialog';
import { NewAssessmentDialogComponent } from '../../dialogs/new-assessment-dialog/new-assessment-dialog.component';
import { AssessmentService } from '../../services/assessment.service';
import {
  BreakpointObserver,
  Breakpoints,
  BreakpointState
} from '@angular/cdk/layout';
import { SwiperComponent } from 'swiper/angular';
import { GalleryService } from '../../services/gallery.service';
import { trigger, style, animate, transition, state } from '@angular/animations';
import { ConfigService } from '../../services/config.service';

SwiperCore.use([Navigation, Pagination, Virtual]);
@Component({
  selector: 'app-new-assessment',
  templateUrl: './new-assessment.component.html',
  styleUrls: ['./new-assessment.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('enterAnimation', [
      state('false', style({ overflow: 'hidden', height: '0px', padding: '0 10px 0 0' })),
      state('true', style({ overflow: 'hidden', height: '*', padding: '0 10px 10px 0' })),
      transition('false => true', animate('200ms ease-in')),
      transition('true => false', animate('200ms ease-out'))
    ]),
  ]
})
export class NewAssessmentComponent implements OnInit, AfterViewInit {

  @ViewChild('swiper', { static: false }) swiper?: SwiperComponent;

  hoverIndex = -1;
  config: SwiperOptions = {
    slidesPerView: 1,
    spaceBetween: 7,
    slidesPerGroup: 1,
    //loop:true, 
    navigation: true,
    breakpoints: {
      200: {
        slidesPerView: 1,
      },
      620: {
        slidesPerView: 2,
      },
      800: {
        slidesPerView: 3,
      },
      1220: {
        slidesPerView: 4,
      },
      1460: {
        slidesPerView: 5
      }
    },
    on: {
      resize: () => {
        this.checkNavigation();
      }
    }
  };

  galleryData: any;
  rows: any;
  testRow: any;
  show: boolean = false;

  constructor(public dialog: MatDialog,
    public breakpointObserver: BreakpointObserver,
    public gallerySvc: GalleryService,
    public assessSvc: AssessmentService,
    public configSvc: ConfigService) {
  }

  ngOnInit(): void {
    this.gallerySvc.getGalleryItems(this.configSvc.galleryLayout).subscribe(
      (resp: any) => {        
        this.galleryData = resp;
        this.rows = this.galleryData.rows;
        this.testRow = this.rows[1];

        ///NOTE THIS runs the default item if there is only one item automatically
        if(this.rows.length==1 && this.rows[0].galleryItems.length==1){
          this.assessSvc.newAssessmentGallery(this.rows[0].galleryItems[0].gallery_Item_Id);
        }

        // create a plainText property for the elipsis display in case a description has HTML markup
        const dom = document.createElement("div");
        this.rows.forEach(row => {
          row.galleryItems.forEach(item => {            
            dom.innerHTML = item.description;
            item.plainText = dom.innerText;
          });
        });
      }
    );

    this.checkNavigation();
  }
  ngAfterViewInit(): void {
    this.checkNavigation();
  }

  checkNavigation() {
    let swiperPrev = document.getElementsByClassName('swiper-button-prev');
    let swiperNext = document.getElementsByClassName('swiper-button-next');
    if (window.innerWidth < 620) {

      if (swiperPrev != null && swiperNext != null) {
        for (var i = 0; i < swiperPrev.length; i++) {
          swiperPrev[i].setAttribute('style', 'display:none');
          swiperNext[i].setAttribute('style', 'display:none');
        }
      }
    } else {
      if (swiperPrev != null && swiperNext != null) {
        for (var i = 0; i < swiperPrev.length; i++) {
          swiperPrev[i].removeAttribute('style');
          swiperNext[i].removeAttribute('style');
        }
      }
    }
  }

  onHover(i: number) {
    this.hoverIndex = i;
    if (i > 0) {
      var el = document.getElementById('c' + i.toString()).parentElement;

      var bounding = el.getBoundingClientRect();

      let cardDimension = { x: bounding.x, y: bounding.y, w: bounding.width, h: bounding.height };
      let viewport = { x: 0, y: 0, w: window.innerWidth, h: window.innerHeight };
      let cardSize = cardDimension.w * cardDimension.h;
      let xOverlap = Math.max(0, Math.min(cardDimension.x + cardDimension.w, viewport.x + viewport.w) - Math.max(cardDimension.x, viewport.x))
      //let yOverlap = Math.max(0, Math.min(cardDimension.y + cardDimension.y, viewport.y + viewport.h) - Math.max(cardDimension.y, viewport.y))
      let offScreen = cardDimension.w - xOverlap;
      if (offScreen > 5) {
        el.style.right = (cardDimension.w).toString() + 'px';
      }
    }

    //if(offScreen > 0){
    //el.setAttribute('style', 'margin-right:'+)
    //}
  }

  onHoverOut(i: number, cardId: number) {
    this.hoverIndex = i;

    var el = document.getElementById('c' + cardId.toString()).parentElement;
    el.style.removeProperty('right');
  }

  showButtons(show: boolean) {
    this.show = show;
  }

  onSlideChange() { }

  getImageSrc(src: string) {
    let path = "assets/images/cards/";
    if (src) {
      return path + src;
    }
    return path + 'default.png';
  }

  openDialog(data: any) {
    data.path = this.getImageSrc(data.icon_File_Name_Small);
    this.dialog.open(NewAssessmentDialogComponent, {
      panelClass: 'new-assessment-dialog-responsive',
      data: data
    });
  }
}
