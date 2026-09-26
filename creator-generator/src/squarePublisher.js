import { resolveApiKey, publish, printPublishSuccess } from "../../skills/binance/square-post/scripts/lib.mjs";

/**
 * Publish a text post or article to Binance Square.
 * @param {{ title?: string, text: string }} post - Post content
 * @returns {Promise<{ id: string|null, link: string|null }>}
 */
export async function publishToSquare(post) {
  const key = resolveApiKey([]);

  const contentType = post.title ? 2 : 1;
  const body = {
    contentType,
    bodyTextOnly: post.text,
  };
  if (post.title) body.title = post.title;

  console.log(post.title ? "Publishing article to Binance Square..." : "Publishing text post to Binance Square...");

  const result = await publish(key, body);
  printPublishSuccess(result);

  return {
    id: result.id ?? null,
    link: result.shareLink ?? null,
  };
}
