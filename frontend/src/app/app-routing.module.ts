import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AdminComponent } from './components/admin/admin.component';
import { ProprietaireComponent } from './components/proprietaire/proprietaire.component';
import { ClientComponent } from './components/client/client.component';


const routes: Routes = [
  {path:"", component:HomeComponent},
  {path:"admin", component:AdminComponent},
  {path:"proprietaire", component:ProprietaireComponent},
  {path:"client", component:ClientComponent},

 

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
