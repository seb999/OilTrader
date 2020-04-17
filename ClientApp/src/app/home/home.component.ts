import { Component } from '@angular/core';
import { List } from 'ts-generic-collections-linq';
import { HttpService, HttpSettings } from '../service/http.service';
import { ChartService } from '../service/chart.service';
import { WebsocketService } from "./../service/websocket.service";
import  {AppGlobal} from "./../app.global";

import * as Highcharts from 'highcharts';
import HC_HIGHSTOCK from 'highcharts/modules/stock';
import HC_INDIC from 'highcharts/indicators/indicators';
import HC_RSI from 'highcharts/indicators/rsi';
import HC_EMA from 'highcharts/indicators/ema';
import HC_MACD from 'highcharts/indicators/macd';
import HC_THEME from 'highcharts/themes/grid-light';

HC_HIGHSTOCK(Highcharts);
HC_INDIC(Highcharts);
HC_RSI(Highcharts);
HC_EMA(Highcharts);
HC_MACD(Highcharts);
HC_THEME(Highcharts);

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html'
})
export class HomeComponent {
  ohlc = [] as any;
  chartData = [] as any;
  liveChartData = [] as any;
  volume = [] as any;
  highcharts = Highcharts;
  highcharts2 = Highcharts;
  chartOptions: Highcharts.Options;
  chartOptions2: Highcharts.Options;
  resolutionList : Array<{}>;
  resolution: number;
  selectedResolution : any;
  oilLast: number;
  oilPreviousList: Array<number>;
  oilMin: number = 0;
  oilMax: number = 0;
  cx: number = 0;
  iteration: number = 0;
  isArrowDown: boolean = false;
  isArrowUp: boolean = false;
  isBuy: boolean = false;
  isSell: boolean = false;
  predictionList: Array<any>;

  constructor(
    private highLowList: List<number>,
    private socketService: WebsocketService,
    private httpService: HttpService,
    private appGlobal: AppGlobal
  ) {
  }

  async ngOnInit() {
    this.oilMax = 0;
    this.oilMin = 999;
    this.oilPreviousList = [0, 0, 0];
    this.iteration = 0;
    this.liveChartData.c = [];
    this.chartData = [];
    this.predictionList = [];
    this.predictionList.push({});
    this.predictionList[0].rsi = 0;
    this.predictionList[0].macd = 0;
    this.predictionList[0].macdHist = 0;
    this.predictionList[0].macdSign = 0;
    this.displayHighstock("NO_INDICATOR", 200, "5");
    this.displayHighchart("INIT");

    this.resolutionList = [
      { key: 1, value: "5,200" },
      { key: 2, value: "30,300" },
      { key: 3, value: "60,300" },
      { key: 4, value: "60,500" },
  ]
  this.selectedResolution = "5,200";
  }

  async displayHighstock(indicator: string, numberOfPoint: number, resolution: string) {
    this.chartData = [];
    this.volume = [];
    this.ohlc = await this.getIntradayData(numberOfPoint, resolution);

    this.ohlc.c.map((data, index) => {
      this.chartData.push([
        this.ohlc.t[index],
        this.ohlc.o[index],
        this.ohlc.h[index],
        this.ohlc.l[index],
        this.ohlc.c[index]
      ]),
        this.volume.push([
          this.ohlc.t[index],
          this.ohlc.v[index]
        ])
    });

    this.chartOptions = {
      plotOptions: {
        candlestick: {
          upColor: '#41c9ad',
          color: '#cb585f',
          upLineColor: '#41c9ad',
          lineColor: '#cb585f'
        },
      },
      yAxis:
        [
          { labels: { align: 'left' }, height: '80%' },
          { labels: { align: 'left' }, top: '80%', height: '20%', offset: 0 },
        ],
    }

    if (indicator == 'NO_INDICATOR') {
      this.chartOptions.series =
        [
          { data: this.chartData, type: 'candlestick', yAxis: 0, id: 'oil' },
          { data: this.volume, type: 'line', yAxis: 1 }
        ];
    }

    if (indicator == 'RSI') {
      this.chartOptions.series =
        [
          { data: this.chartData, type: 'candlestick', yAxis: 0, id: 'oil' },
          { type: 'rsi', yAxis: 1, linkedTo: 'oil', name: 'RSI' },
          { data: this.volume, type: 'line', yAxis: 2 }
        ]
    }

    if (indicator == 'MACD') {
      this.chartOptions.series =
        [
          { data: this.chartData, type: 'candlestick', yAxis: 0, id: 'oil' },
          { type: 'macd', yAxis: 1, linkedTo: 'oil', name: 'MACD' }
        ]
    }
  }

  changeHighstockResolution (key){
    let params = key.split(',');
    this.displayHighstock("NO_INDICATOR", params[1], params[0]);
  }

  async displayHighchart(type: string) {
    if (type == "INIT") {
      this.liveChartData = await this.getIntradayData(12, 5);
      this.liveChartData.color = [];

      //Init color
      this.liveChartData.c.map((data, index) => {
        this.liveChartData.color.push(0);
      });

      //Calculate min and max
      this.initMaxMin(this.liveChartData);
    }

    //Display chart
    this.chartOptions2 = {
      series: [{ data: this.liveChartData.c, type: 'line' }],
      title: {
        text: "Live"
      },
      xAxis: { type: 'datetime', dateTimeLabelFormats: { month: '%e. %b', year: '%b' }, title: { text: 'Date' } },
    };
  }

  start() {
    //We subscribe to WebSocket messages
    let i: number = 0;
    this.socketService.openListener(false);
    this.socketService.onMessage().subscribe((result: any) => {

      this.SaveIntradayData(result.data[0]);

      this.setColor(result.data[0].p);

      this.liveChartData.c.push(result.data[0].p);
      this.liveChartData.v.push(result.data[0].v);

      this.getPrediction(this.liveChartData).then((p) => {
        this.predictionList = p;
      });
      this.displayHighchart("CONTINUE");
      this.processLastData(result);
    });
  }

  pause = () => {
    this.socketService.openListener(true);
  }

  reset = () => {
    this.socketService.openListener(true);
    this.ngOnInit();
  }

  displayAIPrediction(data: any) {

  }

  processLastData(data: any) {
    this.iteration++;

    if (data.type == 'trade') {
      this.oilLast = Math.round(data.data[0].p * 100) / 100;
      console.log(this.oilLast);
    }
    else {
      return;
    }

    //Set Min/Max value
    if (this.oilLast > this.oilMax) {
      this.setMax(this.oilLast);
    }
    if (this.oilLast < this.oilMin) {
      this.setMin(this.oilLast);
    }

    //Plot last price
    this.cx = (this.oilLast - this.oilMin) * 320 / (this.oilMax - this.oilMin);

    //Show arrow Up/Down
    if (this.oilLast > this.oilPreviousList[0] && this.oilLast > this.oilPreviousList[1] && this.oilLast > this.oilPreviousList[2]) {
      this.isArrowUp = true;
      this.isArrowDown = false;
    }
    if (this.oilLast < this.oilPreviousList[0] && this.oilLast < this.oilPreviousList[1] && this.oilLast < this.oilPreviousList[2]) {
      this.isArrowUp = false;
      this.isArrowDown = true;
    }

    //Buy/Sell indicator
    if (this.oilLast < (this.oilMax - this.oilMin) / 9 + this.oilMin) this.isBuy = true; else this.isBuy = false;
    if (this.oilLast > (this.oilMax - this.oilMin) / 9 * 8 + this.oilMin) this.isSell = true; else this.isSell = false;

    //Update the history for the last 3 values
    for (let i = 0; i < 3; i++) {
      if (i == 2) { this.oilPreviousList[i] = this.oilLast; continue; }
      this.oilPreviousList[i] = this.oilPreviousList[i + 1];
    }
  }

  setColor(data: any) {
    if (data > this.liveChartData.c[this.liveChartData.c.length - 1]) {
      this.liveChartData.color.push(1);
    }
    if (data < this.liveChartData.c[this.liveChartData.c.length - 1]) {
      this.liveChartData.color.push(-1);
    }
    if (data == this.liveChartData.c[this.liveChartData.c.length - 1]) {
      this.liveChartData.color.push(0);
    }
  }

  setMax = (max: any) => {
    let snd = new Audio(this.appGlobal.soundUp);
    snd.play();

    this.oilMax = max;
    this.highLowList.add(max);

    //Re-evaluate min (adjust the max % 2.5)
    if ((this.highLowList.max(x => x) - this.highLowList.min(x => x)) / max * 100 > 1.4) {
      console.log("remove lower");
      this.highLowList.remove(p => p == this.highLowList.min(x => x));
      this.oilMin = this.highLowList.min(x => x);
    }
  }

  setMin = (min: any) => {
    let snd = new Audio(this.appGlobal.soundDown);
    snd.play();
    this.oilMin = min;
    this.highLowList.add(min);

    //Re-evaluate max adjust the max % 2.5
    if ((this.highLowList.max(x => x) - this.highLowList.min(x => x)) / min * 100 > 1.4) {
      console.log("remove higher");
      this.highLowList.remove(p => p == this.highLowList.max(x => x));
      this.oilMax = this.highLowList.max(x => x);
    }
  }

  initMaxMin(data: any) {
    data.c.forEach(item => {
      if (item > this.oilMax) {
        this.setMax(Math.round(item * 100) / 100);
      }
      if (item < this.oilMin) {
        this.setMin(Math.round(item * 100) / 100);
      }
    });
  }

  async getIntradayData(numberPoints, resolution): Promise<any> {
    const httpSetting: HttpSettings = {
      method: "GET",
      url: "https://finnhub.io/api/v1/forex/candle?symbol=OANDA:WTICO_USD&resolution=" + resolution + "&count=" + numberPoints + "&token=" + this.appGlobal.finnhubKey,
    };
    return await this.httpService.xhr(httpSetting);
  }

  async SaveIntradayData(data) {
    const httpSetting: HttpSettings = {
      method: "POST",
      data: data,
      url: "https://localhost:5001/api/Intraday/Add/",
    };
    return await this.httpService.xhr(httpSetting);
  }

  async getPrediction(data): Promise<any> {

    var myList = [];

    data.c.map((item, index) => {
      myList.push({
        Price: data.c[index],
        Volume: data.v[index],
      })
    });

    const httpSetting: HttpSettings = {
      method: "POST",
      data: myList,
      url: "https://localhost:5001/api/AI/GetPrediction",
    };
    return await this.httpService.xhr(httpSetting);
  }
}

