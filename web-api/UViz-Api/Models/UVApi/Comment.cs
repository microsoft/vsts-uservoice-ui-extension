using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace UViz_Api.Models.UVApi
{
    public class Comment
    {
        public string id { get; set; }
        public string text { get; set; }
        public string formatted_text { get; set; }
        public string created_at { get; set; }
        public string updated_at { get; set; }
        public Creator creator { get; set; }
        public Suggestion suggestion { get; set; }
    }
}