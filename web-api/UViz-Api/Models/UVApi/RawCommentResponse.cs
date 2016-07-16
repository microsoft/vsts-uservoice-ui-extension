using System.Collections.Generic;

namespace UViz_Api.Models.UVApi
{
    public class RawCommentResponse
    {
        public IEnumerable<Comment> comments { get; set; }
        public ResponseData response_data { get; set; }
    }
}