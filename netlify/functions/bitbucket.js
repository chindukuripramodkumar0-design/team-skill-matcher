exports.handler = async function () {
  try {
    const token = process.env.BITBUCKET_TOKEN;

    if (!token) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "BITBUCKET_TOKEN is not configured"
        })
      };
    }

    const workspace = process.env.BITBUCKET_WORKSPACE || "team_skill_matching";
    const repo = process.env.BITBUCKET_REPO || "team-skill-matcher";

    // Get branches and pull requests
    const [branchesResponse, pullRequestsResponse] = await Promise.all([
      fetch(
        `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/refs/branches`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        }
      ),

      fetch(
        `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/pullrequests`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
          }
        }
      )
    ]);

    if (!branchesResponse.ok || !pullRequestsResponse.ok) {
      return {
        statusCode: 502,
        body: JSON.stringify({
          error: "Unable to retrieve data from Bitbucket"
        })
      };
    }

    const branches = await branchesResponse.json();
    const pullRequests = await pullRequestsResponse.json();

    // Get commits
    let commits = [];
    let commitsUrl =
      `https://api.bitbucket.org/2.0/repositories/${workspace}/${repo}/commits?pagelen=100`;

    let pageCount = 0;
    while (commitsUrl && pageCount < 5) {
      pageCount++;
      const commitsResponse = await fetch(commitsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });

      if (!commitsResponse.ok) {
        return {
          statusCode: 502,
          body: JSON.stringify({
            error: "Unable to retrieve commits from Bitbucket"
          })
        };
      }

      const commitsData = await commitsResponse.json();

      commits = commits.concat(commitsData.values || []);

      commitsUrl = commitsData.next || null;
    }

    // Calculate contributor statistics
    const contributorMap = {};

    commits.forEach(commit => {
      const authorName =
        commit.author?.user?.display_name ||
        commit.author?.raw ||
        "Unknown";

      if (!contributorMap[authorName]) {
        contributorMap[authorName] = {
          name: authorName,
          commits: 0,
          pullRequests: 0
        };
      }

      contributorMap[authorName].commits++;
    });

    // Count pull requests for each contributor
    (pullRequests.values || []).forEach(pr => {
      const authorName =
        pr.author?.display_name ||
        pr.author?.nickname ||
        "Unknown";

      if (!contributorMap[authorName]) {
        contributorMap[authorName] = {
          name: authorName,
          commits: 0,
          pullRequests: 0
        };
      }

      contributorMap[authorName].pullRequests++;
    });

    const contributors = Object.values(contributorMap);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        branches: branches.values || [],
        pullRequests: pullRequests.values || [],
        contributors: contributors
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Unexpected error while contacting Bitbucket. Check function logs and repository permissions."
      })
    };
  }
};