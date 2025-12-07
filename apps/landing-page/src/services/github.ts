export interface GitHubRepoStats {
   stargazers_count: number;
   forks_count: number;
   full_name: string;
   html_url: string;
   open_issues_count: number;
}

export interface GitHubContributor {
   id: number;
   login: string;
   avatar_url: string;
   html_url: string;
   contributions: number;
}

const REPO_OWNER = "F-O-T";
const REPO_NAME = "montte-nx";

export async function fetchGitHubRepoStats(): Promise<GitHubRepoStats> {
   const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`;

   try {
      const response = await fetch(apiUrl, {
         headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Montte-Landing-Page",
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
         open_issues_count: data.open_issues_count || 0,
         stargazers_count: data.stargazers_count || 0,
      };
   } catch (error) {
      console.error("Error fetching GitHub repo stats:", error);
      return {
         forks_count: 1,
         full_name: "F-O-T/montte-nx",
         html_url: "https://github.com/F-O-T/montte-nx",
         open_issues_count: 0,
         stargazers_count: 4,
      };
   }
}

export async function fetchGitHubContributors(
   limit = 10,
): Promise<GitHubContributor[]> {
   const apiUrl = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors?per_page=${limit}`;

   try {
      const response = await fetch(apiUrl, {
         headers: {
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Montte-Landing-Page",
         },
      });

      if (!response.ok) {
         throw new Error(`GitHub API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data
         .filter(
            (contributor: { contributions: number }) =>
               contributor.contributions >= 5,
         )
         .map(
            (contributor: {
               id: number;
               login: string;
               avatar_url: string;
               html_url: string;
               contributions: number;
            }) => ({
               avatar_url: contributor.avatar_url,
               contributions: contributor.contributions,
               html_url: contributor.html_url,
               id: contributor.id,
               login: contributor.login,
            }),
         );
   } catch (error) {
      console.error("Error fetching GitHub contributors:", error);
      return [];
   }
}
