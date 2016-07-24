using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace UViz_Api.Models
{
    public class Comment
    {
        public string created_by { get; set; }
        public string created_at { get; set; }
        public string html { get; set; }
        public string text { get; set; }

    }
}