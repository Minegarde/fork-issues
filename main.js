import { context, getOctokit } from "@actions/github";
import core from "@actions/core";

const token = core.getInput("githubToken");
const source = {
	owner: core.getInput("sourceOwner") || context.repo.owner,
	repo: core.getInput("sourceRepo") || context.repo.repo,
};
const gh = getOctokit(token);

function getForkee() {
	const forkee = context.payload.forkee;
	const [owner, repo] = forkee.full_name.split("/");
	return {
		owner,
		repo,
	};
}

async function getAllIssues(owner, repo) {
	try {
		const response = await gh.rest.issues.listForRepo({
			owner,
			repo,
		});

		const issues = response.data;
		console.log("All Issues:");
		for (const issue of issues) {
			console.log(`Issue #${issue.number}: ${issue.title}`);
		}
	} catch (err) {
		core.setFailed(`Action failed with error ${err}`);
	}
}

async function createIssue(owner, repo, { title, body }) {
	const newIssue = await gh.rest.issues.create({
		owner,
		repo,
		title,
		body,
	});

	console.log("New Issue Created:");
	console.log(`Issue Number: ${newIssue.data.number}`);
	console.log(`Issue Title: ${newIssue.data.title}`);
}

async function copyAllIssues(owner, repo) {
	try {
		const forkee = getForkee();

		console.log("SOURCE:");
		console.log(`Owner: ${owner}, Repo: ${repo}\n\n`);
		console.log("FORKEE:");
		console.log(`Owner: ${forkee.owner}, Repo: ${forkee.repo}\n\n`);

		if (forkee.owner !== owner) {
			return;
		}

		const response = await gh.rest.issues.listForRepo({
			owner,
			repo,
		});

		const issues = response.data;
		console.log(issues);
		console.log("All Issues:");
		for (const issue of issues) {
			createIssue(forkee.owner, forkee.repo, {
				title: issue.title,
				body: issue.body,
			});
			console.log(`Issue #${issue.number}: ${issue.title}`);
		}
	} catch (err) {
		core.setFailed(`Action failed with error ${err}`);
	}
}

core.setOutput("created", getForkee());

copyAllIssues(source.owner, source.repo);
