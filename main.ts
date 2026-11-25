// Entry program for the post-x-promote-make-your-own-bounty-01 bounty.
//
// The whole entry is a single post on X. This repository only has to hand
// that post's address to the grader: POST.json, kept at the repository
// root, names it, and running this file copies POST.json into the output
// directory the runner points at.
//
// The grader may launch the program from any working directory, so no
// path is ever taken from the process's cwd. The folder holding POST.json
// is MAKEFUN_BOT_DIR when the runner sets it, and this file's own folder
// otherwise. The destination is MAKEFUN_OUTPUT_DIR, falling back to
// /output. Nothing here touches the network or the clock, and the bytes
// written are exactly the bytes read, so two runs agree.

const fs = require("node:fs");
const path = require("node:path");

function envDir(name) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

function postFilePath() {
  const folder = envDir("MAKEFUN_BOT_DIR") || __dirname;
  return path.join(folder, "POST.json");
}

function checkPostAddress(raw) {
  let parsedJson;
  try {
    parsedJson = JSON.parse(raw.toString("utf8"));
  } catch (err) {
    throw new Error("POST.json is not valid JSON (" + err.message + ")");
  }
  const address =
    parsedJson && typeof parsedJson.url === "string" ? parsedJson.url : "";
  if (address === "") {
    throw new Error("POST.json has no url string");
  }
  let link;
  try {
    link = new URL(address);
  } catch (err) {
    throw new Error("the url in POST.json cannot be parsed: " + address);
  }
  const host = link.hostname.toLowerCase();
  const onX =
    host === "x.com" ||
    host.endsWith(".x.com") ||
    host === "twitter.com" ||
    host.endsWith(".twitter.com");
  if (link.protocol !== "https:" || !onX || !link.pathname.includes("/status/")) {
    throw new Error("the url in POST.json is not an X post address: " + address);
  }
  return address;
}

function run() {
  const source = postFilePath();
  let raw;
  try {
    raw = fs.readFileSync(source);
  } catch (err) {
    throw new Error("cannot read " + source + " (" + err.message + ")");
  }
  checkPostAddress(raw);
  const destinationDir = envDir("MAKEFUN_OUTPUT_DIR") || "/output";
  fs.mkdirSync(destinationDir, { recursive: true });
  const destination = path.join(destinationDir, "POST.json");
  fs.writeFileSync(destination, raw);
  // Read the copy back and compare it byte for byte with the source: a
  // short or altered write must fail the run, never hand the grader a
  // POST.json that differs from the one this repository carries.
  const written = fs.readFileSync(destination);
  if (!written.equals(raw)) {
    throw new Error("the copied POST.json differs from the source bytes");
  }
}

try {
  run();
} catch (err) {
  console.error("post entry failed: " + (err && err.message ? err.message : err));
  process.exit(1);
}
