using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace UViz_Api.Models
{
    public class UVSuggestion
    {
        public int id { get; set; }
        public string title { get; set; }
        public string url { get; set; }
        public int votes { get; set; }
        public UVStatus status { get; set; }

    }
}