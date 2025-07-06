#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const ESA_ACCESS_TOKEN = process.env["ESA_ACCESS_TOKEN"];
if (!ESA_ACCESS_TOKEN) {
	console.error("ESA_ACCESS_TOKEN environment variable is not set");
	process.exit(1);
}

const authorizationHeader = new Headers({
	Authorization: `Bearer ${ESA_ACCESS_TOKEN}`,
});

const ESA_API_BASE = "https://api.esa.io";

const server = new McpServer({
	name: "esa",
	version: "0.1.0",
});

server.registerTool(
	"fetch-teams",
	{
		title: "Teams Fetcher",
		description: "Fetch esa teams",
	},
	async () => {
		try {
			const url = new URL("/v1/teams", ESA_API_BASE);
			const response = await fetch(url, {
				headers: authorizationHeader,
			});
			const data = await response.json();
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			if (error instanceof Error)
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};

			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `${error} was thrown`,
					},
				],
			};
		}
	},
);

const TeamName = z.string();
const Page = z.number().int().min(1).optional();
const PerPage = z.number().int().max(100).optional();

server.registerTool(
	"fetch-posts",
	{
		title: "Posts Fetcher",
		description: "Fetch esa posts",
		inputSchema: {
			teamName: TeamName,
			query: z.string().optional(),
			page: Page,
			perPage: PerPage,
		},
	},
	async ({ teamName, query, page, perPage }) => {
		try {
			const url = new URL(`/v1/teams/${teamName}/posts`, ESA_API_BASE);
			if (query) url.searchParams.append("q", query);
			if (page) url.searchParams.append("page", page.toString());
			if (perPage) url.searchParams.append("per_page", perPage.toString());
			const response = await fetch(url, {
				headers: authorizationHeader,
			});
			const data = await response.json();
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			if (error instanceof Error)
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};

			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `${error} was thrown`,
					},
				],
			};
		}
	},
);

const PostNumber = z.number().int().min(1);

server.registerTool(
	"fetch-post",
	{
		title: "Post Fetcher",
		description: "Fetch esa post",
		inputSchema: {
			teamName: TeamName,
			postNumber: PostNumber,
		},
	},
	async ({ teamName, postNumber }) => {
		try {
			const url = new URL(
				`/v1/teams/${teamName}/posts/${postNumber}`,
				ESA_API_BASE,
			);
			const response = await fetch(url, {
				headers: authorizationHeader,
			});
			const data = await response.json();
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			if (error instanceof Error)
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};

			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `${error} was thrown`,
					},
				],
			};
		}
	},
);

const Name = z.string();
const Markdown = z.string();
const Tags = z.string().array();
const Category = z.string();
const Wip = z.boolean();
const Message = z.string();
const User = z.string();

interface Post {
	name: string;
	body_md?: string;
	tags?: string[];
	category?: string;
	wip?: boolean;
	message?: string;
	user?: string;
	template_post_id?: number;
}

server.registerTool(
	"post-post",
	{
		title: "Post Poster",
		description: "Post esa post",
		inputSchema: {
			teamName: TeamName,
			name: Name,
			markdown: Markdown.optional(),
			tags: Tags.optional(),
			category: Category.optional(),
			wip: Wip.optional(),
			message: Message.optional(),
			user: User.optional(),
			templatePostId: PostNumber.optional(),
		},
	},
	async ({
		teamName,
		name,
		markdown,
		tags,
		category,
		wip,
		message,
		user,
		templatePostId,
	}) => {
		const post: Post = {
			name,
		};
		if (markdown) post.body_md = markdown;
		if (tags) post.tags = tags;
		if (category) post.category = category;
		if (wip) post.wip = wip;
		if (message) post.message = message;
		if (user) post.user = user;
		if (templatePostId) post.template_post_id = templatePostId;
		authorizationHeader.append("Content-Type", "application/json");
		try {
			const url = new URL(`/v1/teams/${teamName}/posts`, ESA_API_BASE);
			const response = await fetch(url, {
				method: "POST",
				body: JSON.stringify({ post }),
				headers: authorizationHeader,
			});
			const data = await response.json();
			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			if (error instanceof Error)
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};

			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `${error} was thrown`,
					},
				],
			};
		}
	},
);

interface EditedPost {
	name?: string;
	body_md?: string;
	tags?: string[];
	category?: string;
	wip?: boolean;
	message?: string;
	created_by?: string;
	updated_by?: string;
	original_revision?: {
		body_md?: string;
		number?: number;
		user?: string;
	};
}

server.registerTool(
	"edit-post",
	{
		title: "Post Editor",
		description: "Edit esa post",
		inputSchema: {
			teamName: TeamName,
			postNumber: PostNumber,
			name: Name.optional(),
			markdown: Markdown.optional(),
			tags: Tags.optional(),
			category: Category.optional(),
			wip: Wip.optional(),
			message: Message.optional(),
			createdBy: User.optional(),
			updatedBy: User.optional(),
			originalRevision: z.object({
				markdown: Markdown.optional(),
				number: PostNumber.optional(),
				user: User.optional(),
			}),
		},
	},
	async ({
		teamName,
		postNumber,
		name,
		markdown,
		tags,
		category,
		wip,
		message,
		createdBy,
		updatedBy,
		originalRevision,
	}) => {
		const post: EditedPost = {};
		if (name) post.name = name;
		if (markdown) post.body_md = markdown;
		if (tags) post.tags = tags;
		if (category) post.category = category;
		if (wip) post.wip = wip;
		if (message) post.message = message;
		if (createdBy) post.created_by = createdBy;
		if (updatedBy) post.updated_by = updatedBy;
		if (originalRevision) {
			post.original_revision = {};
			if (originalRevision.markdown)
				post.original_revision.body_md = originalRevision.markdown;
			if (originalRevision.number)
				post.original_revision.number = originalRevision.number;
			if (originalRevision.user)
				post.original_revision.user = originalRevision.user;
		}
		authorizationHeader.append("Content-Type", "application/json");
		try {
			const url = new URL(
				`/v1/teams/${teamName}/posts/${postNumber}`,
				ESA_API_BASE,
			);
			const response = await fetch(url, {
				method: "PATCH",
				body: JSON.stringify({ post }),
				headers: authorizationHeader,
			});
			const data = await response.json();
			if (!response.ok) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${data.message}`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: JSON.stringify(data, null, 2),
					},
				],
			};
		} catch (error) {
			if (error instanceof Error)
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};

			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `${error} was thrown`,
					},
				],
			};
		}
	},
);

server.registerTool(
	"delete-post",
	{
		title: "Post Deleter",
		description: "Delete esa post",
		inputSchema: {
			teamName: TeamName,
			postNumber: PostNumber,
		},
	},
	async ({ teamName, postNumber }) => {
		try {
			const url = new URL(
				`/v1/teams/${teamName}/posts/${postNumber}`,
				ESA_API_BASE,
			);
			const response = await fetch(url, {
				method: "DELETE",
				headers: authorizationHeader,
			});
			if (!response.ok) {
				const data = await response.json();
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${data.message}`,
						},
					],
				};
			}

			return {
				content: [
					{
						type: "text",
						text: "Post deleted",
					},
				],
			};
		} catch (error) {
			if (error instanceof Error)
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `Error: ${error.message}`,
						},
					],
				};

			return {
				isError: true,
				content: [
					{
						type: "text",
						text: `${error} was thrown`,
					},
				],
			};
		}
	},
);

async function main() {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	console.error("esa MCP Server running on stdio");
}

main().catch((error) => {
	console.error("Fatal error in main():", error);
	process.exit(1);
});
