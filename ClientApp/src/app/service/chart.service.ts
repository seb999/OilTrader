import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChartService {

  public static highStockSetting =   { 
  
    plotOptions: {
      candlestick: {
        upColor: '#41c9ad',
        color: '#cb585f',
        upLineColor: '#41c9ad',
        lineColor: '#cb585f'

      },
    },
  };

  public static highChartSetting =  {
    title: {
      text: "Live"
    },
  };

  constructor() { }
}
