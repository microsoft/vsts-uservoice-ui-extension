using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Script.Serialization;
using UViz_Api.Models;

namespace UViz_Api.Controllers
{
    public class ResponseJSON
    {
        public SuggestionJSON suggestion { get; set; }
    }

    public class SuggestionJSON
    {
        public string created_at { get; set; }
        public int comments_count { get; set; }
        public string formatted_text { get; set; }
        public int id { get; set; }
        public SuggestionResponseJSON response { get; set; }
        public SuggestionStatusJSON status { get; set; }
        public string text { get; set; }
        public string title { get; set; }
        public string url { get; set; }
        public int vote_count { get; set; }
    }

    public class SuggestionResponseJSON
    {
        public string created_at { get; set; }
        public string formatted_text { get; set; }
        public string text { get; set; }
    }

    public class SuggestionStatusJSON
    {
        public string hex_color { get; set; }
        public string name { get; set; }
    }

    public class SuggestionController : ApiController
    {

        public async Task<UVSuggestion> getItem(int id, string accountName, string apikey)
        {
            var url = $"https://{accountName}.uservoice.com/api/v1/suggestions/{id}.json?client={apikey}";

            using (var client = new HttpClient())
            {
                var response = await client.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {

                    var json = await response.Content.ReadAsStringAsync();
                    var jsonObject = new JavaScriptSerializer().Deserialize<ResponseJSON>(json);

                    return new UVSuggestion()
                    {
                        id = id,
                        title = jsonObject.suggestion.title,
                        url = jsonObject.suggestion.url,
                        votes = jsonObject.suggestion.vote_count,
                        status = new UVStatus()
                        {
                            name = jsonObject.suggestion.status?.name,
                            hex_color = jsonObject.suggestion.status?.hex_color
                        }
                    };

                }
                else
                {

                    return new UVSuggestion()
                    {
                        id = id,
                        title = response.ReasonPhrase,
                        votes = 0,
                        status = new UVStatus()
                        {
                            name = "Error",
                            hex_color = "#CC293D"
                        }
                    };

                }

            }
        }

    }
}
