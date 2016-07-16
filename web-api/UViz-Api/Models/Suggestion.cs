using System.Collections.Generic;

namespace UViz_Api.Models
{
    public class Suggestion
    {
        /// <summary>
        /// The id of the suggestion
        /// </summary>
        public int id { get; set; }

        /// <summary>
        /// The title of the suggestion
        /// </summary>
        public string title { get; set; }

        /// <summary>
        /// The html-formatted description of the suggestion
        /// </summary>
        public string description { get; set; }

        /// <summary>
        /// The public facing url to the suggestion
        /// </summary>
        public string url { get; set; }

        /// <summary>
        /// The number of votes for the suggestion
        /// </summary>
        public int votes { get; set; }

        /// <summary>
        /// The current status of the suggestion
        /// </summary>
        public Status status { get; set; }

        /// <summary>
        /// The list of the 10 most recently added comments
        /// </summary>
        public IEnumerable<Comment> most_recent_comments { get; set; }

        /// <summary>
        /// The last html-formatted response that goes with the status
        /// </summary>
        public string response { get; set; }

        /// <summary>
        /// The date when the status was changed last
        /// </summary>
        public string response_date { get; set; }

        /// <summary>
        /// The total number of comments on this suggestion
        /// </summary>
        public int total_comments { get; set; }
    }
}