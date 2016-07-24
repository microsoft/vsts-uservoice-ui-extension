using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Net.Http;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Script.Serialization;
using UViz_Api.Models;
using UVApi = UViz_Api.Models.UVApi;

namespace UViz_Api.Controllers
{
    public class SuggestionController : ApiController
    {

        public async Task<Suggestion> getItem(int id, string accountName, string apikey)
        {
            var url = $"https://{accountName}.uservoice.com/api/v1/suggestions/{id}.json?client={apikey}";

            using (var client = new HttpClient())
            {
                var response = await client.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {

                    var json = await response.Content.ReadAsStringAsync();
                    var jsonObject = new JavaScriptSerializer().Deserialize<UVApi.RawSuggestionResponse>(json);

                    return new Suggestion()
                    {
                        id = id,
                        title = jsonObject.suggestion.title,
                        description = jsonObject.suggestion.text,
                        description_html = jsonObject.suggestion.formatted_text,
                        url = jsonObject.suggestion.url,
                        votes = jsonObject.suggestion.vote_count,
                        status = new Status()
                        {
                            name = jsonObject.suggestion.status?.name,
                            hex_color = jsonObject.suggestion.status?.hex_color
                        },
                        response = jsonObject.suggestion.response?.text,
                        response_html = jsonObject.suggestion.response?.formatted_text,
                        response_date = FormatDate(jsonObject.suggestion.response?.created_at),
                        total_comments = jsonObject.suggestion.comments_count,
                        most_recent_comments = await getCommentsOfItem(jsonObject.suggestion.topic.forum.id, id, accountName, apikey)
                    };

                }
                else
                {

                    return new Suggestion()
                    {
                        id = id,
                        title = response.ReasonPhrase,
                        votes = 0,
                        status = new Status()
                        {
                            name = "Error",
                            hex_color = "#CC293D"
                        }
                    };

                }

            }
        }

        private async Task<IEnumerable<Comment>> getCommentsOfItem(int forumId, int id, string accountName, string apikey)
        {
            var url = $"https://{accountName}.uservoice.com/api/v1/forums/{forumId}/suggestions/{id}/comments.json?client={apikey}";

            using (var client = new HttpClient())
            {
                var response = await client.GetAsync(url);
                if (response.IsSuccessStatusCode)
                {

                    var json = await response.Content.ReadAsStringAsync();
                    var jsonObject = new JavaScriptSerializer().Deserialize<UVApi.RawCommentResponse>(json);

                    return from c in jsonObject.comments
                           select new Comment()
                           {
                               text = c.text,
                               html = c.formatted_text,
                               created_at = FormatDate(c.created_at),
                               created_by = c.creator.name
                           };
                }

                else
                {

                    return null;

                }

            }
        }

        private static string FormatDate(string dateString)
        {
            return !string.IsNullOrWhiteSpace(dateString) 
                ? DateTime.ParseExact(dateString, "yyyy/MM/dd HH:mm:ss +0000", CultureInfo.InvariantCulture).ToString("MMM dd, yyyy")
                : "";
        }

    }
}
