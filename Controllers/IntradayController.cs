using System;
using System.Collections.Generic;
using System.Linq;
using OilTrader.Model;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json.Linq;

namespace OilTrader.Controllers
{
    public class IntradayController : Controller
    {
        private readonly ApplicationDbContext DbContext;

        public IntradayController([FromServices] ApplicationDbContext appDbContext)
        {
            DbContext = appDbContext;
        }

        [HttpGet]
        [Route("/api/[controller]")]
        public List<Intraday> Get()
        {
            return DbContext.Intraday.ToList();
        }

        [HttpPost]
        [Route("/api/[controller]/Add")]
        public List<Intraday> Add([FromBody]Intraday intraday)
        {
            Intraday newItem = new Intraday();
            newItem.P = intraday.P;
            newItem.V = intraday.V;
            newItem.dateAdded = DateTime.Now.ToString();
   
            DbContext.Add(newItem);
            //DbContext.SaveChanges();
            return DbContext.Intraday.ToList();
        }
    }
}
