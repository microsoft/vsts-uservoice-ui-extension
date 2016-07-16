using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace UViz_Api.Models.UVApi
{
    public class SuggestionResponse
    {
        public string created_at { get; set; }
        public string formatted_text { get; set; }
        public string text { get; set; }
    }
}