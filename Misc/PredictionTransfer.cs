using System;

namespace OilTrader.Misc
{
    public class PredictionTransfer
    {
        public string ModelName { get; set; }
        public float Future { get; set; }
        public float Rsi { get; set; }
        public float Macd { get; set; }
        public float MacdSign { get; set; }
        public float MacdHist { get; set; }
        public double Metrics { get; set; }
    }
}