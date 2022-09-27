import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Options } from 'sortablejs';
import { ListTest, MoveItem } from './listtest.model'
import { faArrows } from '@fortawesome/free-solid-svg-icons';
import { GalleryEditorService } from '../services/gallery-editor.service';
import { isNgTemplate } from '@angular/compiler';

@Component({
  selector: 'app-list-items',
  templateUrl: './list-items.component.html',
  styleUrls: ['./list-items.component.css']
})
export class ListItemsComponent implements OnInit {
  @Input()
  listTest!: ListTest;
  @Input() isRoot: boolean = false;
  faArrows = faArrows;
  layoutName: string = '';

  response: any;

  options: Options = {    
    handle: '.handle'
  };
  constructor(private svcGalleryEditor: GalleryEditorService ){   
    
    this.options = {
      group: 'test',
      onUpdate: (event: any) => {
        console.log('updated');
        //if event.from.id and event.to.id are empty then we are moving a whole group
        //changing the index of the rows
        //if event.from.id and event.to.id are the same we are moving within a group
        //if event.from.id and event.to.id are different we are moving from one group to another

        // console.log(event.from.id);
        // console.log(event.to.id);        
        console.log(event.oldIndex +":"+ event.newIndex)
        let item = new MoveItem();
        item.fromId = event.from.id;
        item.toId = event.to.id;
        item.newIndex = event.newIndex;
        item.oldIndex = event.oldIndex;
        item.Layout_Name = event.Layout_Name;

        this.svcGalleryEditor.updatePositionOfItem(item).subscribe();
      },
      onAdd: (event: any) => {
        console.log('added');         
        console.log(event.oldIndex +":"+ event.newIndex)
      },
      onRemove: (event: any) => {        
        console.log('removed');                
        console.log(event.oldIndex +":"+ event.newIndex)
      },
    };
  }

  ngOnInit(): void {    
  }
  
  open(item:any, value:string){
    console.log(item);
    if(item.group_Id!==undefined)
      this.svcGalleryEditor.UpdateGalleryGroupName(item.group_Id, value).subscribe();
    if(item.gallery_Item_Id!==undefined)
      this.svcGalleryEditor.UpdateGalleryItem(item.gallery_Item_Id, value).subscribe();
  }

  layoutChange(event: any) {
    this.layoutName = event.target.value;
    console.log("Layout is: " + this.layoutName);
    this.svcGalleryEditor.getGalleryItems(this.layoutName).subscribe(
      (r: any) => {
        this.response = r;
      },
      error => console.log('Gallery Layout error ' + (<Error>error).message)
    );
  }

  deleteGalleryGroup(title: string) {
    console.log(title + " would be deleted");
  }
  deleteGalleryItem(title: string) {
    console.log(title + " would be deleted");
  }

  addGalleryGroup(title: string) {
    console.log(title + " would be added");
  }
  addGalleryItem(group: string, title: string) {
    console.log(title + " would be added");
  }

  cloneGalleryItem(item: any) {
    console.log(item.title + " would be cloned");
    this.svcGalleryEditor.cloneGalleryItem(item).subscribe(
      (r: any) => {
        this.response = r;
      },
      error => console.log('Gallery Layout error ' + (<Error>error).message)
    );
  }


}
