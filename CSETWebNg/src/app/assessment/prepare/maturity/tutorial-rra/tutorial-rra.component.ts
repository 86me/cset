
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { LayoutService } from '../../../../services/layout.service';

@Component({
  selector: 'app-tutorial-rra',
  templateUrl: './tutorial-rra.component.html'
})
export class TutorialRraComponent implements OnInit {

  /**
   * This is temporary.  It allows us to show this page content 
   * in a dialog launched from the help menu, but without displaying the Back and Next buttons.
   */
  @Input()
  showNav: boolean = true;


  constructor(
    public layoutSvc: LayoutService
  ) { }

  ngOnInit(): void {

  }

}
