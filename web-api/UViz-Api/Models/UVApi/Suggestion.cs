namespace UViz_Api.Models.UVApi
{
    public class Suggestion
    {
        public string created_at { get; set; }
        public int comments_count { get; set; }
        public string formatted_text { get; set; }
        public int id { get; set; }
        public SuggestionResponse response { get; set; }
        public SuggestionStatus status { get; set; }
        public string text { get; set; }
        public string title { get; set; }
        public SuggestionTopic topic { get; set; }
        public string url { get; set; }
        public int vote_count { get; set; }
    }
}