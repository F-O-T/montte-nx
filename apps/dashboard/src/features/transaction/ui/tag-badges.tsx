import { Badge } from "@packages/ui/components/badge";
import { Link } from "@tanstack/react-router";

type TagBadgesProps = {
	tags: Array<{
		id: string;
		name: string;
		color: string;
	}>;
	asLinks?: boolean;
	slug?: string;
};

export function TagBadges({ tags, asLinks = false, slug }: TagBadgesProps) {
	return (
		<>
			{tags.map((tag) => {
				const badge = (
					<Badge
						className={
							asLinks
								? "cursor-pointer hover:opacity-80 transition-opacity"
								: undefined
						}
						style={{ backgroundColor: tag.color }}
						variant="secondary"
					>
						{tag.name}
					</Badge>
				);

				if (asLinks && slug) {
					return (
						<Link
							key={tag.id}
							params={{ slug, tagId: tag.id }}
							to="/$slug/tags/$tagId"
						>
							{badge}
						</Link>
					);
				}

				return <span key={tag.id}>{badge}</span>;
			})}
		</>
	);
}
