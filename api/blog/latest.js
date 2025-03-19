// api/blog/latest.js
const { getBlogPosts } = require('../../services/blogService'); // Adjust this path as needed

module.exports = (req, res) => {
  try {
    const posts = getBlogPosts();
    const latestPosts = posts
      .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
      .slice(0, 3);
    
    res.status(200).json(latestPosts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
};