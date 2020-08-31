import { BLE } from '@ionic-native/ble/ngx';
import { Component, NgZone } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  devices: any[] = [];
  status: string;

  constructor(
    public router: Router,
    private toastCtrl: ToastController,
    private ble: BLE,
    private ngZone: NgZone
  ) {}

  onConnect() {}

  Scan() {
    this.devices = [];
    this.ble
      .scan([], 15)
      .subscribe((device) => this.onDeviceDiscovered(device));
  }
  onDeviceDiscovered(device) {
    // console.log('Discovered' + JSON.stringify(device, null, 2));
    this.ngZone.run(() => {
      this.devices.push(device);
      // console.log(`device`);
    });
  }

  deviceSelected(device: any) {
    // console.log(JSON.stringify(device) + 'selected');
    let navigationExtras: NavigationExtras = {
      queryParams: {
        special: JSON.stringify(device),
      },
    };
    this.router.navigate(['details'], navigationExtras);
  }
}
