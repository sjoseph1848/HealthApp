import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BLE } from '@ionic-native/ble/ngx';

@Component({
  selector: 'app-details',
  templateUrl: './details.page.html',
  styleUrls: ['./details.page.scss'],
})
export class DetailsPage implements OnInit {
  peripherals: any = {};
  BLE_NOTIFY_CHAR = 'FFF1';
  BLE_NOTIFY_SERVICE = 'FFF0';
  // BLE_READ_CHAR = 'FFF3';
  BLE_READ_CHAR = '2A29';
  BLE_READ_SERVICE = '180A';

  BLE_WRITE_CHAR = 'FFF2';
  command_on_para_on = new Uint8Array([-86, 85, 15, 3, -124, 1, -32]);
  // command_on_para_on = new Uint8Array([170, 85, 15, 3, 133, 1, 36]);
  // BLE_SERVICE = 'FFF0';
  // BLE_CHARACTERISTIC = 'FFF2';
  // BLE_Read = '180A';
  pulse: any;
  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private ble: BLE,
    private ngZone: NgZone
  ) {
    this.route.queryParams.subscribe((params) => {
      if (params && params.special) {
        const device = JSON.parse(params.special);

        // Call BLE connect - connect to ble device
        this.BleConnect(device);
      }
    });
  }

  ngOnInit() {}

  BleConnect(device) {
    this.ble
      .connect(device.id)
      .subscribe((peripheral) => this.onConnected(peripheral));
  }

  BleDisconnect() {
    this.ble.disconnect(this.peripherals.id).then(
      () => console.log('Disconnected ' + JSON.stringify(this.peripherals)),
      () => console.log('ERROR disconnecting ')
    );
  }

  onConnected(peripheral) {
    this.peripherals = peripheral;
    console.log(
      'Connected to ' + this.peripherals.name + ' ' + this.peripherals.id
    );
    this.ble.write(
      this.peripherals.id,
      this.BLE_NOTIFY_SERVICE,
      this.BLE_WRITE_CHAR,
      this.command_on_para_on.buffer
    );
    this.ble
      .startNotification(
        this.peripherals.id,
        this.BLE_NOTIFY_SERVICE,
        this.BLE_NOTIFY_CHAR
      )
      .subscribe((data) => {
        console.log(`Here is the data before write: ${JSON.stringify(data)}`);
        this.ble.write(
          this.peripherals.id,
          this.BLE_NOTIFY_SERVICE,
          this.BLE_WRITE_CHAR,
          this.command_on_para_on.buffer
        );
        console.log(`Here is the data after write: ${JSON.stringify(data)}`);
        this.ble.write(
          this.peripherals.id,
          this.BLE_NOTIFY_SERVICE,
          this.BLE_WRITE_CHAR,
          this.command_on_para_on.buffer
        );
        console.log(`Here is the data after read: ${JSON.stringify(data)}`);

        const rawData = new Uint8Array(data);
        console.log(
          `Here is the data before parseReading: ${JSON.stringify(rawData)}`
        );
        this.parseReading(rawData);
      });
  }

  private buffers: string[] = new Array();
  public parseReading(buffer) {
    this.buffers.push(`${buffer}`);

    let sp02 = 0;
    let pr = 0;
    let battery = 100;
    buffer = this.getValuesFromBuffers();
    console.log(`Here is the Buffer: ${buffer}`);
    if (buffer.length > 0) {
      sp02 = buffer[5];
      pr = buffer[6];
      battery = battery - (buffer[10] & 0x1f);
      console.log(`Buffer length > 0: sp:  ${sp02} pr: ${pr}`);
    }

    let value = {
      lowBattery: battery,
      packetNumber: '',
      missingData: '',
      pulseRate: pr,
      oxygen: sp02,
    };
    console.log(`Here is the value: ${JSON.stringify(value)}`);
    return { value, date: new Date().toISOString() };
  }

  getValuesFromBuffers() {
    let fullData = this.buffers.join(',');
    console.log(`Here is the fullData: ${fullData}`);
    let bufferString = fullData.replace(/170,/g, '\n170,');
    let bufferStrings = bufferString.split('\n');
    bufferStrings = bufferStrings.filter((x) => {
      let buffer = x.split(',').map((y) => +y);
      if (
        buffer[2] === 15 &&
        buffer[4] === 1 &&
        buffer[5] > 0 &&
        buffer[6] > 0
      ) {
        return x;
      }
    });
    if (bufferStrings.length > 9) {
      bufferStrings.reverse();
      let buffer = bufferStrings[0].split(',').map((x) => +x);
      this.buffers = new Array();
      return buffer;
    }
    return [];
  }
  // Disconnect peripheral when leaving the page
  ionViewWillLeave() {
    console.log('ionViewWillLeave disconnecting Bluetooth');
    this.BleDisconnect();
  }
}
