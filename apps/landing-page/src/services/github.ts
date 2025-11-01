export interface GitHubRepoStats {
   stargazers_count: number;
   forks_count: number;
   full_name: string;
   html_url: string;
}

export async function fetchGitHubRepoStats(): Promise<GitHubRepoStats> {
   const repoOwner = "F-O-T";
   const repoName = "contentagen-nx";
   const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;

   try {
      const response = await fetch(apiUrl, {
         headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "ContentaGen-Landing-Page",
         },
      });

      if (!response.ok) {
         throw new Error(`GitHub API request failed: ${response.status}`);
      }

      const data = await response.json();
      return {
         forks_count: data.forks_count || 0,
         full_name: data.full_name,
         html_url: data.html_url,
         stargazers_count: data.stargazers_count || 0,
      };
   } catch (error) {
      console.error("Error fetching GitHub repo stats:", error);
      // Return fallback values
      return {
         forks_count: 1,
         full_name: "F-O-T/contentagen-nx",
         html_url: "https://github.com/F-O-T/contentagen-nx",
         stargazers_count: 4,
      };
   }
}
