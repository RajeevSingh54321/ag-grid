import {Component,
    ViewContainerRef,
    Injectable} from '@angular/core';

import {ICellRenderer,
    ICellEditor,
    MethodNotImplementedException,
    RowNode,
    IDoesFilterPassParams,
    IFilter,
    IFilterParams,
    IAfterFilterGuiAttachedParams}   from 'ag-grid/main';

import {AgRendererComponent} from "./agRendererComponent";
import {AgEditorComponent} from "./agEditorComponent";
import {AgFilterComponent} from "./agFilterComponent";

@Injectable()
export class BaseComponentFactory {
    public createCellRendererFromComponent(componentType:{ new(...args:any[]): AgRendererComponent; },
                                           viewContainerRef:ViewContainerRef):{new(): ICellRenderer} {
        console.log("Use AgGridModule.forRoot() if you wish to use dynamic components");
        throw new MethodNotImplementedException();
    }

    public createRendererFromComponent(componentType:{ new(...args:any[]): AgRendererComponent; },
                                       viewContainerRef:ViewContainerRef):{new(): ICellRenderer} {
        console.log("Use AgGridModule.forRoot() if you wish to use dynamic components");
        throw new MethodNotImplementedException();
    }

    public createRendererFromTemplate(template:string,
                                      viewContainerRef:ViewContainerRef):{new(): ICellRenderer} {
        console.log("Use AgGridModule.forRoot() if you wish to use dynamic components");
        throw new MethodNotImplementedException();
    }

    public createEditorFromComponent(componentType:{ new(...args:any[]): AgEditorComponent; },
                                     viewContainerRef:ViewContainerRef):{new(): ICellEditor} {
        console.log("Use AgGridModule.forRoot() if you wish to use dynamic components");
        throw new MethodNotImplementedException();
    }

    public createFilterFromComponent(componentType:{ new(...args:any[]): AgFilterComponent; },
                                     viewContainerRef:ViewContainerRef):{new(): IFilter} {
        console.log("Use AgGridModule.forRoot() if you wish to use dynamic components");
        throw new MethodNotImplementedException();
    }
}

