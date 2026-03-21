const axios = require("axios");

module.exports = {
  meta: {
    name: "GitHub User Search",
    description: "Search and get GitHub user profile information",
    author: "Jaybohol",
    version: "1.0.0",
    category: "random",
    method: "GET",
    path: "/github/user?username="
  },
  
  onStart: async function({ req, res }) {
    try {
      const { username } = req.query;
      
      if (!username) {
        return res.status(400).json({
          status: false,
          error: "Username parameter is required",
          usage: {
            example: "/github/user?username=torvalds",
            endpoints: {
              user: "/github/user?username=USERNAME",
              repos: "/github/repos?username=USERNAME",
              battle: "/github/battle?player1=USERNAME1&player2=USERNAME2"
            }
          }
        });
      }
      
      const APIURL = "https://api.github.com/users/";
      const { data } = await axios.get(APIURL + username, {
        headers: {
          'User-Agent': 'GitHub-API-Request'
        },
        timeout: 10000
      });
      
      // Get user's repositories for stats
      const reposResponse = await axios.get(APIURL + username + "/repos?per_page=100", {
        headers: { 'User-Agent': 'GitHub-API-Request' }
      });
      
      const totalStars = reposResponse.data.reduce((sum, repo) => sum + repo.stargazers_count, 0);
      const topRepos = reposResponse.data.slice(0, 5).map(repo => ({
        name: repo.name,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        language: repo.language
      }));
      
      // Calculate achievement badges
      const badges = [];
      if (data.followers >= 10000) badges.push("10K Club");
      if (data.public_repos >= 100) badges.push("Prolific");
      if (data.followers >= 1000) badges.push("Popular");
      if (data.public_repos >= 50) badges.push("Active");
      
      res.json({
        status: true,
        user: {
          login: data.login,
          name: data.name || data.login,
          bio: data.bio || "No bio available",
          avatar_url: data.avatar_url,
          html_url: data.html_url,
          location: data.location,
          company: data.company,
          blog: data.blog,
          twitter_username: data.twitter_username,
          created_at: data.created_at,
          updated_at: data.updated_at
        },
        stats: {
          followers: data.followers,
          following: data.following,
          public_repos: data.public_repos,
          public_gists: data.public_gists,
          total_stars: totalStars
        },
        top_repos: topRepos,
        badges: badges,
        timestamp: new Date().toISOString(),
        author: "Jaybohol"
      });
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          status: false,
          error: "No GitHub profile found with this username",
          username: req.query.username
        });
      }
      
      res.status(500).json({
        status: false,
        error: "Failed to fetch GitHub user data",
        details: error.message,
        author: "Jaybohol"
      });
    }
  }
};
